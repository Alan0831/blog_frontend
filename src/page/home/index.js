import React, { useEffect, useState, useRef } from 'react'
import { message, Input, Pagination, Spin, Button } from 'antd';
import ArticleCard from '../../components/ArticleCard';
import VideoCard from '../../components/VideoCard';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import Recommend from '../../components/Recommend';
import useBus from '../../hooks/useBus';
import AlanCard from '../../components/alanCard';
import MenuType from '../../components/menuType';
import TagCard from '../../components/TagCard';

const socket = location.origin.includes('localhost') ? new WebSocket('ws://127.0.0.1:9998') : new WebSocket('ws://8.152.1.135:9998');

export default function Home() {
    const [listData, setData] = useState([]);
    const [videoListData, setVideoListData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendListData, setRecommendList] = useState([]);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [tagList, setTagList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [menuType, setMenuType] = useState(1);
    const userInfo = useSelector(state => state.user);
    const articleTotal = useRef({});
    const videoTotal = useRef({});
    const articleRecommend = useRef({});
    const videoRecommend = useRef({});
    const bus = useBus();

    useEffect(() => {
        initSocket();

        Promise.allSettled([getRecommendArticleList(), getRecommendVideoList(), getArticleList(), getVideoList(), getTagList()])
                .then(() => {
                    console.log('加载数据完成');
                    let lastUseMenuType = localStorage.getItem('lastUseMenuType');
                    if (lastUseMenuType) {
                        lastUseMenuType = parseInt(lastUseMenuType);
                        if (lastUseMenuType == 1) {
                            setTotal(articleTotal.current.total);
                            setRecommendList(articleRecommend.current);
                        } else {
                            setTotal(videoTotal.current.total);
                            setRecommendList(videoRecommend.current);
                        }
                        setPageNum(1);
                        setMenuType(lastUseMenuType);
                    } else {
                        setPageNum(1);
                        setRecommendList(articleRecommend.current);
                        setTotal(articleTotal.current.total);
                    }
                })
                .catch((err) => console.error(err));
    }, []);

    const initSocket = () => {
        socket.onopen = () => {
            console.log("服务器链接成功");
            socket.send(JSON.stringify({ toName: userInfo.username, timeSchedule: '30 * * * * *' }));
        };
        // 接收到消息的回调
        socket.onmessage = (res) => {
            console.log(res);
            bus.emit('getNotice', JSON.parse(res.data));
        }
        // 连接发生错误的回调
        socket.onerror = (err) => {
            console.error('socket错误:' + err);
        }
        // 关闭的回调
        socket.onclose = () => {
            console.log('socket已关闭');
        }
    }

    // 获取tag列表
    const getTagList = async () => {
        try {
            const res = await request('/getTagList');
            if (res?.data) {
                console.log(res.data);
                setTagList(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取文章列表
    const getArticleList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
        setLoading(true);
        try {
            const res = await request('/getArticleList', { data: obj });
            if (res?.data.rows) {
                setData([...res?.data.rows]);
                // setArticleTotal(res?.data.count);
                articleTotal.current.total = res?.data.count;
                articleTotal.current.pageNum = res?.data.pageNum;
                setPageNum(res?.data.pageNum);
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
        }
    }

    // 获取视频列表
    const getVideoList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
        setLoading(true);
        try {
            const res = await request('/getVideoList', { data: obj });
            if (res?.data.rows) {
                setVideoListData([...res?.data.rows]);
                // setVideoTotal(res?.data.count);
                videoTotal.current.total = res?.data.count;
                videoTotal.current.pageNum = res?.data.pageNum;
                setPageNum(res?.data.pageNum);
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
        }
    }

    //  获取今日推荐文章列表
    const getRecommendArticleList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
        try {
            const res = await request('/getRecommendArticleList', { data: obj });
            if (res?.data.rows) {
                articleRecommend.current = res?.data.rows;
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取今日推荐视频列表
    const getRecommendVideoList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
        try {
            const res = await request('/getRecommendVideoList', { data: obj });
            if (res?.data.rows) {
                videoRecommend.current = res?.data.rows;
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  点击菜单列表类型
    const clickMenu = (type) => {
        if (type == 1) {
            setTotal(articleTotal.current.total);
            setPageNum(articleTotal.current.pageNum);
            setRecommendList(articleRecommend.current);
        } else {
            setTotal(videoTotal.current.total);
            setPageNum(videoTotal.current.pageNum);
            setRecommendList(videoRecommend.current);
        }
        setMenuType(type);
        localStorage.setItem('lastUseMenuType', type);
    }

    //  翻页
    const changePage = (page) => {
        if (menuType == 1) {
            getArticleList(page, 10, keyword);
        } else {
            getVideoList(page, 10, keyword);
        }
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const handlePressEnter = () => {
        if (menuType == 1) {
            getArticleList(1, 10, keyword);
        } else {
            getVideoList(1, 10, keyword);
        }
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    return (
        <Spin tip='加载中,请稍后...' spinning={loading}>
            <div>
                <div className='home_content'>
                    <div className="tnwave waveAnimation">
                        <div className="waveWrapperInner bgTop">
                            <div className="wave waveTop wave2"></div>
                        </div>
                        <div className="waveWrapperInner bgMiddle">
                            <div className="wave waveMiddle wave2"></div>
                        </div>
                        <div className="waveWrapperInner bgBottom">
                            <div className="wave waveBottom wave1"></div>
                        </div>
                    </div>
                    <div className='home_under_content'>
                        <div className='home_left_content'>
                            <AlanCard articleTotal={articleTotal.current.total} videoTotal={videoTotal.current.total}></AlanCard>
                            <div className='home_search'>
                                <Input
                                    placeholder={menuType == 1 ? '搜索文章' : '搜索视频'}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    value={keyword}
                                    onPressEnter={handlePressEnter}
                                    style={{ borderRadius: '7px', border: '2px solid hsl(236, 32%, 26%)' }}
                                // suffix={<InfoCircleOutlined style={{color: 'rgba(0,0,0,.45)'}}/>}
                                />
                            </div>
                            <MenuType clickMenu={clickMenu}></MenuType>
                        </div>
                        <div className='home_middle_content'>
                            <div className='home_list'>
                                {
                                    menuType == 1 ?
                                        <div>{listData.map((item) => <ArticleCard articleInfo={item} userInfo={userInfo} key={item.id} />)}</div> :
                                        <div>{videoListData.map((item) => <VideoCard videoInfo={item} userInfo={userInfo} key={item.id} />)}</div>
                                }
                            </div>
                            <div className='home_pagination'>
                                {total > 10 ? <Pagination current={pageNum} total={total} onChange={changePage} pageSize={10} /> : null}
                            </div>
                        </div>
                        <div className='home_right_content'>
                            <Recommend type={menuType == 1 ? 1 : 3} articleList={recommendListData}></Recommend>
                            <TagCard tagList={tagList}></TagCard>
                        </div>
                    </div>
                </div>
            </div>
        </Spin>
    )
}
