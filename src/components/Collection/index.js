import React, { useState, useEffect } from 'react';
import { List, Spin, message, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import { StarTwoTone } from '@ant-design/icons';
import './index.less'

/**
 * 我的收藏
*/
function Collection(props) {
    const { userId } = props.userInfo;
    const [articleCollectionList, setArticleCollectionList] = useState([]);
    const [videoCollectionList, setVideoCollectionList] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getCommentDataList();
    }, [])

    //  获取收藏列表
    const getCommentDataList = async () => {
        let res = await request('/searchCollection', { data: { owner: userId } });
        if (res.status === 200) {
            setArticleCollectionList(res.data.article.rows);
            setVideoCollectionList(res.data.video.rows);
            setLoading(false);
        } else {
            message.error(res.errorMessage);
            setLoading(false);
        }
    }

    //  跳转至文章
    const goToAticle = async (item) => {
        if (item.articleId) {
            navigate(`/article/${item.articleId}`);
        } else if (item.videoId) {
            navigate(`/video/${item.videoId}`);
        }
    }

    // 取消收藏
    const cancelCollection = async (item, e) => {
        console.log(item);
        console.log(e);

        try {
            let data = {
                owner: parseInt(userId),
            }
            if (item.articleId) {
                data.collectionArticleId = parseInt(item.articleId);
                await request('/deleteCollection', { data });
                message.success('取消收藏成功');
                getCommentDataList();
            } else if (item.videoId) {
                data.collectionVideoId = parseInt(item.videoId);
                await request('/deleteVideoCollection', { data });
                message.success('取消收藏成功');
                getCommentDataList();
            }
        } catch (err) {
            message.error('取消收藏失败:' + err);
            console.error(err);
        }
    }

    return (
        <Spin tip='加载中...' spinning={loading}>
            <div className='my_notice'>
                <List
                    header={<div>文章收藏列表</div>}
                    bordered
                    dataSource={articleCollectionList}
                    renderItem={(item) => (
                        <List.Item>
                            <div className='collection_outer' onClick={() => goToAticle(item)}>
                                <div className='collection_middle'>
                                    <div className='collection_title'>{`${item.article.title}`}</div>
                                    <div className='collection_author'>{`--------------------【作者:${item.article.author}】`}</div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Popconfirm title="确认取消收藏该文章吗?" okText="是" cancelText="否" onConfirm={() => cancelCollection(item)}>
                                        <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} />
                                    </Popconfirm>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />

                <List
                    header={<div>视频收藏列表</div>}
                    bordered
                    dataSource={videoCollectionList}
                    renderItem={(item) => (
                        <List.Item>
                            <div className='collection_outer' onClick={() => goToAticle(item)}>
                                <div className='collection_middle'>
                                    <div className='collection_title'>{`${item.video.title}`}</div>
                                    <div className='collection_author'>{`--------------------【作者:${item.video.author}】`}</div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Popconfirm title="确认取消收藏该视频吗?" okText="是" cancelText="否" onConfirm={() => cancelCollection(item)}>
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
