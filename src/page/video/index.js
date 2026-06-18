import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './index.less';
import { BackTop, Button, Empty, Spin, Tag, message } from 'antd';
import Discuss from '../../components/Discuss';
import Recommend from '../../components/Recommend';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import {
    CalendarOutlined,
    CommentOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    StarOutlined,
    StarTwoTone,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { calcCommentsCount, normalizeComments, parseMaybeJsonArray } from '../../utils';
import 'react-quill/dist/quill.snow.css';
import videojs from 'video.js';
import 'video.js/dist/video-js.min.css';
import bilan from '../../assets/images/bilan.jpeg';

const getVideoSourceType = (url = '') => {
    const normalizedUrl = url.split('?')[0].toLowerCase();
    if (normalizedUrl.includes('.m3u8')) return 'application/x-mpegURL';
    if (normalizedUrl.includes('.mp4')) return 'video/mp4';
    return '';
};

const VIDEO_QUALITY_OPTIONS = [
    { value: '1080', label: '1080P 高清' },
    { value: '720', label: '720P 准高清' },
    { value: '360', label: '360P 流畅' },
    { value: 'auto', label: '自动' },
];

const NETWORK_QUALITY_TEXT = {
    360: '360P 流畅',
    720: '720P 准高清',
    1080: '1080P 高清',
    auto: '自动',
};

const getNetworkConnection = () => {
    if (typeof navigator === 'undefined') return null;
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
};

const getDefaultVideoQuality = () => {
    const connection = getNetworkConnection();
    if (!connection) return '720';

    const effectiveType = connection.effectiveType || '';
    const downlink = Number(connection.downlink || 0);

    if (connection.saveData || ['slow-2g', '2g'].includes(effectiveType) || (downlink > 0 && downlink < 1.5)) {
        return '360';
    }

    if (effectiveType === '4g' && (!downlink || downlink >= 4)) {
        return '1080';
    }

    if (downlink >= 5) {
        return '1080';
    }

    return '720';
};

const normalizeQuality = (quality) => {
    const text = String(quality || '').toLowerCase();
    if (text.includes('1080')) return '1080';
    if (text.includes('720')) return '720';
    if (text.includes('360')) return '360';
    if (text === 'sd') return '360';
    if (text === 'hd') return '720';
    if (text === 'fhd') return '1080';
    return '';
};

const getSourceUrl = (source) => {
    if (typeof source === 'string') return source;
    return source?.url || source?.src || source?.videoUrl || source?.playUrl || '';
};

const getSourceQuality = (source, fallbackQuality) => {
    if (typeof source === 'string') return normalizeQuality(fallbackQuality);
    return normalizeQuality(source?.quality || source?.resolution || source?.height || source?.label || source?.name || fallbackQuality);
};

const getSourceType = (source, url) => {
    if (typeof source === 'string') return getVideoSourceType(url);
    return source?.sourceType || source?.type || getVideoSourceType(url);
};

const normalizeQualitySources = (videoInfo = {}) => {
    const sources = [];
    const pushSource = (quality, url, sourceType) => {
        const normalizedQuality = normalizeQuality(quality);
        if (!normalizedQuality || !url) return;
        sources.push({
            quality: normalizedQuality,
            url,
            sourceType: sourceType || getVideoSourceType(url),
        });
    };

    const readSourceBlock = (block) => {
        if (!block) return;
        if (Array.isArray(block)) {
            block.forEach(item => {
                const url = getSourceUrl(item);
                pushSource(getSourceQuality(item), url, getSourceType(item, url));
            });
            return;
        }

        if (typeof block === 'object') {
            Object.entries(block).forEach(([quality, value]) => {
                const url = getSourceUrl(value);
                pushSource(getSourceQuality(value, quality), url, getSourceType(value, url));
            });
        }
    };

    [
        videoInfo.videoSources,
        videoInfo.videoSource,
        videoInfo.sources,
        videoInfo.qualitySources,
        videoInfo.qualityUrls,
        videoInfo.videoUrls,
        videoInfo.urls,
        videoInfo.resolutionUrls,
        videoInfo.transcodeUrls,
    ].forEach(readSourceBlock);

    pushSource('360', videoInfo.videoUrl360 || videoInfo.video360Url || videoInfo.url360 || videoInfo.p360Url, videoInfo.sourceType360);
    pushSource('720', videoInfo.videoUrl720 || videoInfo.video720Url || videoInfo.url720 || videoInfo.p720Url, videoInfo.sourceType720);
    pushSource('1080', videoInfo.videoUrl1080 || videoInfo.video1080Url || videoInfo.url1080 || videoInfo.p1080Url, videoInfo.sourceType1080);

    return sources.filter((item, index, list) => (
        list.findIndex(source => source.quality === item.quality) === index
    ));
};

const getSelectedVideoSource = (qualitySources, selectedQuality, fallbackUrl, fallbackType) => {
    if (isMasterPlaylistUrl(fallbackUrl)) {
        if (selectedQuality !== 'auto') {
            const matchedSource = qualitySources.find(item => item.quality === selectedQuality);
            if (matchedSource) return matchedSource;
        }

        return {
            quality: 'auto',
            url: fallbackUrl,
            sourceType: fallbackType || getVideoSourceType(fallbackUrl),
        };
    }

    if (selectedQuality !== 'auto') {
        const matchedSource = qualitySources.find(item => item.quality === selectedQuality);
        if (matchedSource) return matchedSource;
    }

    return {
        quality: 'auto',
        url: fallbackUrl,
        sourceType: fallbackType || getVideoSourceType(fallbackUrl),
    };
};

const getPlayerRepresentations = (player) => {
    const tech = typeof player?.tech === 'function' ? player.tech({ IWillNotUseThisInPlugins: true }) : null;
    const vhs = tech?.vhs || tech?.hls;
    if (typeof vhs?.representations !== 'function') return [];
    return vhs.representations() || [];
};

const getPlayerVhs = (player) => {
    const tech = typeof player?.tech === 'function' ? player.tech({ IWillNotUseThisInPlugins: true }) : null;
    return tech?.vhs || tech?.hls || null;
};

const lockVhsPlaylist = (vhs, playlist) => {
    if (!vhs || !playlist || typeof vhs.selectPlaylist !== 'function') return;
    if (!vhs.__alanDefaultSelectPlaylist) {
        vhs.__alanDefaultSelectPlaylist = vhs.selectPlaylist;
    }
    vhs.__alanLockedPlaylist = playlist;
    vhs.selectPlaylist = function selectLockedPlaylist() {
        return this.__alanLockedPlaylist || this.__alanDefaultSelectPlaylist?.();
    };
};

const restoreVhsPlaylistSelector = (vhs) => {
    if (!vhs?.__alanDefaultSelectPlaylist) return;
    vhs.selectPlaylist = vhs.__alanDefaultSelectPlaylist;
    delete vhs.__alanDefaultSelectPlaylist;
    delete vhs.__alanLockedPlaylist;
};

const getQualityDisplayText = (quality) => NETWORK_QUALITY_TEXT[quality] || `${quality}P`;

const getQualityMenuOptions = (supportedQualities = []) => {
    const supportedSet = new Set(supportedQualities.map(item => String(item)));
    return VIDEO_QUALITY_OPTIONS.filter(item => item.value === 'auto' || supportedSet.size === 0 || supportedSet.has(item.value));
};

const isMasterPlaylistUrl = (url = '') => url.split('?')[0].toLowerCase().endsWith('/master.m3u8');

const getInferredQualitySources = (masterUrl = '') => {
    if (!isMasterPlaylistUrl(masterUrl)) return [];
    return ['360', '720', '1080'].map(quality => ({
        quality,
        url: masterUrl.replace(/master\.m3u8(\?.*)?$/i, `${quality}p/index.m3u8$1`),
        sourceType: 'application/x-mpegURL',
    }));
};

const resolveM3u8Url = (url, baseUrl) => {
    try {
        return new URL(url, baseUrl).href;
    } catch (error) {
        return url;
    }
};

const parseMasterPlaylistSources = (playlistText = '', masterUrl = '') => {
    const lines = playlistText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const sources = [];

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!line.startsWith('#EXT-X-STREAM-INF')) continue;

        const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/i);
        const nameMatch = line.match(/NAME="?([^",]+)"?/i);
        const quality = normalizeQuality(resolutionMatch?.[1] || nameMatch?.[1] || '');
        if (!quality) continue;

        const uri = lines.slice(index + 1).find(item => item && !item.startsWith('#'));
        if (!uri) continue;

        sources.push({
            quality,
            url: resolveM3u8Url(uri, masterUrl),
            sourceType: 'application/x-mpegURL',
        });
    }

    return sources.filter((item, index, list) => (
        ['360', '720', '1080'].includes(item.quality)
        && list.findIndex(source => source.quality === item.quality) === index
    ));
};

const getFallbackQuality = (targetQuality, availableQualities = []) => {
    const numericQualities = availableQualities.map(item => Number(item)).filter(Boolean).sort((a, b) => a - b);
    if (!numericQualities.length) return 'auto';

    const targetHeight = Number(targetQuality);
    if (!targetHeight) return String(numericQualities[numericQualities.length - 1]);

    const lowerOrEqual = numericQualities.filter(item => item <= targetHeight);
    return String((lowerOrEqual.length > 0 ? lowerOrEqual : numericQualities)[(lowerOrEqual.length > 0 ? lowerOrEqual : numericQualities).length - 1]);
};

/**
 * 视频内容
*/
function Video() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [playerError, setPlayerError] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState(() => getDefaultVideoQuality());
    const [activeQuality, setActiveQuality] = useState(() => getDefaultVideoQuality());
    const [playerReloadKey, setPlayerReloadKey] = useState(0);
    const [hlsQualitySources, setHlsQualitySources] = useState([]);
    const [recommendVideoListData, setRecommendVideoList] = useState([]);
    const [videoInfo, setVideoInfo] = useState({
        title: '',
        content: '',
        createdAt: '',
        comments: [],
        viewCount: 0,
        collectionCount: 0,
        isCollected: false,
        tagList: '',
        poster: '',
        videoUrl: '',
        sourceType: '',
    });
    const playerRef = useRef(null);
    const videoContainerRef = useRef(null);
    const selectedQualityRef = useRef(selectedQuality);
    const manualQualityRef = useRef(false);
    const resumePlaybackRef = useRef(null);
    const userInfo = useSelector(state => state.user);
    const {
        content,
        title,
        poster,
        createdAt = '',
        viewCount = 0,
        comments = [],
        collectionCount = 0,
        isCollected,
        tagList,
        videoUrl,
        sourceType,
    } = videoInfo;
    const qualitySources = useMemo(() => {
        const explicitSources = normalizeQualitySources(videoInfo);
        const inferredSources = hlsQualitySources.length > 0 ? hlsQualitySources : getInferredQualitySources(videoUrl);
        return [...explicitSources, ...inferredSources].filter((item, index, list) => (
            list.findIndex(source => source.quality === item.quality) === index
        ));
    }, [hlsQualitySources, videoInfo, videoUrl]);
    const currentVideoSource = useMemo(() => (
        getSelectedVideoSource(qualitySources, selectedQuality, videoUrl, sourceType)
    ), [qualitySources, selectedQuality, sourceType, videoUrl]);
    const playableVideoUrl = currentVideoSource.url;
    const playableSourceType = currentVideoSource.sourceType;
    const tags = parseMaybeJsonArray(tagList);
    const commentTotal = calcCommentsCount(comments);

    const destroyVideo = () => {
        if (playerRef.current) {
            try {
                playerRef.current.pause();
                playerRef.current.reset?.();
            } catch (error) {
                console.warn('reset video player failed', error);
            }
            playerRef.current.dispose();
            playerRef.current = null;
        }
        videoContainerRef.current?.replaceChildren();
    };

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
        setLoading(true);
        loadVideoPage()
            .catch((err) => {
                console.error(err);
                message.error('视频详情加载失败，请稍后再试');
            })
            .finally(() => setLoading(false));
        return destroyVideo;
    }, [id, userInfo.userId]);

    useEffect(() => {
        selectedQualityRef.current = selectedQuality;
    }, [selectedQuality]);

    useEffect(() => {
        setHlsQualitySources([]);
        if (!videoUrl || !videoUrl.split('?')[0].toLowerCase().endsWith('/master.m3u8')) return undefined;

        const controller = new AbortController();
        fetch(videoUrl, { signal: controller.signal })
            .then(response => (response.ok ? response.text() : ''))
            .then(text => {
                if (!text) return;
                const parsedSources = parseMasterPlaylistSources(text, videoUrl);
                if (parsedSources.length > 0) {
                    setHlsQualitySources(parsedSources);
                }
            })
            .catch(error => {
                if (error?.name !== 'AbortError') {
                    console.warn('parse video quality playlist failed', error);
                }
            });

        return () => controller.abort();
    }, [videoUrl]);

    useEffect(() => {
        const connection = getNetworkConnection();
        if (!connection || typeof connection.addEventListener !== 'function') return undefined;

        const handleConnectionChange = () => {
            if (!manualQualityRef.current) {
                const nextQuality = getDefaultVideoQuality();
                setSelectedQuality(nextQuality);
                setActiveQuality(nextQuality);
            }
        };

        connection.addEventListener('change', handleConnectionChange);
        return () => connection.removeEventListener('change', handleConnectionChange);
    }, []);

    useEffect(() => {
        if (!playableVideoUrl) {
            destroyVideo();
            return;
        }

        initVideo(playableVideoUrl, poster, playableSourceType);
        return destroyVideo;
    }, [playableVideoUrl, poster, playableSourceType, id, playerReloadKey]);

    useEffect(() => {
        if (playerRef.current) {
            syncPlayerQuality(playerRef.current, selectedQuality);
        }
    }, [selectedQuality]);

    useEffect(() => {
        if (selectedQuality === 'auto' || qualitySources.length === 0) return;
        const availableQualities = qualitySources.map(item => item.quality);
        if (availableQualities.includes(selectedQuality)) return;
        setSelectedQuality(getFallbackQuality(selectedQuality, availableQualities));
    }, [qualitySources, selectedQuality]);

    const getComments = async () => {
        try {
            const res = await request('/comments', {
                method: 'get',
                data: {
                    targetType: 'video',
                    targetId: parseInt(id),
                    pageNum: 1,
                    pageSize: 20,
                },
            });
            if (res.status == 200) {
                return normalizeComments(res.data);
            }
        } catch (err) {
            console.error(err);
        }
        return null;
    };

    const loadVideoPage = async () => {
        const nextVideoInfo = await getVideo();
        const partition = nextVideoInfo?.partition || 'codeStudy';
        await getRecommendVideoList(1, 8, '', partition);
    };

    const getRecommendVideoList = async (pageNum = 1, pageSize = 8, keyword = '', partition = 'codeStudy') => {
        try {
            const res = await request('/getRecommendVideoList', { data: { pageNum, pageSize, keyword, partition } });
            if (res?.data?.rows) {
                setRecommendVideoList(res.data.rows.filter(item => String(item.id) !== String(id)));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getVideo = async () => {
        try {
            const res = await request('/findVideoById', {
                data: {
                    id: parseInt(id),
                    owner: parseInt(userInfo.userId),
                },
            });
            if (res.status == 200) {
                const data = res.data || {};
                const pagedComments = await getComments();
                const nextVideoInfo = {
                    ...data,
                    comments: pagedComments !== null ? pagedComments : normalizeComments(data),
                    collectionCount: data.collectionCount || 0,
                };
                const nextQuality = getDefaultVideoQuality();
                manualQualityRef.current = false;
                setSelectedQuality(nextQuality);
                setActiveQuality(nextQuality);
                setVideoInfo(nextVideoInfo);
                return nextVideoInfo;
            } else {
                message.error(res.errorMessage);
            }
        } catch (err) {
            console.error(err);
            message.error('视频详情加载失败，请稍后再试');
        }
        return null;
    };

    const updateCollection = () => {
        if (collecting) return;
        if (isCollected) {
            deleteCollection();
        } else {
            addCollection();
        }
    };

    const addCollection = async () => {
        if (!userInfo.userId || userInfo.userId == -1) {
            message.info('请先登录后再收藏');
            return;
        }
        try {
            setCollecting(true);
            await request('/addVideoCollection', {
                data: {
                    collectionVideoId: parseInt(id),
                    owner: parseInt(userInfo.userId),
                },
            });
            message.success('添加收藏成功');
            setVideoInfo(prev => ({
                ...prev,
                isCollected: true,
                collectionCount: (prev.collectionCount || 0) + 1,
            }));
        } catch (err) {
            message.error('添加收藏失败');
            console.error(err);
        } finally {
            setCollecting(false);
        }
    };

    const deleteCollection = async () => {
        if (!userInfo.userId || userInfo.userId == -1) {
            message.info('请先登录后再操作');
            return;
        }
        try {
            setCollecting(true);
            await request('/deleteVideoCollection', {
                data: {
                    collectionVideoId: parseInt(id),
                    owner: parseInt(userInfo.userId),
                },
            });
            message.success('取消收藏成功');
            setVideoInfo(prev => ({
                ...prev,
                isCollected: false,
                collectionCount: Math.max((prev.collectionCount || 0) - 1, 0),
            }));
        } catch (err) {
            message.error('取消收藏失败');
            console.error(err);
        } finally {
            setCollecting(false);
        }
    };

    const setCommentList = (commentList) => {
        setVideoInfo(prevVideoInfo => ({
            ...prevVideoInfo,
            comments: normalizeComments({ comments: commentList }),
        }));
    };

    const renderQualityControl = (player, selected, active, supportedQualities = []) => {
        const controlBar = player?.controlBar?.el?.();
        if (!controlBar) return;

        let control = controlBar.querySelector('.vjs-quality-control');
        if (!control) {
            control = document.createElement('div');
            control.className = 'vjs-quality-control vjs-control';
            const insertBefore = controlBar.querySelector('.vjs-playback-rate')
                || controlBar.querySelector('.vjs-picture-in-picture-control')
                || controlBar.querySelector('.vjs-fullscreen-control');
            controlBar.insertBefore(control, insertBefore);
        }

        control.innerHTML = '';
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'vjs-quality-trigger';
        trigger.textContent = getQualityDisplayText(active);
        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-expanded', 'false');

        const menu = document.createElement('div');
        menu.className = 'vjs-quality-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', '视频清晰度');

        getQualityMenuOptions(supportedQualities).forEach(item => {
            const menuItem = document.createElement('button');
            menuItem.type = 'button';
            menuItem.className = `vjs-quality-menu-item ${item.value === selected || item.value === active ? 'is-active' : ''}`;
            menuItem.textContent = item.label;
            menuItem.setAttribute('role', 'menuitemradio');
            menuItem.setAttribute('aria-checked', String(item.value === selected || item.value === active));
            menuItem.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                control.classList.remove('is-open');
                control.classList.add('is-locked-closed');
                trigger.setAttribute('aria-expanded', 'false');
                handleQualityChange(item.value);
            });
            menu.appendChild(menuItem);
        });

        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            control.classList.remove('is-locked-closed');
            const nextOpen = !control.classList.contains('is-open');
            control.classList.toggle('is-open', nextOpen);
            trigger.setAttribute('aria-expanded', String(nextOpen));
        });

        control.onmouseleave = () => {
            control.classList.remove('is-open');
            control.classList.remove('is-locked-closed');
            trigger.setAttribute('aria-expanded', 'false');
        };
        control.appendChild(menu);
        control.appendChild(trigger);
    };

    const syncPlayerQuality = (player, quality) => {
        const vhs = getPlayerVhs(player);
        const representations = getPlayerRepresentations(player);
        const hlsQualities = Array.from(new Set(
            representations
                .map(item => Number(item.height))
                .filter(Boolean)
                .sort((a, b) => a - b)
        )).map(String);
        const sourceQualities = qualitySources.map(item => item.quality);
        const supportedQualities = hlsQualities.length > 0 ? hlsQualities : sourceQualities;

        if (!representations.length) {
            setActiveQuality(quality);
            renderQualityControl(player, quality, quality, supportedQualities);
            return;
        }

        if (quality === 'auto') {
            restoreVhsPlaylistSelector(vhs);
            representations.forEach(item => {
                if (item.playlist) {
                    delete item.playlist.disabled;
                } else {
                    item.enabled(true);
                }
            });
            vhs?.playlistController_?.fastQualityChange_?.();
            setActiveQuality('auto');
            renderQualityControl(player, quality, 'auto', supportedQualities);
            return;
        }

        const heights = hlsQualities.map(item => Number(item));
        if (!heights.length) {
            setActiveQuality(quality);
            renderQualityControl(player, quality, quality, supportedQualities);
            return;
        }

        const targetHeight = Number(quality);
        const selectedHeight = heights.includes(targetHeight)
            ? targetHeight
            : heights.reduce((closestHeight, currentHeight) => (
                Math.abs(currentHeight - targetHeight) < Math.abs(closestHeight - targetHeight) ? currentHeight : closestHeight
            ), heights[0]);
        const targetRepresentation = representations.find(item => Number(item.height) === selectedHeight);

        if (targetRepresentation?.playlist && vhs?.playlistController_?.fastQualityChange_) {
            representations.forEach(item => {
                if (!item.playlist) return;
                if (Number(item.height) === selectedHeight) {
                    delete item.playlist.disabled;
                } else {
                    item.playlist.disabled = true;
                }
            });
            lockVhsPlaylist(vhs, targetRepresentation.playlist);
            vhs.playlistController_.fastQualityChange_(targetRepresentation.playlist);
        } else {
            restoreVhsPlaylistSelector(vhs);
            representations.forEach(item => {
                item.enabled(Number(item.height) === selectedHeight);
            });
        }
        setActiveQuality(String(selectedHeight));
        renderQualityControl(player, quality, String(selectedHeight), supportedQualities);
    };

    const handleQualityChange = (quality) => {
        const qualityControl = playerRef.current?.controlBar?.el?.()?.querySelector('.vjs-quality-control');
        if (qualityControl) {
            qualityControl.classList.remove('is-open');
            qualityControl.classList.add('is-locked-closed');
            qualityControl.querySelector('.vjs-quality-trigger')?.setAttribute('aria-expanded', 'false');
        }

        if (quality === selectedQuality) {
            if (playerRef.current) {
                resumePlaybackRef.current = {
                    time: playerRef.current.currentTime(),
                    shouldPlay: !playerRef.current.paused(),
                };
            }
            setPlayerReloadKey(prevKey => prevKey + 1);
            return;
        }

        if (playerRef.current) {
            resumePlaybackRef.current = {
                time: playerRef.current.currentTime(),
                shouldPlay: !playerRef.current.paused(),
            };
        } else {
            resumePlaybackRef.current = null;
        }

        manualQualityRef.current = true;
        setSelectedQuality(quality);
        setPlayerReloadKey(prevKey => prevKey + 1);
    };

    const initVideo = (nextVideoUrl, nextPoster, nextSourceType) => {
        destroyVideo();
        setPlayerError(false);
        if (!nextVideoUrl || !videoContainerRef.current) {
            setPlayerError(true);
            return;
        }

        const videoElement = document.createElement('video');
        videoElement.className = 'video-js vjs-default-skin alan-video-player';
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoContainerRef.current.appendChild(videoElement);

        const inferredType = nextSourceType || getVideoSourceType(nextVideoUrl);
        const source = {
            src: nextVideoUrl,
            ...(inferredType ? { type: inferredType } : {}),
        };

        const myPlayer = videojs(videoElement, {
            controls: true,
            poster: nextPoster || '',
            muted: false,
            preload: 'metadata',
            autoplay: false,
            fluid: false,
            width: 800,
            height: 430,
            loop: false,
            inactivityTimeout: false,
            language: 'zh-CN',
            playbackRates: [0.5, 1, 1.5, 2],
            html5: {
                vhs: {
                    // 后端现在返回 master.m3u8，开启 VHS 后 video.js 会自动选择合适清晰度
                    overrideNative: true,
                    enableLowInitialPlaylist: false,
                    smoothQualityChange: true,
                },
            },
            controlBar: {
                timeDivider: true,
                playToggle: true,
                volumePanel: {
                    inline: true,
                },
            },
            sources: [source],
        });

        myPlayer.ready(() => {
            const cacheVolume = Number(localStorage.getItem('howLoudIsIt'));
            myPlayer.volume(Number.isFinite(cacheVolume) ? cacheVolume : 0.5);
            const resumeState = resumePlaybackRef.current;
            if (resumeState?.time > 0) {
                myPlayer.currentTime(resumeState.time);
            }
            if (resumeState?.shouldPlay) {
                myPlayer.play()?.catch(() => {});
            }
            resumePlaybackRef.current = null;
            syncPlayerQuality(myPlayer, selectedQualityRef.current);
        });
        myPlayer.on('loadedmetadata', () => syncPlayerQuality(myPlayer, selectedQualityRef.current));
        myPlayer.on('loadeddata', () => syncPlayerQuality(myPlayer, selectedQualityRef.current));
        myPlayer.on('canplay', () => syncPlayerQuality(myPlayer, selectedQualityRef.current));
        myPlayer.on('volumechange', () => {
            localStorage.setItem('howLoudIsIt', myPlayer.volume());
        });
        myPlayer.on('error', () => {
            setPlayerError(true);
        });
        playerRef.current = myPlayer;
    };

    return (
        <Spin tip='加载中...' spinning={loading}>
            <article className='app-video'>
                <div className='video-page-shell'>
                    <section className='video-ticket-hero'>
                        <div className='video-film-strip' aria-hidden='true'>
                            {Array.from({ length: 18 }).map((_, index) => <span key={index} />)}
                        </div>
                        <div className='video-ticket-layout'>
                            <div className='video-poster-ticket'>
                                <img src={poster || bilan} alt='视频票根封面' />
                                <div className='poster-ticket-mark'>
                                    <PlayCircleOutlined />
                                    <span>NOW SHOWING</span>
                                </div>
                            </div>
                            <div className='video-title-ticket'>
                                <span className='video-kicker'>
                                    <VideoCameraOutlined />
                                    私人放映票
                                </span>
                                <h1 className='post-title'>{title || '视频正在加载'}</h1>
                                <div className='video-meta-strip'>
                                    <span>
                                        <CalendarOutlined />
                                        {createdAt ? createdAt.slice(0, 10) : '待发布'}
                                    </span>
                                    <a href='#discuss'>
                                        <CommentOutlined />
                                        {commentTotal}
                                    </a>
                                    <span>
                                        <EyeOutlined />
                                        {viewCount}
                                    </span>
                                    <button className='video-collect-inline' type='button' onClick={updateCollection} disabled={collecting}>
                                        {isCollected ? <StarTwoTone twoToneColor='#d8688a' /> : <StarOutlined />}
                                        {collectionCount}
                                    </button>
                                </div>
                                {tags.length > 0 ? (
                                    <div className='video-tag-row'>
                                        {tags.map(item => <Tag key={item}>{item}</Tag>)}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    <section className='video-watch-grid'>
                        <div className='video-watch-main'>
                            <div className='video-player-shell'>
                                <div className='video-player-frame'>
                                    {videoUrl ? (
                                        <div ref={videoContainerRef} className='video-js-host' />
                                    ) : (
                                        <div className='video-empty-player'>
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='视频地址暂不可用' />
                                        </div>
                                    )}
                                </div>
                                {playerError ? (
                                    <div className='video-player-alert'>
                                        播放器暂时无法读取视频源，请稍后再试。
                                    </div>
                                ) : null}
                            </div>

                            <div className='video-description-panel'>
                                <div>
                                    <span className='panel-label'>视频简介</span>
                                    <h2>关于这支视频</h2>
                                </div>
                                <p>{content || '暂无简介。'}</p>
                            </div>

                            <Discuss pageType={2} id={id} commentList={comments} setCommentList={setCommentList} />
                        </div>

                        <aside className='video-side-column'>
                            <div className='video-status-card'>
                                <span className='panel-label'>播放状态</span>
                                <strong>{isCollected ? '已经收入收藏' : '正在等待收藏'}</strong>
                                <Button
                                    type='primary'
                                    className='video-collect-button'
                                    icon={isCollected ? <StarTwoTone twoToneColor='#fff' /> : <StarOutlined />}
                                    loading={collecting}
                                    onClick={updateCollection}
                                >
                                    {isCollected ? '取消收藏' : '收藏视频'}
                                </Button>
                                <div className='video-stat-list'>
                                    <div>
                                        <span>{viewCount}</span>
                                        <p>观看</p>
                                    </div>
                                    <div>
                                        <span>{commentTotal}</span>
                                        <p>讨论</p>
                                    </div>
                                    <div>
                                        <span>{collectionCount}</span>
                                        <p>收藏</p>
                                    </div>
                                </div>
                            </div>
                            {recommendVideoListData.length > 0 ? (
                                <Recommend type={3} articleList={recommendVideoListData} />
                            ) : null}
                        </aside>
                    </section>
                </div>
            </article>
            <BackTop />
        </Spin>
    );
}

export default Video;
