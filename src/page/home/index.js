import React, { useEffect, useState } from 'react'
import { Input, Pagination, Spin, Empty } from 'antd';
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
        partition: 'codeStudy',
        title: '学习',
        description: '刷题、笔记和技术灵感',
        menuTypes: [1, 2, 3],
    },
    {
        key: 'chatter',
        partition: 'chatter',
        title: '杂谈',
        description: '日常记录和轻松分享',
        menuTypes: [1, 2],
    },
];

const getTopicInfo = (topicKey) => topicTabs.find(item => item.key === topicKey) || topicTabs[0];

const getTopicPartition = (topicKey) => getTopicInfo(topicKey).partition;

const getTopicMenuOptions = (topicKey) => {
    const topic = getTopicInfo(topicKey);
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
    const [articleListByTopic, setArticleListByTopic] = useState({});
    const [videoListByTopic, setVideoListByTopic] = useState({});
    const [codeListByTopic, setCodeListByTopic] = useState({});
    const [articleMetaByTopic, setArticleMetaByTopic] = useState({});
    const [videoMetaByTopic, setVideoMetaByTopic] = useState({});
    const [codeMetaByTopic, setCodeMetaByTopic] = useState({});
    const [loading, setLoading] = useState(false);
    const [articleRecommendByTopic, setArticleRecommendByTopic] = useState({});
    const [videoRecommendByTopic, setVideoRecommendByTopic] = useState({});
    const [tagListByTopic, setTagListByTopic] = useState({});
    const [keywordByView, setKeywordByView] = useState({});
    const [searchedKeywords, setSearchedKeywords] = useState({});
    const [activeTopic, setActiveTopic] = useState(getInitialTopic);
    const [menuTypeByTopic, setMenuTypeByTopic] = useState(getInitialMenuTypeByTopic);
    const userInfo = useSelector(state => state.user);
    const bus = useBus();
    const menuType = menuTypeByTopic[activeTopic] || 1;
    const activeViewKey = `${activeTopic}-${menuType}`;
    const keyword = keywordByView[activeViewKey] || '';
    const activeTopicInfo = getTopicInfo(activeTopic);
    const activeMenuOptions = getTopicMenuOptions(activeTopic);
    const activeArticleList = articleListByTopic[activeTopic] || [];
    const activeVideoList = videoListByTopic[activeTopic] || [];
    const activeCodeList = codeListByTopic[activeTopic] || [];
    const activeMeta = menuType == 1
        ? articleMetaByTopic[activeTopic]
        : menuType == 2
            ? videoMetaByTopic[activeTopic]
            : codeMetaByTopic[activeTopic];
    const total = activeMeta?.total || 0;
    const pageNum = activeMeta?.pageNum || 1;
    const recommendListData = menuType == 1
        ? articleRecommendByTopic[activeTopic] || []
        : videoRecommendByTopic[activeTopic] || [];
    const activeTagList = tagListByTopic[activeTopic] || [];

    useEffect(() => {
        initSocket();

        const initialTopic = getInitialTopic();
        const initialMenuMap = getInitialMenuTypeByTopic();
        const initialMenuType = initialTopic === 'chatter' && initialMenuMap[initialTopic] == 3 ? 1 : initialMenuMap[initialTopic];
        setActiveTopic(initialTopic);
        setMenuTypeByTopic({ ...initialMenuMap, [initialTopic]: initialMenuType });
        loadInitialData();
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
    const getTagList = async (topicKey = activeTopic) => {
        try {
            const res = await request('/getTagList', { data: { partition: getTopicPartition(topicKey) } });
            if (res?.data) {
                setTagListByTopic(prev => ({ ...prev, [topicKey]: res.data }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取文章列表
    const getArticleList = async (pageNum = 1, pageSize = 10, keyword = '', topicKey = activeTopic, showLoading = true) => {
        let obj = { pageNum, pageSize, keyword, partition: getTopicPartition(topicKey) };
        if (showLoading) setLoading(true);
        try {
            const res = await request('/getArticleList', { data: obj });
            if (res?.data.rows) {
                setArticleListByTopic(prev => ({ ...prev, [topicKey]: [...res?.data.rows] }));
                setArticleMetaByTopic(prev => ({
                    ...prev,
                    [topicKey]: {
                        total: res?.data.count,
                        pageNum: res?.data.pageNum,
                    }
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    //  获取代码题目列表
    const getCodeTopicList = async (pageNum = 1, pageSize = 10, keyword = '', topicKey = activeTopic, showLoading = true) => {
        let obj = { pageNum, pageSize, keyword, partition: getTopicPartition(topicKey) };
        if (showLoading) setLoading(true);
        try {
            const res = await request('/getCodeTopicList', { data: obj });
            if (res?.data.rows) {
                setCodeListByTopic(prev => ({ ...prev, [topicKey]: [...res?.data.rows] }));
                setCodeMetaByTopic(prev => ({
                    ...prev,
                    [topicKey]: {
                        total: res?.data.count,
                        pageNum: res?.data.pageNum,
                    }
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    // 获取视频列表
    const getVideoList = async (pageNum = 1, pageSize = 10, keyword = '', topicKey = activeTopic, showLoading = true) => {
        let obj = { pageNum, pageSize, keyword, partition: getTopicPartition(topicKey) };
        if (showLoading) setLoading(true);
        try {
            const res = await request('/getVideoList', { data: obj });
            if (res?.data.rows) {
                setVideoListByTopic(prev => ({ ...prev, [topicKey]: [...res?.data.rows] }));
                setVideoMetaByTopic(prev => ({
                    ...prev,
                    [topicKey]: {
                        total: res?.data.count,
                        pageNum: res?.data.pageNum,
                    }
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    //  获取今日推荐文章列表
    const getRecommendArticleList = async (pageNum = 1, pageSize = 10, keyword = '', topicKey = activeTopic) => {
        let obj = { pageNum, pageSize, keyword, partition: getTopicPartition(topicKey) };
        try {
            const res = await request('/getRecommendArticleList', { data: obj });
            if (res?.data.rows) {
                setArticleRecommendByTopic(prev => ({ ...prev, [topicKey]: res?.data.rows }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取今日推荐视频列表
    const getRecommendVideoList = async (pageNum = 1, pageSize = 10, keyword = '', topicKey = activeTopic) => {
        let obj = { pageNum, pageSize, keyword, partition: getTopicPartition(topicKey) };
        try {
            const res = await request('/getRecommendVideoList', { data: obj });
            if (res?.data.rows) {
                setVideoRecommendByTopic(prev => ({ ...prev, [topicKey]: res?.data.rows }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    const loadInitialData = async () => {
        setLoading(true);
        const tasks = topicTabs.flatMap((topic) => {
            const topicTasks = [
                getRecommendArticleList(1, 10, '', topic.key),
                getRecommendVideoList(1, 10, '', topic.key),
                getArticleList(1, 10, '', topic.key, false),
                getVideoList(1, 10, '', topic.key, false),
                getTagList(topic.key),
            ];
            if (topic.menuTypes.includes(3)) {
                topicTasks.push(getCodeTopicList(1, 10, '', topic.key, false));
            }
            return topicTasks;
        });

        try {
            await Promise.allSettled(tasks);
            console.log('加载数据完成');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const loadMenuData = (type, page = 1, nextKeyword = '', topicKey = activeTopic) => {
        if (type == 1) {
            getArticleList(page, 10, nextKeyword, topicKey);
            getRecommendArticleList(1, 10, '', topicKey);
        } else if (type == 2) {
            getVideoList(page, 10, nextKeyword, topicKey);
            getRecommendVideoList(1, 10, '', topicKey);
        } else {
            getCodeTopicList(page, 10, nextKeyword, topicKey);
        }
        getTagList(topicKey);
    }

    //  点击顶部标签页
    const clickTopic = (topicKey) => {
        const nextTopic = topicTabs.find(item => item.key === topicKey);
        if (!nextTopic) return;

        const currentTopicMenuType = menuTypeByTopic[topicKey] || 1;
        const nextMenuType = nextTopic.menuTypes.includes(currentTopicMenuType) ? currentTopicMenuType : 1;
        setActiveTopic(topicKey);
        setMenuTypeByTopic(prev => ({ ...prev, [topicKey]: nextMenuType }));
        loadMenuData(nextMenuType, 1, keywordByView[`${topicKey}-${nextMenuType}`] || '', topicKey);
        localStorage.setItem('lastHomeTopic', topicKey);
    }

    //  点击菜单列表类型
    const clickMenu = (type) => {
        if (!activeTopicInfo.menuTypes.includes(type)) return;

        const nextMenuTypeByTopic = { ...menuTypeByTopic, [activeTopic]: type };
        setMenuTypeByTopic(nextMenuTypeByTopic);
        loadMenuData(type, 1, keywordByView[`${activeTopic}-${type}`] || '', activeTopic);
        localStorage.setItem('lastUseMenuType', type);
        localStorage.setItem('lastHomeMenuTypeByTopic', JSON.stringify(nextMenuTypeByTopic));
    }

    //  翻页
    const changePage = (page) => {
        loadMenuData(menuType, page, keyword, activeTopic);
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    const handlePressEnter = () => {
        const nextKeyword = keyword.trim();
        setSearchedKeywords(prev => ({ ...prev, [activeViewKey]: nextKeyword }));
        loadMenuData(menuType, 1, nextKeyword, activeTopic);
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
        const currentList = menuType == 1 ? activeArticleList : menuType == 2 ? activeVideoList : activeCodeList;
        const activeSearchedKeyword = searchedKeywords[activeViewKey] || '';

        if (!loading && currentList.length === 0) {
            return (
                <div className='home_empty_state'>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span>{activeSearchedKeyword ? `没有搜索到“${activeSearchedKeyword}”对应内容` : '暂时没有内容'}</span>}
                    />
                </div>
            )
        }

        if (menuType == 1) {
            return activeArticleList.map((item) => <ArticleCard articleInfo={item} userInfo={userInfo} key={item.id} />);
        }

        if (menuType == 2) {
            return activeVideoList.map((item) => <VideoCard videoInfo={item} userInfo={userInfo} key={item.id} />);
        }

        return activeCodeList.map((item) => <CodeCard codeInfo={item} userInfo={userInfo} key={item.id} />);
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
                            <AlanCard articleTotal={articleMetaByTopic[activeTopic]?.total} videoTotal={videoMetaByTopic[activeTopic]?.total}></AlanCard>
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
                                    <TagCard tagList={activeTagList}></TagCard>
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        </Spin>
    )
}
