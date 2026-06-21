import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import './index.less'
import { Divider, Spin, message, Tag, BackTop, Anchor, Image } from 'antd'
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import { EditOutlined, EyeOutlined, CommentOutlined, TagOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons';
import CodeMirrorComponent from '../../components/codeMirror';
import { sanitizeRichText } from '../../utils/security';

/**
 * 题目内容
*/
function Code() {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [likeArticleListData, setLikeArticleListData] = useState([]);
    const [codeTopic, setCodeTopic] = useState({
        title: '',
        content: '',
        createdAt: '',
        comments: [],
        viewCount: 0,
        goodCount: 0,
        tagList: '',
    });
    const userInfo = useSelector(state => state.user);
    const { content, title, createdAt, viewCount, comments, goodCount, collectionCount, isCollected } = codeTopic;

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        setLoading(true);
        Promise.allSettled([getCode()]).then(() => setLoading(false)).catch((err) => { setLoading(false); console.error(err); });
    }, [id]);

    //  获取题目详情
    const getCode = async () => {
        let res = await request('/findCodeTopicById', { data: { id: parseInt(id), owner: parseInt(userInfo.userId) } });
        if (res.status == 200) {
            let data = res.data;
            // 题目描述会走 dangerouslySetInnerHTML，渲染前必须净化历史内容和接口返回内容。
            data.content = sanitizeRichText((data.content || '').replace(/(\n|\r|\r\n|↵)/g, '<br />'));
            setCodeTopic(data);
            // setTagList(JSON.parse(data.tagList));
            // setAuthorInfo(data.user);
        } else {
            message.error(res.errorMessage);
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

    return (
        <Spin tip='加载中...' spinning={loading}>
            <article className='app-code'>
                <div className='code-left'>
                    <div className='code-left-title'>
                        {title}
                    </div>
                    <div className='code-left-content'>
                        <div className='article_de2'><div dangerouslySetInnerHTML={{ __html: content }} /></div>
                    </div>
                </div>
                <div className='code-right'>
                    <CodeMirrorComponent id={id} userId={userInfo.userId} />
                </div>
            </article>
            <BackTop />
        </Spin>
    )
}

export default Code
