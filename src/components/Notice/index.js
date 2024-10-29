import React, { useState, useEffect } from 'react';
import { List, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import './index.less'

/**
 * 回复我的
*/
function Notice(props) {
    const { userId, username, email, description } = props.userInfo;
    const [commentData, setCommentData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getCommentDataList();
    }, [])

    //  获取回复列表
    const getCommentDataList = async () => {
        let res = await request('/getNotice', {data: { userId }});
        if(res.status === 200) {
            setCommentData(res.data.rows);
            setLoading(false);
        } else {
            message.error(res.errorMessage);
            setLoading(false);
        }
    }

    //  跳转并更新回复状态
    const updateNotice = async (item)=> {
        // 如果是未读，则更新为已读状态
        if (item.read === 0) {
            await request('/updateNotice', {data: { id: item.id }});
        }
        navigate(`/article/${item.articleId}`);
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
