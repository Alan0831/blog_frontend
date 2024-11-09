import React, { useState, useEffect } from 'react'
import { Table, Space, message, Popconfirm, Input, Form, Button, Select } from 'antd'
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
    const [articleClassName, setArticleClassName] = useState('');
    const [articleClassOptions, setArticleClassOptions] = useState([]);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        getMyArticleList();
        searchArticleClassName();
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

    //  查询文章大类
    const searchArticleClassName = async () => {
        let res = await request('/searchArticleClassName', {data: {userId}});
        if(res.status === 200) {
            let options = [];
            res.data.rows.map((item) => {
                options.push({value: item.id, label: item.className});
            });
            setArticleClassOptions(options);
        } else {
            message.error(res.errorMessage);
        }
    }

    //  提交文章大类名称
    const submitArticleClassName = async () => {
        console.log(articleClassName);
        let res = await request('/createArticleClassName', {data: {userId, className: articleClassName}});
        if(res.status === 200) {
            message.success('创建文章大类成功！');
            searchArticleClassName();
            setArticleClassName('');
        } else {
            message.error(res.errorMessage);
        }
    }

    //  修改文章所属类
    const handleChange= async (value, record) => {
        console.log(value)
        console.log(record)
        //  如果原classId与现classId不同，则为修改
        if (record.articleclassId && record.articleclassId !== value) {
            let res = await request('/setArticleClass', {data: {userId, articleId: record.id, oldClassId: record.articleclassId, classId: value}});
            if(res.status === 200) {
                message.success('设置文章大类成功！');
                getMyArticleList();
            } else {
                message.error(res.errorMessage);
            }
        } else {
            let res = await request('/setArticleClass', {data: {userId, oldClassId: -1, articleId: record.id, classId: value}});
            if(res.status === 200) {
                message.success('设置文章大类成功！');
                getMyArticleList();
            } else {
                message.error(res.errorMessage);
            }
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
            title: '可见类型',
            dataIndex: 'visibleType',
            key: 'visibleType',
            align: 'center',
            render: (text, record) => (
                text == 1 ? '全体用户可见' : text == 2 ? '文章加锁' : '仅自己可见'
            ),
        },
        {
            title: '所属大类',
            dataIndex: 'articleclassId',
            key: 'articleclassId',
            align: 'center',
            render: (text, record) => (
                <Select onChange={(value) => handleChange(value, record)} style={{width: 120}} defaultValue={text} options={articleClassOptions} />
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
            <div className='setArticleProps'>
                <Form
                    layout='inline'
                    form={form}
                >
                    <Form.Item label="创建文章大类">
                        <Input value={articleClassName} onChange={(e) => setArticleClassName(e.target.value)} placeholder="文章大类名称" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={submitArticleClassName}>确认</Button>
                    </Form.Item>
                </Form>
            </div>
            <Table
                columns={columns}
                dataSource={dataList}
                rowKey={record => record.id}
            />
        </div>
    )
}

export default MyArticle
