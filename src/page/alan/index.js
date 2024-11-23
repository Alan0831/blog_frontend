import React, { useEffect, useState } from 'react'
import { message, Input, Pagination, Spin, Timeline } from 'antd';
import MiniArticleCard from '../../components/miniArticleCard'
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import { InfoCircleOutlined } from '@ant-design/icons';

const socket = new WebSocket('ws://127.0.0.1:9998');

export default function Alan() {
    const [listData, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const userInfo = useSelector(state => state.user);

    useEffect(() => {
        getArticleListFromAlan();
    }, []);

    //  获取文章列表
    const getArticleListFromAlan = async (pageNum = 1, pageSize = 10) => {
        let obj = {pageNum, pageSize, keyword};
        setLoading(true);
        try {
            const res = await request('/getArticleListFromAlan', { data: obj });
            console.log(res?.data.rows);
            if (res?.data.rows) {
                setData([...res?.data.rows]);
                setTotal(res?.data.count);
                setPageNum(res?.data.pageNum);
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
                <Timeline mode="left">
                    {
                        listData.map((item) => {
                            return (
                                <Timeline.Item label={item.createdAt}>
                                    <div className='triangle'>
                                        <span>我发表了一篇新文章：</span>
                                        <MiniArticleCard articleInfo={item} userInfo={userInfo} key={item.id} />
                                    </div>
                                </Timeline.Item>
                            )
                        })
                    }
                </Timeline>
            </div>
        </Spin>
    )
}
