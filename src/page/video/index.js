import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom';
import './index.less'
import { Divider, Spin, message, BackTop } from 'antd'
import Discuss from '../../components/Discuss';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import { EditOutlined, EyeOutlined, CommentOutlined, TagOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils';
import 'react-quill/dist/quill.snow.css';
import Director from '../../components/director';
import videojs from "video.js";
import "video.js/dist/video-js.min.css";

/**
 * 视频内容
*/
function Video() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    // const [videoUrl, setVideoUrl] = useState('');
    const [videoInfo, setVideoInfo] = useState({
        title: '',
        content: '',
        createdAt: '',
        videocomments: [],
        viewCount: 0,
        goodCount: 0,
        tagList: '',
    });
    const videoRef = useRef(null);
    const userInfo = useSelector(state => state.user);
    const { content, title, poster, createdAt, viewCount, videocomments = [], collectionCount, isCollected } = videoInfo;

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        getArticle();
        return destroyVideo;
    }, [id]);

    // 销毁video实例
    const destroyVideo = () => {
        videoRef.current && videoRef.current.dispose();
    }

    //  获取文章详情
    const getArticle = async () => {
        let res = await request('/findVideoById', { data: { id: parseInt(id), owner: parseInt(userInfo.userId) } });
        if (res.status == 200) {
            let data = res.data;
            setVideoInfo(data);
            // setVideoUrl(data.videoUrl);
            initVideo(data.videoUrl, data.poster);
            // setTagList(JSON.parse(data.tagList));
        } else {
            message.error(res.errorMessage);
        }
    }

    const updateCollection = () => {
        if (isCollected) {
            deleteCollection();
        } else {
            addCollection();
        }
    }

    // 收藏
    const addCollection = async () => {
        if (userInfo.userId == -1) {
            message.info('请先登录,然后可添加收藏');
            return;
        }
        try {
            let data = {
                collectionVideoId: parseInt(id),
                owner: parseInt(userInfo.userId),
            }
            await request('/addVideoCollection', { data });
            message.success('添加收藏成功');
            setVideoInfo({ ...videoInfo, isCollected: true, collectionCount: collectionCount + 1 });
        } catch (err) {
            message.error('添加收藏失败:' + err);
            console.error(err);
        }
    }

    // 取消收藏
    const deleteCollection = async () => {
        try {
            let data = {
                collectionVideoId: parseInt(id),
                owner: parseInt(userInfo.userId),
            }
            await request('/deleteVideoCollection', { data });
            message.success('取消收藏成功');
            setVideoInfo({ ...videoInfo, isCollected: false, collectionCount: collectionCount - 1 });
        } catch (err) {
            message.error('取消收藏失败:' + err);
            console.error(err);
        }
    }

    //  刷新子组件传来的评论列表
    const setCommentList = (commentList) => {
        console.log(commentList)
        setVideoInfo({ ...videoInfo, videocomments: commentList });
    }

    const initVideo = (videoUrl, poster) => {
        const myPlayer = videojs("#myVideo", {
            controls: true, //是否显示控制条
            poster: poster ? poster : '', // 视频封面图地址
            muted: false, // 是否静音
            preload: 'auto', //预加载
            autoplay: false, //是否自动播放
            fluid: true, // 自适应宽高
            loop: false, //是否循环播放
            inactivityTimeout: false,
            language: 'zh-CN', // 设置语言
            playbackRates: [0.5, 1, 1.5, 2],
            currentTimeDisplay: true,
            controlBar: { // 设置控制条组件
                // currentTimeDisplay: true,   // 当前时间
                timeDivider: true,
                playToggle: true,   //  播放按钮
                // progressControl: true,  //  进度条
                volumePanel: {  //  音量控制
                    inline: true,
                },
            },
            sources: [ // 视频源
                {
                    src: videoUrl,
                    // src: 'http://www.alanarmstrong.xyz/videoPath/28e54aca6435b9af49a2f40c4c682ee9.mp4/28e54aca6435b9af49a2f40c4c682ee9.mp4.m3u8',
                    type: 'application/x-mpegURL',
                    poster: poster ? poster : '',
                },
            ]
        }, function onPlayReady() {
            console.log('视频可以播放啦~~~');
            /**
             * 监听内部事件
             */
            this.on("loadstart", function () {
                console.log("开始请求数据 ");
            })
            this.on("progress", function () {
                console.log("正在请求数据 ");
            })
            this.on("loadedmetadata", function () {
                console.log("获取资源长度完成 ")
            })
            this.on("canplaythrough", function () {
                console.log("视频源数据加载完成");

            })
            this.on("waiting", function () {
                console.log("等待数据")
            });
            this.on("play", function () {
                console.log("视频开始播放");
            });
            this.on("playing", function () {
                console.log("视频播放中");
            });
            this.on("pause", function () {
                console.log("视频暂停播放");
            });
            this.on("ended", function () {
                console.log("视频播放结束");
            });
            this.on("error", function () {
                console.log("加载错误");
            });
            this.on("seeking", function () {
                console.log("视频跳转中");
            })
            this.on("seeked", function () {
                console.log("视频跳转结束");
            })
            this.on("ratechange", function () {
                console.log("播放速率改变")
            });
            this.on("timeupdate", function () {
                console.log("播放时长改变");
            })
            this.on("volumechange", function () {
                var howLoudIsIt = myPlayer.volume();
                console.log("音量改变" + howLoudIsIt);
                localStorage.setItem("howLoudIsIt", howLoudIsIt);
            })
            this.on("stalled", function () {
                console.log("网速异常");
            })
        });
        // 设置缓存配置(音量)
        let cacheLoudIsIt = localStorage.getItem('howLoudIsIt') || 0.5;
        myPlayer.volume(cacheLoudIsIt);
        videoRef.current = myPlayer;
    }

    return (
        <Spin tip='加载中...' spinning={loading}>
            <article className='app-video'>
                <div className='post-header'>
                    <h1 className='post-title'>{title}</h1>
                    <div className='article-desc'>
                        <span className='post-time'>
                            <EditOutlined />
                            &nbsp; 发布于： &nbsp;
                            <span>{createdAt.slice(0, 10)}</span>
                        </span>
                        <Divider type='vertical' />
                        <a className='comment-count' href='#discuss' style={{ color: 'inherit' }}>
                            <CommentOutlined />
                            <span style={{ marginRight: 5 }}> {calcCommentsCount(videocomments)}</span>
                        </a>
                        <EyeOutlined style={{ margin: '0 2px 0 5px' }} />
                        <span style={{ marginRight: 5 }}>{viewCount}</span>
                        <span onClick={updateCollection} style={{ cursor: 'pointer' }}>
                            {isCollected ? <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} /> : <StarOutlined style={{ margin: '0 2px 0 5px' }} />}
                            <span style={{ marginRight: 5 }}>{collectionCount}</span>
                        </span>
                    </div>
                </div>
                <div className='post-content'>
                    <div className='article-detail'>
                        <div className='video_box'>
                            <video id="myVideo" className="video-js vjs-default-skin "></video>
                        </div>
                        <div className='video-description'>
                            <p>视频简介：</p>
                            <p>{content}</p>
                        </div>
                        <Discuss pageType={2} id={id} commentList={videocomments} setCommentList={setCommentList} />
                    </div>
                </div>
            </article>
            <BackTop />
        </Spin>
    )
}

export default Video
