import React, { useEffect, useState } from 'react'
import { message, Spin, Timeline, Empty } from 'antd';
import MiniArticleCard from '../../components/miniArticleCard'
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import { getRandomColor } from '../../utils';

const empty = require('../../../public/icon/empty.svg');

export default function Alan() {
    const [listData, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const userInfo = useSelector(state => state.user);

    useEffect(() => {
        getArticleListFromAlan();
    }, []);

    //  获取文章列表
    const getArticleListFromAlan = async (pageNum = 1, pageSize = 10) => {
        let obj = { pageNum, pageSize, userId: userInfo.userId };
        setLoading(true);
        try {
            const res = await request('/getFriendCircle', { data: obj });
            if (res?.data.rows) {
                console.log(res?.data.rows)
                setData(res?.data.rows);
                console.log(listData)
                setTotal(res?.data.count);
                setPageNum(res?.data.pageNum);
                setLoading(false);
            } else {
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
        }
    }

    return (
        <Spin tip='加载中,请稍后...' spinning={loading}>
            <div className='alan-page'>
                {
                    listData.length > 0 ? (
                        <Timeline mode="left">
                            {
                                listData.map((item) => {
                                    return (
                                        <Timeline.Item label={item.createdAt} key={item.id}>
                                            <div className='triangle' style={{ backgroundColor: getRandomColor(), opacity: 0.8 }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{item.type == 2 ? '我上传了一个新视频：' : '我发表了一篇新文章：'}</span>
                                                <MiniArticleCard info={item} userInfo={userInfo} key={item.id} />
                                            </div>
                                        </Timeline.Item>
                                    )
                                })
                            }
                        </Timeline>
                    ) : (
                        <Empty
                            image={empty}
                            imageStyle={{
                                height: 120,
                            }}
                            description={
                                <span>
                                    暂时还没有发表朋友圈哦~
                                </span>
                            }
                        />
                    )
                }

            </div>
        </Spin>
    )
}
