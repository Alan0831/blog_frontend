import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import './index.less'
import { Divider, Spin, message, Tag, BackTop } from 'antd'
import Recommend from '../../components/Recommend'
import AuthorInfo from '../../components/AuthorInfo'
import Discuss from '../../components/Discuss';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import { EditOutlined, EyeOutlined, CommentOutlined, TagOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons';
import { calcCommentsCount, normalizeComments, parseMaybeJsonArray } from '../../utils';
import { clickPreview } from '../../utils/imgreview';
import { renderArticleContent } from '../../utils/markdown';
import 'react-quill/dist/quill.snow.css';
import Director from '../../components/director';

/**
 * 文章内容
*/
function Article() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [authorInfo, setAuthorInfo] = useState({});
    const [recommendArticleListData, setRecommendArticleList] = useState([]);
    const [likeArticleListData, setLikeArticleListData] = useState([]);
    const [tagList, setTagList] = useState([]);
    const [directorList, setDirectorList] = useState([]);
    const [article, setArticle] = useState({
        title: '',
        content: '',
        createdAt: '',
        comments: [],
        viewCount: 0,
        goodCount: 0,
        tagList: '',
    });
    const userInfo = useSelector(state => state.user);
    const { content, title, createdAt, viewCount, comments, collectionCount, isCollected } = article;
    const hasDirector = directorList.length > 0;

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        loadArticlePage();
    }, [id]);

    //  获取今日推荐文章列表
    const loadArticlePage = async () => {
        setLoading(true);
        try {
            const articleData = await getArticle();
            const partition = articleData?.partition || 'codeStudy';
            await Promise.allSettled([
                getRecommendArticleList(1, 10, '', partition),
                getLikeArticleList(partition),
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getRecommendArticleList = async (pageNum = 1, pageSize = 10, keyword = '', partition = 'codeStudy') => {
        let obj = { pageNum, pageSize, keyword, partition };
        try {
            const res = await request('/getRecommendArticleList', { data: obj });
            if (res?.data.rows) {
                setRecommendArticleList(res?.data.rows);
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取猜你喜欢文章列表
    const getLikeArticleList = async (partition = 'codeStudy') => {
        let obj = { articleId: id, partition };
        try {
            const res = await request('/searchLikeArticle', { data: obj });
            if (res?.data) {
                setLikeArticleListData(res?.data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取文章详情
    const getComments = async () => {
        try {
            const res = await request('/comments', {
                method: 'get',
                data: {
                    targetType: 'article',
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
    }

    const getArticle = async () => {
        let res = await request('/findArticleById', { data: { id: parseInt(id), owner: parseInt(userInfo.userId) } });
        if (res.status == 200) {
            let data = res.data;
            const renderedArticle = renderArticleContent(data.content);
            const pagedComments = await getComments();
            data.content = renderedArticle.html;
            data.comments = pagedComments !== null ? pagedComments : normalizeComments(data);
            setArticle(data);
            setDirectorList(renderedArticle.headings);
            setTagList(parseMaybeJsonArray(data.tagList));
            setAuthorInfo(data.user);
            return data;
        } else {
            message.error(res.errorMessage);
        }
        return null;
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
                collectionArticleId: parseInt(id),
                owner: parseInt(userInfo.userId),
            }
            await request('/addCollection', { data });
            message.success('添加收藏成功');
            setArticle({ ...article, isCollected: true, collectionCount: collectionCount + 1 });
        } catch (err) {
            message.error('添加收藏失败:' + err);
            console.error(err);
        }
    }

    // 取消收藏
    const deleteCollection = async () => {
        try {
            let data = {
                collectionArticleId: parseInt(id),
                owner: parseInt(userInfo.userId),
            }
            await request('/deleteCollection', { data });
            message.success('取消收藏成功');
            setArticle({ ...article, isCollected: false, collectionCount: collectionCount - 1 });
        } catch (err) {
            message.error('取消收藏失败:' + err);
            console.error(err);
        }
    }

    //  刷新子组件传来的评论列表
    const setCommentList = (commentList) => {
        setArticle(prevArticle => ({ ...prevArticle, comments: normalizeComments({ comments: commentList }) }));
    }

    const handleContentClick = (event) => {
        const target = event.target;
        if (target?.tagName === 'IMG' && target.classList.contains('preview')) {
            clickPreview(target.src);
        }
    }

    return (
        <Spin tip='加载中...' spinning={loading}>
            <article className='app-article'>
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
                            <span style={{ marginRight: 5 }}> {calcCommentsCount(comments)}</span>
                        </a>
                        <EyeOutlined style={{ margin: '0 2px 0 5px' }} />
                        <span style={{ marginRight: 5 }}>{viewCount}</span>
                        <span onClick={updateCollection} style={{ cursor: 'pointer' }}>
                            {isCollected ? <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} /> : <StarOutlined style={{ margin: '0 2px 0 5px' }} />}
                            <span style={{ marginRight: 5 }}>{collectionCount}</span>
                        </span>
                        <Divider type='vertical' />
                        <span className='viewCount'>
                            <TagOutlined style={{ marginRight: 7 }} />
                            {tagList.map((item) => {
                                return (<Tag color="#2db7f5" key={item}>{item}</Tag>)
                            })}
                        </span>
                    </div>
                </div>
                <div className={`post-content ${hasDirector ? 'has-director' : 'no-director'}`}>
                    <div className='article-userInfo'>
                        <AuthorInfo authorInfo={authorInfo}></AuthorInfo>
                        <Recommend type={1} articleList={recommendArticleListData}></Recommend>
                        {likeArticleListData.length > 0 ? <Recommend type={2} articleList={likeArticleListData}></Recommend> : null}
                    </div>
                    <div className='article-detail'>
                        <div
                            className='article_de2 markdown-body'
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                        <Discuss pageType={1} id={id} commentList={comments} setCommentList={setCommentList} />
                    </div>
                    {hasDirector ? (
                        <div className='article-director'>
                            <Director headings={directorList}></Director>
                        </div>
                    ) : null}
                </div>
            </article>
            <BackTop />
        </Spin>
    )
}

export default Article
