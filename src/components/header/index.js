import { Button, message, Avatar, Dropdown, Badge } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import AppAvatar from '../avatar';
import { useDispatch } from 'react-redux'
import { useListener } from '../../hooks/useBus';
import { get } from '../../utils/storage';
import { loginout } from '../../redux/user/actions'
import { FileTextOutlined, IdcardOutlined, KeyOutlined, NotificationOutlined, PaperClipOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
const xuehua = require('../../../public/icon/xuehua.svg');
const shengdanwa = require('../../../public/icon/shengdanwa.svg');
const shengdanreyin = require('../../../public/icon/shengdanreyin.svg');
const xiaolu = require('../../../public/icon/xiaolu.svg');
const xiaoxiong = require('../../../public/icon/xiaoxiong.svg');
const shengdanmao = require('../../../public/icon/shengdanmao.svg');
const shengdanwu = require('../../../public/icon/shengdanwu.svg');
const headerHeight = 45;
import './index.less'

function Header() {
    const [loginStatus, setLoginStatus] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [isHomePage, setIsHomePage] = useState(true);
    const [notice, setNotice] = useState([]);
    const [headerVisible, setHeaderVisible] = useState(true);
    const headerRef = useRef(null);
    const oldScroll = useRef(0);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

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
            label: (
                <div onClick={() => navigate('/help', { state: { key: '4' } })}>
                    回复我的
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
        },
        {
            title: '退出',
            img: shengdanwa,
            cb: () => exit()
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
        const userInfo = get('userInfo');
        // 如果用户已登录，修改用户框
        if (userInfo) {
            setLoginStatus(true);
            setUserInfo(userInfo);
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
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // 监听页面滚动时间
    const handleScroll = () => {
        const scrollPosition = window.scrollY;
        let isVisible = scrollPosition < headerHeight || oldScroll.current > scrollPosition;
        setHeaderVisible(isVisible);
        oldScroll.current = scrollPosition; 
    };

    //  监听userInfo变化
    useListener('getLogin', type => {
        setLoginStatus(true);
        setUserInfo(type || {});
    });

    //  监听notification变化
    useListener('getNotice', data => {
        setNotice(data || 0);
    });

    //  退出登录
    const exit = () => {
        console.log('退出登录');
        dispatch(loginout());
        navigate('/');
        setUserInfo({});
        setLoginStatus(false);
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
                                <Badge count={notice} size="small">
                                    <div style={{ cursor: 'pointer', display: 'flex' }}>
                                        <AppAvatar userInfo={userInfo} popoverVisible={false} />
                                    </div>
                                    {/* <Avatar src='bilan.jpeg' style={{ cursor: 'pointer' }} size={36} /> */}
                                </Badge>
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
