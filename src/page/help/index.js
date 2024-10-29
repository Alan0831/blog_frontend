import React, { useState, useEffect } from 'react';
import './index.less';
import { useNavigate } from 'react-router-dom';
import { Tabs, Modal } from 'antd';
import MyArticle from '../../components/MyArticle';
import MyInfo from '../../components/MyInfo';
import Notice from '../../components/Notice';
import ChangePassword from '../../components/changePassword';
import Collection from '../../components/Collection';
import { useSelector } from 'react-redux';
import { FileTextOutlined, IdcardOutlined, KeyOutlined, NotificationOutlined, PaperClipOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
/**
 * 帮助中心
*/
function Help() {
    const userInfo = useSelector(state => state.user);
    const [active, setActive] = useState('1');
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (userInfo.userId === -1) {
            // 如果userId为-1，则未登录，强制返回首页
            Modal.confirm({
                title: '提示：',
                icon: <ExclamationCircleOutlined />,
                content: '您未登录，请先去登录',
                okText: '确认',
                cancelText: '取消',
                onOk: () => navigate('/login'),
                onCancel: () => navigate('/login'),
            });
        } else {
            setActive(location.state.key || '1');
        }
    }, [location.state])

    const items = [
        {
            label: (<div><FileTextOutlined />我的文章</div>),
            key: '1',
            children: <MyArticle userInfo={userInfo}></MyArticle>,
        },
        {
            label: (<div><IdcardOutlined />个人信息</div>),
            key: '2',
            children: <MyInfo userInfo={userInfo}></MyInfo>,
        },
        {
            label: (<div><KeyOutlined />修改密码</div>),
            key: '3',
            children: <ChangePassword userInfo={userInfo}></ChangePassword>,
        },
        {
            label: (<div><NotificationOutlined />回复我的</div>),
            key: '4',
            children: <Notice userInfo={userInfo}></Notice>,
        },
        {
            label: (<div><PaperClipOutlined />我的收藏</div>),
            key: '5',
            children: <Collection userInfo={userInfo}></Collection>,
        },
    ]

    return (
        <div className='help'>
            <Tabs
                tabPosition='left'
                items={items}
                activeKey={active}
                onChange={(active) => setActive(active)}
            />
            {/* <div className='back'>
                <Button className='back-btn' type='goast' onClick={() => navigate('/')}>返回主页</Button>
            </div> */}
        </div>
    )
}

export default Help
