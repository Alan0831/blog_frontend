import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import './index.less'
import { Divider, Spin, message, Tag, BackTop, Anchor, Image } from 'antd'
import Recommend from '../../components/Recommend'
import AuthorInfo from '../../components/AuthorInfo'
import Discuss from '../../components/Discuss';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import { EditOutlined, EyeOutlined, CommentOutlined, TagOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils';
import { clickPreview } from '../../utils/imgreview';
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
    const [isHaveDirector, setIsHaveDirector] = useState(false);
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
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        setLoading(true);
        Promise.allSettled([getArticle(), getRecommendArticleList(), getLikeArticleList()]).then(() => setLoading(false)).catch((err) => { setLoading(false); console.error(err); });
    }, [id]);

    useEffect(() => {
        if (article.content) {
            let images = document.getElementsByClassName('preview');
            // 给图片绑定点击预览事件
            Array.from(images).map((item) => {
                console.log(item);
                item.onclick = () => clickPreview(item.src);
            })
        }
    }, [article.content]);

    //  获取今日推荐文章列表
    const getRecommendArticleList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = { pageNum, pageSize, keyword };
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
    const getLikeArticleList = async () => {
        console.log(article);
        let obj = { articleId: id };
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
    const getArticle = async () => {
        let res = await request('/findArticleById', { data: { id: parseInt(id), owner: parseInt(userInfo.userId) } });
        if (res.status == 200) {
            let data = res.data;
            data.content = data.content.replace(/(\n|\r|\r\n|↵)/g, '<br />');
            data.content = replaceImgWithAntdImage(data.content);
            let isHaveDirector = data.content.includes('<ol>');
            setIsHaveDirector(isHaveDirector);
            setArticle(data);
            let images = document.getElementsByClassName('preview');
            console.log(images);
            setTagList(JSON.parse(data.tagList));
            setAuthorInfo(data.user);
        } else {
            message.error(res.errorMessage);
        }
    }

    const replaceImgWithAntdImage = (str) => {
        // 正则表达式匹配<img>标签
        const regex = /<img[^>]*>/gi;
        // 替换函数，将匹配到的<img>标签替换为<Image>标签
        return str.replace(regex, (match) => {
            // 将src解析出来
            const srcMatch = match.match(/src="([^"]+)"/i);
            const src = srcMatch ? srcMatch[1] : '';
            // 返回<Image>标签字符串携带preview标志
            return `<img src="${src}" class="preview" />`;
        });
    };

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
        setArticle({ ...article, comments: commentList });
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
                <div className='post-content'>
                    <div className='article-userInfo'>
                        <Anchor offsetTop={40}>
                            <AuthorInfo authorInfo={authorInfo}></AuthorInfo>
                            <Recommend type={1} articleList={recommendArticleListData}></Recommend>
                            {likeArticleListData.length > 0 ? <Recommend type={2} articleList={likeArticleListData}></Recommend> : null}
                        </Anchor>
                    </div>
                    <div className='article-detail'>
                        <div className='article_de2'><div dangerouslySetInnerHTML={{ __html: content }} /></div>
                        <Discuss pageType={1} id={id} commentList={comments} setCommentList={setCommentList} />
                    </div>
                    {isHaveDirector ? (
                        <div className='article-director'>
                            <Anchor offsetTop={40}><Director articleList={content}></Director></Anchor>
                        </div>
                    ) : null}
                </div>
            </article>
            <BackTop />
        </Spin>
    )
}

export default Article
