import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Divider, Dropdown, Input, message } from 'antd';
import { DownOutlined, LoginOutlined, LogoutOutlined, SendOutlined } from '@ant-design/icons';
import { request } from '../../utils/request';
import { loginout } from '../../redux/user/actions';
import { calcCommentsCount, normalizeComments } from '../../utils';
import { getErrorMessage } from '../../utils/errorMessage';
import AppAvatar from '../avatar';
import useBus from '../../hooks/useBus';
import List from './list';
import './index.less';

const { TextArea } = Input;
const COMMENT_LIMIT = 500;

function Discuss(props) {
    const dispatch = useDispatch();
    const userInfo = useSelector(state => state.user);
    const bus = useBus();
    const { commentList = [], id, pageType, setCommentList } = props;
    const [value, setValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isLoggedIn = Boolean(userInfo?.username && userInfo?.userId > 0);
    const trimmedValue = value.trim();
    const commentCount = useMemo(() => calcCommentsCount(commentList), [commentList]);

    const openAuth = (type = 'login') => {
        bus.emit('openSignModal', type);
    };

    const userMenu = {
        items: isLoggedIn ? [
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
            },
        ] : [
            {
                key: 'login',
                icon: <LoginOutlined />,
                label: '登录',
            },
            {
                key: 'register',
                label: '注册',
            },
        ],
        onClick: ({ key }) => {
            if (key === 'logout') {
                dispatch(loginout());
                return;
            }
            openAuth(key);
        },
    };

    const handleSubmit = async () => {
        if (!trimmedValue) {
            message.warning('评论内容不能为空');
            return;
        }
        if (!isLoggedIn) {
            message.warning('请先登录后再评论');
            openAuth('login');
            return;
        }

        const data = {
            content: trimmedValue,
            userId: userInfo.userId,
            type: 1,
            ...(pageType == 1 ? { articleId: parseInt(id) } : { videoId: parseInt(id) }),
        };

        setSubmitting(true);
        try {
            const res = await request(pageType == 1 ? '/createComment' : '/createVideoComment', { data });
            if (res.status == 200) {
                message.success('评论发布成功');
                setValue('');
                setCommentList(normalizeComments(res.data));
            } else {
                message.error(getErrorMessage(res, '评论发布失败'));
            }
        } catch (err) {
            message.error(getErrorMessage(err?.response, '评论发布失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <section id='discuss' className='comment-panel'>
            <div className='comment-panel-header'>
                <div>
                    <div className='comment-title'>评论</div>
                    <div className='comment-subtitle'>
                        <span className='comment-count'>{commentCount}</span>
                        条讨论
                    </div>
                </div>
                <Dropdown menu={userMenu} trigger={['click']}>
                    <button className='comment-user' type='button'>
                        {isLoggedIn ? <AppAvatar userInfo={userInfo} /> : <span className='guest-avatar'>未</span>}
                        <span>{isLoggedIn ? userInfo.username : '未登录'}</span>
                        <DownOutlined />
                    </button>
                </Dropdown>
            </div>

            <Divider className='comment-divider' />

            <div className='comment-composer'>
                <div className='composer-avatar'>
                    {isLoggedIn ? <AppAvatar userInfo={userInfo} /> : <span className='guest-avatar'>未</span>}
                </div>
                <div className='composer-main'>
                    <TextArea
                        rows={4}
                        maxLength={COMMENT_LIMIT}
                        placeholder={isLoggedIn ? '说点什么，参与讨论...' : '登录后参与讨论'}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className='composer-footer'>
                        <span className='composer-tip'>支持 Ctrl / Command + Enter 发布</span>
                        <div className='composer-actions'>
                            <span className='comment-length'>{value.length}/{COMMENT_LIMIT}</span>
                            {!isLoggedIn ? (
                                <Button onClick={() => openAuth('login')}>登录后评论</Button>
                            ) : (
                                <Button
                                    icon={<SendOutlined />}
                                    type='primary'
                                    loading={submitting}
                                    disabled={!trimmedValue}
                                    onClick={handleSubmit}
                                >
                                    发布
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <List
                pageType={pageType}
                commentList={commentList}
                id={id}
                setCommentList={setCommentList}
                onLogin={() => openAuth('login')}
            />
        </section>
    );
}

Discuss.propTypes = {
    commentList: PropTypes.array.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    pageType: PropTypes.number.isRequired,
    setCommentList: PropTypes.func.isRequired,
};

export default Discuss;
