import React, { useState, useEffect } from 'react'
import { Table, Space, message, Popconfirm } from 'antd'
import { request } from '../../utils/request';
import { useNavigate } from 'react-router-dom';
import { calcCommentsCount } from '../../utils'
import './index.less'
/**
 * 我的文章管理
*/
function MyArticle(props) {
    const [userId, setUserId] = useState(props.userInfo.userId);
    const [dataList, setData] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        getMyArticleList();
    }, [props.userInfo.userId])

    const getMyArticleList = async () => {
        let res = await request('/getArticleList', {data: {userId}});
        if(res.status === 200) {
            setData(res.data.rows);
        } else {
            message.error(res.errorMessage);
        }
    }

    const deleteArticle = async (id) => {
        let res = await request('/deleteArticle', {data: {articleId: id}});
        if(res.status === 200) {
            message.success('删除成功！');
            getMyArticleList();
        } else {
            message.error(res.errorMessage);
        }
    }

    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            align: 'center',
        },
        {
            title: '收藏数',
            dataIndex: 'collectionCount',
            key: 'collectionCount',
            align: 'center',
        },
        {
            title: '点击数',
            dataIndex: 'viewCount',
            key: 'viewCount',
            align: 'center',
        },
        {
            title: '评论数',
            dataIndex: 'comments',
            key: 'comments',
            align: 'center',
            render: (text) => (
                <span>{calcCommentsCount(text)}</span>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            align: 'center',
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            align: 'center',
        },
        {
            title: '操作',
            key: 'id',
            dataIndex: 'id',
            align: 'center',
            render: (text) => (
                <Space size="middle">
                    <a onClick={() => navigate('/writeArticle', { state: { editArticleId: text } })} >编辑</a>
                    <Popconfirm title="确认删除收藏该文章吗?" okText="是" cancelText="否" onConfirm={() => deleteArticle(text)}>
                        <a>删除</a>
                    </Popconfirm>
                    
                </Space>
            ),
        },
    ]

    return (
        <div className='help-article'>
            <Table
                columns={columns}
                dataSource={dataList}
                rowKey={record => record.id}
            />
        </div>
    )
}

export default MyArticle
