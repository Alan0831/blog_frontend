import { message, Dropdown, Badge } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import AppAvatar from '../avatar';
import { useDispatch } from 'react-redux'
import { useListener } from '../../hooks/useBus';
import { getValidUserInfo } from '../../utils/auth';
import { request } from '../../utils/request';
import { loginout } from '../../redux/user/actions'
import { FileTextOutlined, IdcardOutlined, KeyOutlined, LogoutOutlined, NotificationOutlined, PaperClipOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import './index.less'
const xuehua = require('../../../public/icon/xuehua.svg');
const shengdanreyin = require('../../../public/icon/shengdanreyin.svg');
const xiaolu = require('../../../public/icon/xiaolu.svg');
const xiaoxiong = require('../../../public/icon/xiaoxiong.svg');
const shengdanmao = require('../../../public/icon/shengdanmao.svg');
const shengdanwu = require('../../../public/icon/shengdanwu.svg');
const headerHeight = 45;
const NOTICE_RECONNECT_MAX_DELAY = 30000;

// 根据当前站点协议选择 ws/wss，避免 https 页面下被浏览器拦截混合内容连接。
const getNoticeSocketUrl = (token) => {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const baseUrl = isLocal ? 'ws://127.0.0.1:9998' : `${protocol}://8.152.1.135:9998`;
    return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
}

// 统一兼容 websocket、回复列表接口、手动同步传来的不同结构，最终只给 Badge 一个未读数字。
// 返回 null 表示这不是一条通知数量消息，避免 websocket 心跳/普通文本把真实未读数覆盖成 0。
const normalizeNoticeCount = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'number') return Number.isFinite(data) ? Math.max(0, data) : null;
    if (typeof data === 'string') {
        const text = data.trim();
        if (!text) return null;
        const count = Number(text);
        return Number.isNaN(count) ? null : Math.max(0, count);
    }
    if (Array.isArray(data)) {
        return data.filter(item => item?.read === 0 || item?.read === '0' || item?.read === false).length;
    }
    if (data && typeof data === 'object') {
        const count = data.unreadCount ?? data.unread ?? data.count ?? data.total;
        if (count !== undefined) return normalizeNoticeCount(count);
        if (Array.isArray(data.rows)) return normalizeNoticeCount(data.rows);
        if (Array.isArray(data.data?.rows)) return normalizeNoticeCount(data.data.rows);
        if (Array.isArray(data.data)) return normalizeNoticeCount(data.data);
        if (data.data && typeof data.data === 'object') return normalizeNoticeCount(data.data);
    }
    return null;
}

function Header() {
    const [loginStatus, setLoginStatus] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [isHomePage, setIsHomePage] = useState(true);
    const [notice, setNotice] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(true);
    const headerRef = useRef(null);
    const oldScroll = useRef(0);
    const scrollFrameRef = useRef(null);
    const headerVisibleRef = useRef(true);
    const noticeSocketRef = useRef(null);
    const noticeReconnectTimerRef = useRef(null);
    const noticeReconnectTimesRef = useRef(0);
    const shouldReconnectNoticeSocketRef = useRef(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const parsedNotice = Number(notice);
    const noticeCount = Number.isFinite(parsedNotice) && parsedNotice > 0 ? Math.floor(parsedNotice) : 0;
    const hasNotice = noticeCount > 0;

    const items = [
        {
            key: '1',
            label: (
                <div onClick={() => navigate('/help', { state: { key: '1' } })} >
                    我的文章
                </div>
            ),
            icon: <FileTextOutlined />,
        },
        {
            key: '6',
            label: (
                <div onClick={() => navigate('/help', { state: { key: '6' } })} >
                    我的视频
                </div>
            ),
            icon: <VideoCameraOutlined />,
        },
        {
            key: '2',
            label: (
                <div onClick={() => navigate('/help', { state: { key: '2' } })}>
                    个人信息
                </div>
            ),
            icon: <IdcardOutlined />,
        },
        {
            key: '3',
            label: (
                <div onClick={() => navigate('/help', { state: { key: '3' } })}>
                    修改密码
                </div>
            ),
            icon: <KeyOutlined />,
        },
        {
            key: '4',
            // 回复我的菜单项复用同一个 notice 数字，保证头像红点和下拉菜单提示同步。
            label: (
                <div className='header_notice_menu_item' onClick={() => navigate('/help', { state: { key: '4' } })}>
                    <span>回复我的</span>
                    {hasNotice ? <Badge count={noticeCount} size="small" overflowCount={99} /> : null}
                </div>
            ),
            icon: <NotificationOutlined />,
        },
        {
            key: '5',
            label: (
                <div onClick={() => navigate('/help', { state: { key: '5' } })}>
                    我的收藏
                </div>
            ),
            icon: <PaperClipOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: (
                <div onClick={() => exit()}>
                    退出
                </div>
            ),
            icon: <LogoutOutlined />,
        },
    ];
    const headerPartList = [
        {
            title: '写文章',
            img: xuehua,
            cb: () => navigate('/writeArticle')
        },
        {
            title: '上传视频',
            img: shengdanreyin,
            cb: () => navigate('/uploadVideo')
        }
    ];
    const headerPartListWithoutLogin = [
        {
            title: '登录',
            img: xiaolu,
            cb: () => location.pathname !== '/login' && navigate('/login', { state: { nowStatus: 'login' } })
        },
        {
            title: '注册',
            img: xiaoxiong,
            cb: () => location.pathname !== '/login' && navigate('/login', { state: { nowStatus: 'register' } })
        },
    ];

    useEffect(() => {
        const userInfo = getValidUserInfo();
        // 如果用户已登录且 token 未过期，修改用户框；过期登录态会在工具方法里被清理。
        if (userInfo) {
            setLoginStatus(true);
            setUserInfo(userInfo);
        } else {
            setLoginStatus(false);
            setUserInfo({});
        }

        // 如果页面在首页，则不显示返回按钮
        if (location.pathname === '/') {
            setIsHomePage(true);
        } else {
            console.log(location.pathname)
            setIsHomePage(false);
        }
    }, [location]);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollFrameRef.current) return;

            scrollFrameRef.current = window.requestAnimationFrame(() => {
                const scrollPosition = window.scrollY;
                const isVisible = scrollPosition < headerHeight || oldScroll.current > scrollPosition;
                oldScroll.current = scrollPosition;
                scrollFrameRef.current = null;

                if (headerVisibleRef.current !== isVisible) {
                    headerVisibleRef.current = isVisible;
                    setHeaderVisible(isVisible);
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
        };
    }, []);

    useEffect(() => {
        if (!loginStatus || !userInfo.userId || userInfo.userId <= 0) {
            setNotice(0);
            return;
        }

        let ignore = false;

        // 登录后先主动拉一次回复列表，避免 websocket 定时推送到来前头像和菜单没有未读提示。
        const getInitialNoticeCount = async () => {
            try {
                const res = await request('/getNotice', { data: { userId: userInfo.userId } });
                if (!ignore && res?.status === 200) {
                    setNotice(normalizeNoticeCount(res?.data?.rows || res?.data) ?? 0);
                }
            } catch (err) {
                console.error('获取未读回复数量失败:', err);
            }
        }

        getInitialNoticeCount();

        return () => {
            ignore = true;
        }
    }, [loginStatus, userInfo.userId]);

    useEffect(() => {
        if (!loginStatus || !userInfo.username) {
            setNotice(0);
            return;
        }

        let disposed = false;
        shouldReconnectNoticeSocketRef.current = true;

        const clearReconnectTimer = () => {
            if (noticeReconnectTimerRef.current) {
                window.clearTimeout(noticeReconnectTimerRef.current);
                noticeReconnectTimerRef.current = null;
            }
        }

        const connectNoticeSocket = () => {
            clearReconnectTimer();
            const socket = new WebSocket(getNoticeSocketUrl(userInfo.token));
            noticeSocketRef.current = socket;

            socket.onopen = () => {
                if (disposed || noticeSocketRef.current !== socket) return;
                noticeReconnectTimesRef.current = 0;
                // 连接成功后把当前登录用户发给后端，避免复用旧用户信息订阅通知。
                socket.send(JSON.stringify({
                    toName: userInfo.username,
                    userId: userInfo.userId,
                    timeSchedule: '30 * * * * *',
                }));
            };

            socket.onmessage = (res) => {
                if (disposed || noticeSocketRef.current !== socket) return;
                try {
                    // websocket 数据先安全解析，再归一化成未读数量，避免非 JSON 消息把页面打崩。
                    const nextNotice = normalizeNoticeCount(JSON.parse(res.data));
                    if (nextNotice !== null) setNotice(nextNotice);
                } catch (error) {
                    console.warn('通知 websocket 返回了非 JSON 数据:', res.data);
                    const nextNotice = normalizeNoticeCount(res.data);
                    if (nextNotice !== null) setNotice(nextNotice);
                }
            }

            socket.onerror = (err) => {
                console.error('通知 websocket 错误:', err);
            }

            socket.onclose = () => {
                if (noticeSocketRef.current === socket) noticeSocketRef.current = null;
                if (disposed || !shouldReconnectNoticeSocketRef.current) return;
                const delay = Math.min(
                    NOTICE_RECONNECT_MAX_DELAY,
                    1000 * Math.pow(2, noticeReconnectTimesRef.current)
                );
                noticeReconnectTimesRef.current += 1;
                // 断线后做指数退避重连，避免服务端异常时前端疯狂重连。
                noticeReconnectTimerRef.current = window.setTimeout(connectNoticeSocket, delay);
            }
        }

        connectNoticeSocket();

        return () => {
            disposed = true;
            shouldReconnectNoticeSocketRef.current = false;
            clearReconnectTimer();
            const socket = noticeSocketRef.current;
            if (socket) {
                socket.onopen = null;
                socket.onmessage = null;
                socket.onerror = null;
                socket.onclose = null;
                if ([WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) {
                    socket.close();
                }
                noticeSocketRef.current = null;
            }
        }
    }, [loginStatus, userInfo.username, userInfo.userId]);

    // 监听页面滚动时间
    //  监听userInfo变化
    useListener('getLogin', type => {
        setLoginStatus(true);
        setUserInfo(type || {});
    });

    //  监听notification变化
    useListener('getNotice', data => {
        // 回复页标记已读后会广播最新列表，这里统一换算成未读数字。
        const nextNotice = normalizeNoticeCount(data);
        if (nextNotice !== null) setNotice(nextNotice);
    });

    //  退出登录
    const exit = () => {
        console.log('退出登录');
        dispatch(loginout());
        navigate('/');
        setUserInfo({});
        setLoginStatus(false);
        // 退出时立即清空提示，后续 websocket effect 会负责关闭旧连接。
        setNotice(0);
        message.success('退出登录辽!');
    }

    // 渲染标签svg+标题
    const renderHeaderPart = (img, title, cb) => (
        <div key={title} onClick={cb} className='header_part'>
            <img src={img}></img>
            <span>{title}</span>
        </div>
    )

    return (
        <div className='header' ref={headerRef} style={{ opacity: headerVisible ? '1' : '0' }}>
            <div className='header_left'>
                {
                    !isHomePage && (
                        <div className='header_left_left'>
                            <div onClick={() => navigate('/')} className='header_part'>
                                <img src={shengdanwu}></img>
                                <span>首页</span>
                            </div>
                            <div onClick={() => navigate(-1)} className='header_part'>
                                <img src={shengdanmao}></img>
                                <span>返回</span>
                            </div>
                        </div>
                    )
                }
            </div>
            <div className='header_right'>
                {
                    loginStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Dropdown menu={{ items }} placement='bottom'>
                                {
                                    hasNotice ? (
                                        <Badge count={noticeCount} size="small" overflowCount={99}>
                                            <div style={{ cursor: 'pointer', display: 'flex' }}>
                                                <AppAvatar userInfo={userInfo} popoverVisible={false} />
                                            </div>
                                        </Badge>
                                    ) : (
                                        <div style={{ cursor: 'pointer', display: 'flex' }}>
                                            <AppAvatar userInfo={userInfo} popoverVisible={false} />
                                        </div>
                                    )
                                }
                            </Dropdown>
                            {
                                headerPartList.map((item) => {
                                    return renderHeaderPart(item.img, item.title, item.cb);
                                })
                            }
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {
                                headerPartListWithoutLogin.map((item) => {
                                    return renderHeaderPart(item.img, item.title, item.cb);
                                })
                            }
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default React.memo(Header);
