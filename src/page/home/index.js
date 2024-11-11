import React, { useEffect, useState } from 'react'
import { List, message, Input, Pagination, Spin } from 'antd';
import ArticleCard from '../../components/ArticleCard'
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';
import './index.less'
import Recommend from '../../components/Recommend';
import useBus from '../../hooks/useBus';

const { Search } = Input;
const socket = new WebSocket('ws://127.0.0.1:9998');

export default function Home() {
    const [listData, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recommendArticleListData, setRecommendArticleList] = useState([]);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const userInfo = useSelector(state => state.user);
    const bus = useBus();

    useEffect(() => {
        initSocket();
        Promise.allSettled([getRecommendArticleList(), getArticleList()])
        .then(() => console.log('加载数据完成'))
        .catch((err) => console.error(err));
    }, []);

    const initSocket = () => {
        socket.onopen = () => {
            console.log("服务器链接成功");
            socket.send(JSON.stringify({toName: userInfo.username}));
        };
        // 接收到消息的回调
        socket.onmessage = (res) => {
            console.log(res);
            bus.emit('getNotice', JSON.parse(res.data));
        }
        // 连接发生错误的回调
        socket.onerror = (err) => {
            console.error('socket错误:' + err);
        }
        // 关闭的回调
        socket.onclose = () => {
            console.log('socket已关闭');
        }
    }

    //  获取文章列表
    const getArticleList = async (pageNum = 1, pageSize = 10, keyword = '') => {
        let obj = {pageNum, pageSize, keyword};
        setLoading(true);
        try {
            const res = await request('/getArticleList', { data: obj });
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

    //  翻页
    const changePage = (page) => {
        getArticleList(page, 10, keyword);
    }

    const handlePressEnter = () => {
        getArticleList(1, 10, keyword);
    }

    return (
        <Spin tip='加载中,请稍后...' spinning={loading}>
            <div className='home_content'>
                <div className='home_under_content'>
                    <div className='home_left_content'>
                        <Recommend  type={1} articleList={recommendArticleListData}></Recommend>
                    </div>
                    <div className='home_right_content'>
                        <div className='home_search'>
                            <Search
                                placeholder="请输入文章标题"
                                enterButton
                                onChange={(e) => setKeyword(e.target.value)}
                                value={keyword}
                                onPressEnter={handlePressEnter}
                                onSearch={handlePressEnter}
                                style={{ width: '50%' }} 
                            />
                        </div>
                        <div className='home_list'>
                            <List
                                dataSource={listData}
                                renderItem={item => (
                                    <List.Item>
                                        <ArticleCard articleInfo={item} userInfo={userInfo} ></ArticleCard>
                                    </List.Item>
                                )}
                            />
                        </div>
                        <div className='home_pagination'>
                            <Pagination current={pageNum} total={total} onChange={changePage} pageSize={10} />
                        </div>
                    </div>
                </div>
            </div>
        </Spin>
    )
}
