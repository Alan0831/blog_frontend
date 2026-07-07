import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Input, Modal, message } from 'antd';
import {
    CalendarOutlined,
    EyeOutlined,
    FireOutlined,
    LockOutlined,
    PictureOutlined,
    PlayCircleFilled,
    SmileOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { request } from '../../utils/request';
import { getOptimizedCoverUrl } from '../../utils/image';

import './index.less';

const RECOMMEND_CONFIG = {
    1: { title: '热门文章', icon: FireOutlined, itemLabel: '文章' },
    2: { title: '猜你喜欢', icon: SmileOutlined, itemLabel: '文章' },
    3: { title: '热门视频', icon: VideoCameraOutlined, itemLabel: '视频' },
};

const formatDate = value => {
    if (!value) return '日期待补充';
    return String(value).replace('T', ' ').slice(0, 16);
};

/** type: 1 热门文章 / 2 猜你喜欢 / 3 热门视频 */
function Recommend({ type = 1, articleList = [] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [currentArticleId, setCurrentArticleId] = useState('');
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.user);
    const config = RECOMMEND_CONFIG[type] || RECOMMEND_CONFIG[1];
    const HeaderIcon = config.icon;
    const listData = Array.isArray(articleList) ? articleList : [];

    const gotoArticle = item => {
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
    };

    const unLockArticle = async () => {
        if (!password) {
            message.info('请输入文章密码');
            return;
        }

        const res = await request('/validateArticleLock', {
            data: { password, articleId: currentArticleId },
        });
        if (res.status == 200) {
            message.success('解锁成功！');
            setModalOpen(false);
            navigate(`/article/${currentArticleId}`);
        } else {
            message.error(res.errorMessage);
            setModalOpen(false);
        }
    };

    const closeModal = async () => {
        setCurrentArticleId('');
        await request('/validateArticleLock', { data: {} });
        setModalOpen(false);
    };

    return (
        <Card className='sidebar-card recommend-card'>
            <section className='re-card' aria-labelledby={`recommend-title-${type}`}>
                <header className='re-title' id={`recommend-title-${type}`}>
                    <span className='re-title-icon' aria-hidden='true'><HeaderIcon /></span>
                    <span>{config.title}</span>
                    <span className='re-title-line' aria-hidden='true' />
                </header>

                {listData.length > 0 ? (
                    <ol className='re-list'>
                        {listData.map((item, index) => {
                            const cover = type === 3 ? item.poster : item.articleCover;
                            const isLocked = type !== 3 && item.visibleType === 2 && item.userId !== userInfo.userId;

                            return (
                                <li className='re-list-item' key={item.id || `${item.title}-${index}`}>
                                    <button
                                        className='re-item'
                                        type='button'
                                        onClick={() => gotoArticle(item)}
                                        aria-label={`查看${config.itemLabel}：${item.title}`}
                                    >
                                        <span className='re-cover'>
                                            <span className='re-cover-placeholder' aria-hidden='true'>
                                                {type === 3 ? <PlayCircleFilled /> : <PictureOutlined />}
                                            </span>
                                            {cover ? (
                                                <img
                                                    src={getOptimizedCoverUrl(cover, 240)}
                                                    alt=''
                                                    loading='lazy'
                                                    onError={event => { event.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : null}
                                            <span className={`re-rank${index < 3 ? ' is-leading' : ''}`}>{index + 1}</span>
                                            {type === 3 ? <span className='re-play' aria-hidden='true'><PlayCircleFilled /></span> : null}
                                        </span>

                                        <span className='re-item-body'>
                                            <span className='re-item-title'>
                                                {isLocked ? <LockOutlined className='re-lock' aria-label='加密文章' /> : null}
                                                {item.title || '未命名内容'}
                                            </span>
                                            <span className='re-meta'>
                                                <span><CalendarOutlined />{formatDate(item.createdAt)}</span>
                                                <span><EyeOutlined />{item.viewCount || 0}</span>
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                ) : (
                    <div className='re-empty'>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无推荐内容' />
                    </div>
                )}
            </section>

            <Modal
                title='解锁文章'
                open={modalOpen}
                okText='确定'
                cancelText='关闭'
                closable={false}
                onOk={unLockArticle}
                onCancel={closeModal}
            >
                <Input.Password
                    autoFocus
                    placeholder='请输入密码'
                    value={password}
                    onPressEnter={unLockArticle}
                    onChange={event => setPassword(event.target.value)}
                />
            </Modal>
        </Card>
    );
}

export default React.memo(Recommend);
