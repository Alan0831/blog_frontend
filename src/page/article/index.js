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
import { calcCommentsCount } from '../../utils';
// const arrow = require('../../../public/bilan.jpeg');

/**
 * 文章内容
*/
function Article() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [authorInfo, setAuthorInfo] = useState({});
    const [recommendArticleListData, setRecommendArticleList] = useState([]);
    const [tagList, setTagList] = useState([]);
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
    const { content, title, createdAt, viewCount, comments, goodCount, collectionCount, isCollected } = article;

    useEffect(() => {
        setLoading(true);
        Promise.allSettled([getArticle(), getRecommendArticleList()]).then(() => setLoading(false)).catch((err) => {setLoading(false);console.error(err);});
    },[id])

    //  获取今日推荐文章列表
    const getRecommendArticleList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = {pageNum, pageSize, keyword};
        try {
            const res = await request('/getRecommendArticleList', { data: obj });
            if (res?.data.rows) {
                setRecommendArticleList(res?.data.rows);
            }
        } catch (err) {
            console.error(err);
        }
    }

    //  获取文章详情
    const getArticle = async () => {
        let res = await request('/findArticleById', {data: {id: parseInt(id), owner: parseInt(userInfo.userId)}});
        if (res.status == 200) {
            let data = res.data;
            data.content = data.content.replace(/(\n|\r|\r\n|↵)/g, '<br />');
            setArticle(data);
            setTagList(JSON.parse(data.tagList))
            setAuthorInfo(data.user);
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
        try {
            let data = {
                collectionArticleId: parseInt(id),
                owner: parseInt(userInfo.userId),
            }
            await request('/addCollection', {data});
            message.success('添加收藏成功');
            setArticle({...article, isCollected: true, collectionCount: collectionCount + 1});
        } catch (err) {
            message.error('添加收藏失败:' + err );
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
            await request('/deleteCollection', {data});
            message.success('取消收藏成功');
            setArticle({...article, isCollected: false, collectionCount: collectionCount - 1});
        } catch (err) {
            message.error('取消收藏失败:' + err );
            console.error(err);
        }
    }

    //  刷新子组件传来的评论列表
    const setCommentList = (commentList) => {
        setArticle({...article, comments: commentList});
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
                        <span onClick={updateCollection} style={{cursor: 'pointer'}}>
                            {isCollected ? <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} /> : <StarOutlined style={{ margin: '0 2px 0 5px' }} />}
                            <span style={{ marginRight: 5 }}>{collectionCount}</span>
                        </span>
                        <Divider type='vertical' />
                        <span className='viewCount'>
                            <TagOutlined style={{ marginRight: 7 }}/>
                            {tagList.map((item) => {
                            return (<Tag color="#2db7f5" key={item}>{item}</Tag>)
                            })}
                        </span>
                    </div>
                </div>
                <div className='post-content'>
                    <div className='article-userInfo'>
                        <AuthorInfo authorInfo={authorInfo}></AuthorInfo>
                        <Recommend articleList={recommendArticleListData}></Recommend>
                    </div>
                    <div className='article-detail'>
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                        <Discuss articleId={id} commentList={comments} setCommentList={setCommentList} />
                    </div>
                </div>
            </article>
            <BackTop />
        </Spin>
    )
}

export default Article
