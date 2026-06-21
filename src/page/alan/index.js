import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Empty, Skeleton, message } from 'antd';
import {
    CommentOutlined,
    EyeOutlined,
    HeartOutlined,
    StarOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import MiniArticleCard from '../../components/miniArticleCard';
import { calcCommentsCount } from '../../utils';
import { request } from '../../utils/request';
import AlanNebulaScene from './AlanNebulaScene';
import './index.less';

const empty = require('../../../public/icon/empty.svg');
const alanAvatar = require('../../assets/images/alan.jpg');
const FRIEND_PAGE_SIZE = 10;

const getMomentKey = (item = {}, index = 0) => item.id || `${item.type}-${item.articleId || item.videoId || index}`;

const getMomentMeta = (item = {}) => {
    const isVideo = item.type == 2;
    const content = isVideo ? item.video : item.article;
    const comments = content?.comments || content?.videocomments;

    return {
        content,
        isVideo,
        title: content?.title || '这条动态暂时不可用',
        createdAt: item.createdAt || content?.createdAt || '刚刚发布',
        actionText: isVideo ? '上传了一个新视频' : '发表了一篇新文章',
        typeText: isVideo ? '影像动态' : '文章动态',
        viewCount: content?.viewCount || 0,
        commentCount: calcCommentsCount(comments),
        collectionCount: content?.collectionCount || 0,
    };
};

const mergeMomentList = (oldList, nextList) => {
    const momentMap = new Map();

    [...oldList, ...nextList].filter(Boolean).forEach((item, index) => {
        momentMap.set(getMomentKey(item, index), item);
    });

    return Array.from(momentMap.values());
};

// 单条动态拆成 memo 组件，追加分页时已渲染的朋友圈不会跟着重绘。
const AlanMomentItem = React.memo(function AlanMomentItem(props) {
    const { item, index, userInfo } = props;
    const meta = useMemo(() => getMomentMeta(item), [item]);

    return (
        <article
            className='alan-moment'
            style={{ '--moment-index': index }}
        >
            <div className='alan-moment__avatar'>
                <img src={alanAvatar} alt='Alan 头像' />
            </div>

            <div className='alan-moment__body'>
                <div className='alan-moment__header'>
                    <div>
                        <h2>Alan</h2>
                        <p>{meta.actionText}</p>
                    </div>
                    <span>{meta.typeText}</span>
                </div>

                <p className='alan-moment__caption'>{meta.title}</p>

                <div className='alan-moment__preview'>
                    <MiniArticleCard info={item} userInfo={userInfo} />
                </div>

                <div className='alan-moment__footer'>
                    <time>{meta.createdAt}</time>
                    <div className='alan-moment__actions'>
                        <span><EyeOutlined />{meta.viewCount}</span>
                        <span><CommentOutlined />{meta.commentCount}</span>
                        <span><StarOutlined />{meta.collectionCount}</span>
                        <span><HeartOutlined />喜欢</span>
                    </div>
                </div>
            </div>
        </article>
    );
});

export default function Alan() {
    const [listData, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const userInfo = useSelector(state => state.user);
    const observerRef = useRef(null);
    const loadingLockRef = useRef(false);
    const listDataRef = useRef([]);
    const nextPageRef = useRef(1);

    const friendCircleList = useMemo(
        () => (Array.isArray(listData) ? listData.filter(Boolean) : []),
        [listData],
    );

    // 拉取朋友圈动态。replace=true 用于首次加载，replace=false 用于触底追加。
    const getArticleListFromAlan = useCallback(async (currentPage = 1, replace = false) => {
        if (loadingLockRef.current) return;

        const params = { pageNum: currentPage, pageSize: FRIEND_PAGE_SIZE, userId: userInfo.userId };
        loadingLockRef.current = true;
        replace ? setLoading(true) : setLoadingMore(true);

        try {
            const res = await request('/getFriendCircle', { data: params });
            const rows = Array.isArray(res?.data?.rows) ? res.data.rows.filter(Boolean) : [];
            const totalCount = Number(res?.data?.count || 0);
            const resolvedPage = Number(res?.data?.pageNum || currentPage);
            const nextList = replace ? rows : mergeMomentList(listDataRef.current, rows);

            // 用 ref 同步已加载数据，IntersectionObserver 回调里不用依赖闭包里的旧列表。
            listDataRef.current = nextList;
            nextPageRef.current = resolvedPage + 1;
            setData(nextList);
            setTotal(totalCount);
            setPageNum(resolvedPage);
            setHasMore(rows.length > 0 && (totalCount > 0 ? nextList.length < totalCount : rows.length >= FRIEND_PAGE_SIZE));
        } catch (err) {
            console.error(err);
            message.error('朋友圈动态加载失败，请稍后再试');
        } finally {
            loadingLockRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userInfo.userId]);

    useEffect(() => {
        listDataRef.current = [];
        nextPageRef.current = 1;
        setHasMore(true);
        getArticleListFromAlan(1, true);
    }, [getArticleListFromAlan]);

    const loadMoreMoments = useCallback(() => {
        if (!hasMore || loading || loadingMore || loadingLockRef.current) return;
        getArticleListFromAlan(nextPageRef.current, false);
    }, [getArticleListFromAlan, hasMore, loading, loadingMore]);

    // 使用 IntersectionObserver 做触底加载，避免 scroll 事件在滚动中高频触发。
    const setLoadMoreTrigger = useCallback((node) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!node || !hasMore) return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) loadMoreMoments();
            },
            { root: null, rootMargin: '360px 0px', threshold: 0.01 },
        );
        observerRef.current.observe(node);
    }, [hasMore, loadMoreMoments]);

    useEffect(() => () => {
        if (observerRef.current) observerRef.current.disconnect();
    }, []);

    const renderSkeletonList = () => (
        <div className='alan-feed-list'>
            {[0, 1, 2].map(item => (
                <article className='alan-moment alan-moment--skeleton' key={item}>
                    <Skeleton.Avatar active size={46} />
                    <div className='alan-moment__body'>
                        <Skeleton active paragraph={{ rows: 3 }} title={{ width: '36%' }} />
                    </div>
                </article>
            ))}
        </div>
    );

    return (
        <main className='alan-page'>
            <AlanNebulaScene />
            <section className='alan-hero'>
                <div className='alan-hero__cover'>
                    <div className='alan-hero__beam' />
                    <div className='alan-hero__profile'>
                        <img src={alanAvatar} alt='Alan 头像' />
                        <div>
                            <span>Alan</span>
                            <p>诚信肥宅。</p>
                        </div>
                    </div>
                </div>

                <div className='alan-hero__panel'>
                    <span className='alan-hero__tag'>ANIME PULSE</span>
                    <h1>Alan 的朋友圈</h1>
                    <p>这里记录新文章、新视频和那些突然闪光的灵感碎片。</p>
                    <div className='alan-hero__stats'>
                        <span><strong>{total}</strong>条动态</span>
                    </div>
                </div>
            </section>

            <section className='alan-feed' aria-label='Alan 朋友圈动态'>
                {loading && friendCircleList.length === 0 ? renderSkeletonList() : null}

                {!loading && friendCircleList.length === 0 ? (
                    <div className='alan-empty'>
                        <Empty
                            image={empty}
                            imageStyle={{ height: 120 }}
                            description={<span>暂时还没有发表朋友圈哦</span>}
                        />
                    </div>
                ) : null}

                {friendCircleList.length > 0 ? (
                    <div className='alan-feed-list'>
                        {friendCircleList.map((item, index) => {
                            return (
                                <AlanMomentItem
                                    key={getMomentKey(item, index)}
                                    item={item}
                                    index={index}
                                    userInfo={userInfo}
                                />
                            );
                        })}

                        <div
                            className={`alan-feed-status${!hasMore ? ' is-finished' : ''}`}
                            ref={hasMore ? setLoadMoreTrigger : null}
                        >
                            {loadingMore ? (
                                <span className='alan-feed-status__loading'>正在加载更多动态</span>
                            ) : hasMore ? (
                                <span>继续下滑加载更多动态</span>
                            ) : (
                                <span>已经到底啦，所有朋友圈都加载完了</span>
                            )}
                        </div>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
