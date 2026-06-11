import React, { useEffect, useState, useRef } from 'react'
import { message, Input, Pagination, Spin, Empty, Button } from 'antd';
import ArticleCard from '../../components/ArticleCard';
import VideoCard from '../../components/VideoCard';
import CodeCard from '../../components/CodeCard';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import Recommend from '../../components/Recommend';
import useBus from '../../hooks/useBus';
import AlanCard from '../../components/alanCard';
import MenuType, { defaultMenuTypes } from '../../components/menuType';
import TagCard from '../../components/TagCard';

const socket = location.origin.includes('localhost') ? new WebSocket('ws://127.0.0.1:9998') : new WebSocket('ws://8.152.1.135:9998');

const topicTabs = [
    {
        key: 'codeStudy',
        title: '代码学习',
        description: '刷题、笔记和技术灵感',
        menuTypes: [1, 2, 3],
    },
    {
        key: 'chatter',
        title: '杂谈',
        description: '日常记录和轻松分享',
        menuTypes: [1, 2],
    },
];

const getTopicMenuOptions = (topicKey) => {
    const topic = topicTabs.find(item => item.key === topicKey) || topicTabs[0];
    return defaultMenuTypes.filter(item => topic.menuTypes.includes(item.menuType));
};

const getInitialTopic = () => {
    const lastTopic = localStorage.getItem('lastHomeTopic');
    return topicTabs.some(item => item.key === lastTopic) ? lastTopic : 'codeStudy';
};

const getInitialMenuTypeByTopic = () => {
    let savedMenuType = {};
    try {
        savedMenuType = JSON.parse(localStorage.getItem('lastHomeMenuTypeByTopic') || '{}');
    } catch (error) {
        savedMenuType = {};
    }
    const legacyMenuType = parseInt(localStorage.getItem('lastUseMenuType'));
    return {
        codeStudy: savedMenuType.codeStudy || legacyMenuType || 1,
        chatter: [1, 2].includes(savedMenuType.chatter) ? savedMenuType.chatter : 1,
    };
};

export default function Home() {
    const [listData, setData] = useState([]);
    const [videoListData, setVideoListData] = useState([]);
    const [codeListData, setCodeListData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendListData, setRecommendList] = useState([]);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [tagList, setTagList] = useState([]);
    const [keywordByView, setKeywordByView] = useState({});
    const [searchedKeywords, setSearchedKeywords] = useState({});
    const [activeTopic, setActiveTopic] = useState(getInitialTopic);
    const [menuTypeByTopic, setMenuTypeByTopic] = useState(getInitialMenuTypeByTopic);
    const userInfo = useSelector(state => state.user);
    const articleTotal = useRef({});
    const videoTotal = useRef({});
    const codeTotal = useRef({});
    const articleRecommend = useRef({});
    const videoRecommend = useRef({});
    const codeRecommend = useRef({});
    const bus = useBus();
    const menuType = menuTypeByTopic[activeTopic] || 1;
    const activeViewKey = `${activeTopic}-${menuType}`;
    const keyword = keywordByView[activeViewKey] || '';
    const activeTopicInfo = topicTabs.find(item => item.key === activeTopic) || topicTabs[0];
    const activeMenuOptions = getTopicMenuOptions(activeTopic);

    useEffect(() => {
        initSocket();

        Promise.allSettled([getRecommendArticleList(), getRecommendVideoList(), getArticleList(), getVideoList(), getCodeTopicList(), getTagList()])
                .then(() => {
                    console.log('加载数据完成');
                    const initialTopic = getInitialTopic();
                    const initialMenuMap = getInitialMenuTypeByTopic();
                    const initialMenuType = initialTopic === 'chatter' && initialMenuMap[initialTopic] == 3 ? 1 : initialMenuMap[initialTopic];
                    setActiveTopic(initialTopic);
                    setMenuTypeByTopic({ ...initialMenuMap, [initialTopic]: initialMenuType });
                    syncMenuMeta(initialMenuType);
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
                setTotal(res?.data.count);
                setPageNum(res?.data.pageNum);
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
        }
    }

    //  获取代码题目列表
    const getCodeTopicList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
        setLoading(true);
        try {
            const res = await request('/getCodeTopicList', { data: obj });
            if (res?.data.rows) {
                setCodeListData([...res?.data.rows]);
                codeTotal.current.total = res?.data.count;
                codeTotal.current.pageNum = res?.data.pageNum;
                setTotal(res?.data.count);
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
                setTotal(res?.data.count);
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

    const syncMenuMeta = (type) => {
        if (type == 1) {
            setTotal(articleTotal.current.total);
            setPageNum(articleTotal.current.pageNum);
            setRecommendList(articleRecommend.current);
        } else if (type == 2) {
            setTotal(videoTotal.current.total);
            setPageNum(videoTotal.current.pageNum);
            setRecommendList(videoRecommend.current);
        } else {
            setTotal(codeTotal.current.total);
            setPageNum(codeTotal.current.pageNum);
            setRecommendList(codeRecommend.current);
        }
    }

    const loadMenuData = (type, page = 1, nextKeyword = '') => {
        if (type == 1) {
            getArticleList(page, 10, nextKeyword);
        } else if (type == 2) {
            getVideoList(page, 10, nextKeyword);
        } else {
            getCodeTopicList(page, 10, nextKeyword);
        }
    }

    //  点击顶部标签页
    const clickTopic = (topicKey) => {
        const nextTopic = topicTabs.find(item => item.key === topicKey);
        if (!nextTopic) return;

        const currentTopicMenuType = menuTypeByTopic[topicKey] || 1;
        const nextMenuType = nextTopic.menuTypes.includes(currentTopicMenuType) ? currentTopicMenuType : 1;
        setActiveTopic(topicKey);
        setMenuTypeByTopic(prev => ({ ...prev, [topicKey]: nextMenuType }));
        syncMenuMeta(nextMenuType);
        loadMenuData(nextMenuType, 1, keywordByView[`${topicKey}-${nextMenuType}`] || '');
        localStorage.setItem('lastHomeTopic', topicKey);
    }

    //  点击菜单列表类型
    const clickMenu = (type) => {
        if (!activeTopicInfo.menuTypes.includes(type)) return;

        syncMenuMeta(type);
        const nextMenuTypeByTopic = { ...menuTypeByTopic, [activeTopic]: type };
        setMenuTypeByTopic(nextMenuTypeByTopic);
        loadMenuData(type, 1, keywordByView[`${activeTopic}-${type}`] || '');
        localStorage.setItem('lastUseMenuType', type);
        localStorage.setItem('lastHomeMenuTypeByTopic', JSON.stringify(nextMenuTypeByTopic));
    }

    //  翻页
    const changePage = (page) => {
        if (menuType == 1) {
            getArticleList(page, 10, keyword);
        } else if (menuType == 2) {
            getVideoList(page, 10, keyword);
        } else {
            getCodeTopicList(page, 10, keyword);
        }
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const handlePressEnter = () => {
        const nextKeyword = keyword.trim();
        setSearchedKeywords(prev => ({ ...prev, [activeViewKey]: nextKeyword }));
        if (menuType == 1) {
            getArticleList(1, 10, nextKeyword);
        } else if (menuType == 2) {
            getVideoList(1, 10, nextKeyword);
        } else {
            getCodeTopicList(1, 10, nextKeyword);
        }
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const getSearchPlaceholder = () => {
        if (menuType == 1) return '搜索文章';
        if (menuType == 2) return '搜索视频';
        return '搜索代码';
    }

    const renderHomeList = () => {
        const currentList = menuType == 1 ? listData : menuType == 2 ? videoListData : codeListData;
        const activeSearchedKeyword = searchedKeywords[activeViewKey] || '';

        if (!loading && activeSearchedKeyword && currentList.length === 0) {
            return (
                <div className='home_empty_state'>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span>没有搜索到“{activeSearchedKeyword}”对应内容</span>}
                    />
                </div>
            )
        }

        if (menuType == 1) {
            return listData.map((item) => <ArticleCard articleInfo={item} userInfo={userInfo} key={item.id} />);
        }

        if (menuType == 2) {
            return videoListData.map((item) => <VideoCard videoInfo={item} userInfo={userInfo} key={item.id} />);
        }

        return codeListData.map((item) => <CodeCard codeInfo={item} userInfo={userInfo} key={item.id} />);
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
                                    placeholder={getSearchPlaceholder()}
                                    onChange={(e) => setKeywordByView(prev => ({ ...prev, [activeViewKey]: e.target.value }))}
                                    value={keyword}
                                    onPressEnter={handlePressEnter}
                                    style={{ borderRadius: '7px', border: '2px solid hsl(236, 32%, 26%)' }}
                                // suffix={<InfoCircleOutlined style={{color: 'rgba(0,0,0,.45)'}}/>}
                                />
                            </div>
                            <MenuType clickMenu={clickMenu} activeType={menuType} options={activeMenuOptions}></MenuType>
                        </div>
                        <div className='home_middle_content'>
                            <div className='home_topic_tabs' role='tablist' aria-label='内容分区'>
                                {topicTabs.map(item => (
                                    <button
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTopic === item.key}
                                        className={`home_topic_tab ${activeTopic === item.key ? 'is-active' : ''}`}
                                        key={item.key}
                                        onClick={() => clickTopic(item.key)}
                                    >
                                        <span>{item.title}</span>
                                        <small>{item.description}</small>
                                    </button>
                                ))}
                            </div>
                            <div className='home_list'>
                                {renderHomeList()}
                            </div>
                            <div className='home_pagination'>
                                {total > 10 ? <Pagination current={pageNum} total={total} onChange={changePage} pageSize={10} /> : null}
                            </div>
                        </div>
                        {
                            menuType !== 3 ?  (
                                <div className='home_right_content'>
                                    <Recommend type={menuType == 1 ? 1 : 3} articleList={recommendListData}></Recommend>
                                    <TagCard tagList={tagList}></TagCard>
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        </Spin>
    )
}
