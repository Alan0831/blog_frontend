import React from 'react'
import { Card, Avatar } from 'antd'
import { DISCUSS_AVATAR } from '../../config'
import { UserOutlined, MailOutlined, SoundOutlined } from '@ant-design/icons';
import './index.less'
/**
 * 用户信息卡片
*/
function AuthorInfo(props) {
    const { description = '', email = '', username = '' } = props.authorInfo;

    return (
        <Card style={{ margin: '16px auto' }} className='au-card'>
            <div>
                <div className='au-avatar'><Avatar src={DISCUSS_AVATAR}>{username}</Avatar></div>
                <div style={{marginTop: '10px'}}><UserOutlined /><span className='au-text'>{`作者: ${username}`}</span></div>
                <div><MailOutlined /><span className='au-text'>{`email: ${email}`}</span></div>
                <div><SoundOutlined /><span className='au-text'>{`个人简介: ${description || '无'}`}</span></div>
            </div>
        </Card>
    )
}

export default AuthorInfo
