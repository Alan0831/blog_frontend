import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Modal, Input, message } from 'antd';
import { FireTwoTone, EyeTwoTone, SmileTwoTone, VideoCameraTwoTone } from '@ant-design/icons';
import { request } from '../../utils/request';
import { useSelector } from 'react-redux';

import './index.less'
/**
 * 推荐文章/猜你喜欢
 * 1 文章 2 猜你喜欢 3 视频
*/
function Recommend(props) {
    const { type } = props;
    const [listData, setData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [currentArticleId, setCurrentArticleId] = useState('');
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.user);
    useEffect(() => {
        setData(props.articleList);
    }, [props.articleList])

    const gotoArticle = (item) => {
        if (type === 1 || type === 2) {
            if (item.visibleType === 2 && item.userId !== userInfo.userId) {
                setPassword('');
                setCurrentArticleId(item.id);
                setModalOpen(true);
            } else {
                navigate(`/article/${item.id}`);
            }
        } else {
            navigate(`/video/${item.id}`);
        }
    }

    // 解锁文章
    const unLockArticle = async () => {
        if (!password) {
            message.info('请输入文章密码');
            return;
        }
        let obj = {
            password,
            articleId: currentArticleId,
        };
        const res = await request('/validateArticleLock', { data: obj });
        if (res.status == 200) {
            message.success('解锁成功！');
            setModalOpen(false);
            navigate(`/article/${currentArticleId}`);
        } else {
            message.error(res.errorMessage);
            setModalOpen(false);
        }
    }

    const closeModal = async () => {
        setCurrentArticleId('');
        await request('/validateArticleLock', { data: {} });
        setModalOpen(false);
    }

    return (
        <Card style={{ margin: '16px auto' }}>
            <div className='re-card'>
                <div className='re-title'>{type === 1 ? '热门文章' : type === 2 ? '猜你喜欢' : '热门视频'}
                    <span style={{ marginLeft: '7px' }}>
                        {type === 1 ? <FireTwoTone twoToneColor='#e0730d' /> : type === 2 ? <SmileTwoTone twoToneColor='#e0730d' /> : <VideoCameraTwoTone twoToneColor='#e0730d' />}
                    </span>
                </div>
                <div className='re-list'>
                    {
                        listData.length ? (
                            listData.map((item, index) => <p onClick={() => gotoArticle(item)} key={index}>
                                <span className='re-content'>{index + 1} 、&nbsp; {item.title}</span>
                                <span style={{ marginLeft: '7px' }}><EyeTwoTone twoToneColor='#858585' /></span>
                                <span style={{ marginLeft: '7px' }}>{item.viewCount}</span>
                            </p>)
                        ) : null
                    }
                </div>
            </div>
            <Modal
                title="解锁文章"
                open={modalOpen}
                okText='确定'
                cancelText='关闭'
                closable={false}
                onOk={unLockArticle}
                onCancel={closeModal}
            >
                <Input placeholder='请输入密码' value={password} onChange={(e) => setPassword(e.target.value)} />
            </Modal>
        </Card>
    )
}

export default React.memo(Recommend)
