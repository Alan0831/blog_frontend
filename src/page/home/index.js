import React, { useEffect, useState } from 'react'
import { Spin } from 'antd';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import { defaultMenuTypes } from '../../components/menuType';
import ChatterZone from '../../components/ChatterZone';
import { clearHomeScrollSnapshot, getHomeScrollSnapshot, saveHomeScrollSnapshot } from '../../utils/homeScroll';

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

const getRestoredHomeState = (snapshot) => {
    if (!snapshot) return null;

    const restoredTopic = topicTabs.some(item => item.key === snapshot.activeTopic)
        ? snapshot.activeTopic
        : getInitialTopic();

    const topicInfo = getTopicInfo(restoredTopic);
    const initialMenuMap = getInitialMenuTypeByTopic();
    const restoredMenuType = Number(snapshot.menuType);
    const initialMenuType = initialMenuMap[restoredTopic] || topicInfo.menuTypes[0];
    const nextMenuType = topicInfo.menuTypes.includes(restoredMenuType)
        ? restoredMenuType
        : (topicInfo.menuTypes.includes(initialMenuType) ? initialMenuType : topicInfo.menuTypes[0]);
    const restoredPageNum = Number(snapshot.pageNum);

    return {
        activeTopic: restoredTopic,
        menuType: nextMenuType,
        pageNum: Number.isFinite(restoredPageNum) && restoredPageNum > 0 ? restoredPageNum : 1,
        keyword: typeof snapshot.keyword === 'string' ? snapshot.keyword : '',
        searchedKeyword: typeof snapshot.searchedKeyword === 'string' ? snapshot.searchedKeyword : '',
        scrollY: Number(snapshot.scrollY) || 0,
    };
};

export default function Home() {
    const [restoredHomeState] = useState(() => getRestoredHomeState(getHomeScrollSnapshot()));
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
    const [searchedKeywords, setSearchedKeywords] = useState(() => (
        restoredHomeState
            ? { [`${restoredHomeState.activeTopic}-${restoredHomeState.menuType}`]: restoredHomeState.searchedKeyword }
            : {}
    ));
    const [activeTopic, setActiveTopic] = useState(() => restoredHomeState?.activeTopic || getInitialTopic());
    const [menuTypeByTopic, setMenuTypeByTopic] = useState(() => {
        const initialMenuMap = getInitialMenuTypeByTopic();
        if (!restoredHomeState) return initialMenuMap;
        return { ...initialMenuMap, [restoredHomeState.activeTopic]: restoredHomeState.menuType };
    });
    const userInfo = useSelector(state => state.user);
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
        const initialTopic = restoredHomeState?.activeTopic || getInitialTopic();
        const initialMenuMap = getInitialMenuTypeByTopic();
        const initialMenuType = restoredHomeState?.menuType || (initialTopic === 'chatter' && initialMenuMap[initialTopic] == 3 ? 1 : initialMenuMap[initialTopic]);
        const initialPageNum = restoredHomeState?.pageNum || 1;
        const initialKeyword = restoredHomeState?.keyword || '';
        const initialSearchKeyword = restoredHomeState?.searchedKeyword || '';
        const initialViewKey = `${initialTopic}-${initialMenuType}`;
        setActiveTopic(initialTopic);
        setMenuTypeByTopic({ ...initialMenuMap, [initialTopic]: initialMenuType });
        if (initialKeyword) {
            setKeywordByView(prev => ({ ...prev, [initialViewKey]: initialKeyword }));
        }
        if (restoredHomeState) {
            setSearchedKeywords(prev => ({ ...prev, [initialViewKey]: restoredHomeState.searchedKeyword }));
        }
        loadInitialData(initialTopic, initialMenuType, initialPageNum, initialSearchKeyword)
            .finally(() => restoreHomeScroll(restoredHomeState));
    }, []);

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

    const loadInitialData = async (topicKey, type, page = 1, nextKeyword = '') => {
        setLoading(true);
        // 首屏只请求当前可见栏目，其余栏目在用户切换时再加载，避免一次并发十余个接口。
        const tasks = [getTagList(topicKey)];
        if (type == 1) {
            tasks.push(getArticleList(page, 10, nextKeyword, topicKey, false));
            tasks.push(getRecommendArticleList(1, 10, '', topicKey));
        } else if (type == 2) {
            tasks.push(getVideoList(page, 10, nextKeyword, topicKey, false));
            tasks.push(getRecommendVideoList(1, 10, '', topicKey));
        } else {
            tasks.push(getCodeTopicList(page, 10, nextKeyword, topicKey, false));
        }

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

    const restoreHomeScroll = (snapshot) => {
        if (!snapshot) return;

        const targetY = Number(snapshot.scrollY) || 0;
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                window.scrollTo({
                    top: targetY,
                    left: 0,
                    behavior: 'auto',
                });
                clearHomeScrollSnapshot();
            });
        });
    }

    const saveCurrentHomeScroll = () => {
        saveHomeScrollSnapshot({
            activeTopic,
            menuType,
            pageNum,
            keyword,
            searchedKeyword: searchedKeywords[activeViewKey] || '',
        });
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

    return (
        <Spin tip='加载中，请稍候...' spinning={loading}>
            <div>
                <div className='home_content'>
                    <ChatterZone
                        topicTabs={topicTabs}
                        activeTopic={activeTopic}
                        activeMenuOptions={activeMenuOptions}
                        menuType={menuType}
                        keyword={keyword}
                        total={total}
                        pageNum={pageNum}
                        userInfo={userInfo}
                        articleTotal={articleMetaByTopic[activeTopic]?.total}
                        videoTotal={videoMetaByTopic[activeTopic]?.total}
                        activeArticleList={activeArticleList}
                        activeVideoList={activeVideoList}
                        activeCodeList={activeCodeList}
                        recommendListData={recommendListData}
                        activeTagList={activeTagList}
                        searchedKeyword={searchedKeywords[activeViewKey] || ''}
                        loading={loading}
                        getSearchPlaceholder={getSearchPlaceholder}
                        onKeywordChange={(value) => setKeywordByView(prev => ({ ...prev, [activeViewKey]: value }))}
                        onSearch={handlePressEnter}
                        onClickTopic={clickTopic}
                        onClickMenu={clickMenu}
                        onChangePage={changePage}
                        onBeforeOpenPost={saveCurrentHomeScroll}
                    />
                </div>
            </div>
        </Spin>
    )
}
