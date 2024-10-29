import React, { useState, useEffect } from 'react';
import { List, Spin, message, Popconfirm  } from 'antd';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import { StarTwoTone } from '@ant-design/icons';
import './index.less'

/**
 * 我的收藏
*/
function Collection(props) {
    const { userId } = props.userInfo;
    const [collectionList, setCollectionList] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getCommentDataList();
    }, [])

    //  获取收藏列表
    const getCommentDataList = async () => {
        let res = await request('/searchCollection', {data: { owner: userId }});
        if(res.status === 200) {
            setCollectionList(res.data.rows);
            setLoading(false);
        } else {
            message.error(res.errorMessage);
            setLoading(false);
        }
    }

    //  跳转至文章
    const goToAticle = async (item) => {
        navigate(`/article/${item.articleId}`);
    }

    // 取消收藏
    const cancelCollection= async (articleId, e) => {
        console.log(articleId);
        console.log(e);
        
        try {
            let data = {
                collectionArticleId: parseInt(articleId),
                owner: parseInt(userId),
            }
            await request('/deleteCollection', {data});
            message.success('取消收藏成功');
            getCommentDataList();
        } catch (err) {
            message.error('取消收藏失败:' + err );
            console.error(err);
        }
    }

    return (
        <Spin tip='加载中...' spinning={loading}>
            <div className='my_notice'>
                <List
                    header={<div>收藏列表</div>}
                    bordered
                    dataSource={collectionList}
                    renderItem={(item) => (
                        <List.Item>
                            <div className='collection_outer' onClick={() => goToAticle(item)}>
                                <div className='collection_middle'>
                                    <div className='collection_title'>{`${item.article.title}`}</div>
                                    <div className='collection_author'>{`--------------------【作者:${item.article.author}】`}</div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Popconfirm title="确认取消收藏该文章吗?" okText="是" cancelText="否" onConfirm={() => cancelCollection(item.articleId)}>
                                        <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} />
                                    </Popconfirm>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        </Spin>
    )
}

export default Collection
