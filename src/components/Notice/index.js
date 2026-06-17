import React, { useState, useEffect } from 'react';
import { List, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import useBus from '../../hooks/useBus';
import './index.less'

/**
 * 回复我的
*/
function Notice(props) {
    const { userId } = props.userInfo;
    const [commentData, setCommentData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const bus = useBus();

    useEffect(() => {
        if (!userId || userId <= 0) return;
        getCommentDataList();
    }, [userId])

    //  获取回复列表
    const getCommentDataList = async () => {
        setLoading(true);
        try {
            let res = await request('/getNotice', {data: { userId }});
            if(res.status === 200) {
                const rows = res.data.rows || [];
                setCommentData(rows);
                // 回复列表加载后同步一次头部未读数量，避免页面刷新或 websocket 延迟导致提示不一致。
                bus.emit('getNotice', rows);
            } else {
                message.error(res.errorMessage);
            }
        } catch (err) {
            console.error(err);
            message.error('回复列表加载失败，请稍后再试');
        } finally {
            setLoading(false);
        }
    }

    //  跳转并更新回复状态
    const updateNotice = async (item)=> {
        // 如果是未读，则更新为已读状态
        if (item.read === 0) {
            const res = await request('/updateNotice', {data: { id: item.id }});
            if (res?.status !== 200) {
                message.error(res?.errorMessage || '更新回复状态失败');
                return;
            }
            const nextCommentData = commentData.map(comment => (
                comment.id === item.id ? { ...comment, read: 1 } : comment
            ));
            setCommentData(nextCommentData);
            // 标记已读成功后立刻同步头部头像和“回复我的”菜单提示数量。
            bus.emit('getNotice', nextCommentData);
        }
        if (item.articleId) {
            navigate(`/article/${item.articleId}`);
        } else if (item.videoId) {
            navigate(`/video/${item.videoId}`);
        }
        
    }

    return (
        <Spin tip='加载中...' spinning={loading}>
            <div className='my_notice'>
                <List
                    header={<div>回复列表</div>}
                    bordered
                    dataSource={commentData}
                    renderItem={(item) => (
                        <List.Item>
                            <div className='comment_outer' onClick={() => updateNotice(item)}>
                                <div className='comment_middle'>
                                    <div className='comment_time'>{`[${item.createdAt}]`}</div>
                                    <div className='comment_content'>{`${item.fromName}:  ${item.content}`}</div>
                                </div>
                                <div className={item.read === 0 ? 'comment_noread' : 'comment_hadnoread'}>{item.read === 0 ? '未读' : '已读'}</div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        </Spin>
    )
}

export default Notice
