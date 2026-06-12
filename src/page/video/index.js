import React, { useEffect, useRef, useState } from 'react';
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

/**
 * 视频内容
*/
function Video() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [collecting, setCollecting] = useState(false);
    const [playerError, setPlayerError] = useState(false);
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
    const videoElementRef = useRef(null);
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
    const tags = parseMaybeJsonArray(tagList);
    const commentTotal = calcCommentsCount(comments);

    const destroyVideo = () => {
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
    };

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
        setLoading(true);
        Promise.allSettled([getVideo(), getRecommendVideoList()])
            .catch((err) => {
                console.error(err);
                message.error('视频详情加载失败，请稍后再试');
            })
            .finally(() => setLoading(false));
        return destroyVideo;
    }, [id, userInfo.userId]);

    useEffect(() => {
        if (!videoUrl) {
            destroyVideo();
            return;
        }

        initVideo(videoUrl, poster, sourceType);
        return destroyVideo;
    }, [videoUrl, poster, sourceType, id]);

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

    const getRecommendVideoList = async (pageNum = 1, pageSize = 8, keyword = '') => {
        try {
            const res = await request('/getRecommendVideoList', { data: { pageNum, pageSize, keyword } });
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
                setVideoInfo(nextVideoInfo);
            } else {
                message.error(res.errorMessage);
            }
        } catch (err) {
            console.error(err);
            message.error('视频详情加载失败，请稍后再试');
        }
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

    const initVideo = (nextVideoUrl, nextPoster, nextSourceType) => {
        destroyVideo();
        setPlayerError(false);
        if (!nextVideoUrl || !videoElementRef.current) {
            setPlayerError(true);
            return;
        }

        const inferredType = nextSourceType || getVideoSourceType(nextVideoUrl);
        const source = {
            src: nextVideoUrl,
            ...(inferredType ? { type: inferredType } : {}),
        };

        const myPlayer = videojs(videoElementRef.current, {
            controls: true,
            poster: nextPoster || '',
            muted: false,
            preload: 'auto',
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
                    enableLowInitialPlaylist: true,
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
        });
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
                                        <video key={id} ref={videoElementRef} className='video-js vjs-default-skin alan-video-player' playsInline />
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
