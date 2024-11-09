import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './index.less'
// import { DISCUSS_AVATAR } from '@/config'
import { request } from '../../utils/request';
import { useSelector, useDispatch } from 'react-redux'
import { QqOutlined, DownOutlined } from '@ant-design/icons';
import { loginout } from '../../redux/user/actions'
// methods
import { calcCommentsCount } from '../../utils'

// components
import { Comment, Avatar, Form, Button, Divider, Input, Menu, Dropdown, message, Modal } from 'antd'
import List from './list' // 评论列表
import AppAvatar from '../avatar'
import useBus from '../../hooks/useBus'
const { TextArea } = Input

const Editor = ({ onChange, onSubmit, value }) => (
    <div>
        <Form.Item>
            <TextArea rows={4} placeholder='说点什么...' onChange={onChange} value={value} />
        </Form.Item>
        <Form.Item>
            <div className='controls'>
                <Button className='disscus-btn' htmlType='submit' onClick={onSubmit} type='primary'>
                    发布
                </Button>
            </div>
        </Form.Item>
    </div>
)

function Discuss(props) {
    const dispatch = useDispatch();
    const userInfo = useSelector(state => state.user);
    console.log(userInfo);
    const bus = useBus();
    const { username, userId } = userInfo;
    const { commentList, articleId } = props;
    const [value, setValue] = useState('');
    const renderDropdownMenu = () =>  username ? {items: [
        {
            key: 'loginout',
            label: '注销',
        },
    ]} :  {items: [
        
        {
            key: 'login',
            label: (
                <div onClick={() => handleMenuClick('login')}>登录</div>
            ),
        },
        {
            key: 'register',
            label: (
                <div onClick={() => handleMenuClick('register')}>注册</div>
            ),
        },
    ]};

    const handleMenuClick = (type) => {
        console.log(type)
        switch (type) {
          case 'login':
            bus.emit('openSignModal', 'login');
            break
          case 'register':
            bus.emit('openSignModal', 'register');
            break
          case 'loginout':
            dispatch(loginout());
            break
          default:
            break
        }
      }

    const handleSubmit = async () => {
        if (!value) return
        if (!userInfo.username) return message.warn('您未登陆，请登录后再评论。')
        let obj = {
            content: value,
            userId,
            articleId: parseInt(articleId),
            type: 1, // type:1 评论  2 回复
        }
        let res = await request('/createComment', {data: obj});
        if (res.status == 200) {
            message.success('发布评论成功！');
            setValue('');
            props.setCommentList(res.data.comments);
        } else {
            message.error(res.errorMessage);
        }
    }

    return (
        <div id='discuss'>
            <div className='discuss-header'>
                <div>
                    <span className='discuss-count'>{calcCommentsCount(commentList)}</span>
                    {articleId !== -1 ? '条评论' : '条留言'}
                </div>
                <span className='discuss-user'>
                    <Dropdown menu={renderDropdownMenu()} trigger={['click', 'hover']}>
                        {username ? (<AppAvatar userInfo={userInfo} />) : <span>未登录用户 &nbsp; <DownOutlined /></span>}
                    </Dropdown>
                </span>
                <Divider className='hr' />
            </div>

            <Comment
                avatar={
                    username ? (
                        <AppAvatar userInfo={userInfo} />
                    ) : (
                        <QqOutlined style={{ fontSize: 40, margin: '5px 5px 0 0' }} />
                    )
                }
                content={
                    <Editor
                        onChange={(e) => setValue(e.target.value)}
                        onSubmit={handleSubmit}
                        value={value}
                    />
                }
            />

            <List commentList={commentList} articleId={articleId} setCommentList={props.setCommentList} />
        </div>
    )
}

Discuss.propTypes = {
  commentList: PropTypes.array.isRequired
}

export default Discuss
