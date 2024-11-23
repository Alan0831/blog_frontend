import { Button, message, Avatar, Dropdown, Badge } from 'antd'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import AppAvatar from '../avatar';
import { useDispatch } from 'react-redux'
import { useListener } from '../../hooks/useBus';
import { get } from '../../utils/storage';
import { loginout } from '../../redux/user/actions'
import { FileTextOutlined, IdcardOutlined, KeyOutlined, NotificationOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import './index.less'

function Header() {
    const [loginStatus, setLoginStatus] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [isHomePage, setIsHomePage] = useState(true);
    const [notice, setNotice] = useState([]);
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
        dispatch(loginout());
        navigate('/');
        setUserInfo({});
        setLoginStatus(false);
        message.success('退出登录辽!');
    }

    return (
        <div className='header'>
            <div className='header_left'>
                <div>309车管所</div>
                {!isHomePage && <Button onClick={() => navigate('/')} className="button">返回</Button>}
            </div>
            <div className='header_right'>
                {
                    loginStatus ? (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <Dropdown menu={{ items }} placement='bottom'>
                                <Badge count={notice} size="small">
                                    <div style={{cursor: 'pointer', display: 'flex'}}>
                                        <AppAvatar userInfo={userInfo} popoverVisible={false} />
                                    </div>
                                {/* <Avatar src='bilan.jpeg' style={{ cursor: 'pointer' }} size={36} /> */}
                                </Badge>
                            </Dropdown>
                            <Button onClick={() => navigate('/writeArticle')} className="button">写文章</Button>
                            <Button onClick={() => navigate('/uploadVideo')} className="button">上传视频</Button>
                            <Button className="button" onClick={exit}>退出</Button>
                        </div>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <Button onClick={() => navigate('/login', { state: { nowStatus: 'login' } })} className="button">登录</Button>
                            <Button onClick={() => navigate('/login', { state: { nowStatus: 'register' } })} className="button">
                                注册
                            </Button>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default Header
