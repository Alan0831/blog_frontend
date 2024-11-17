import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Modal, Input, message } from 'antd';
import { FireTwoTone, EyeTwoTone, SmileTwoTone } from '@ant-design/icons';
import { request } from '../../utils/request';
import AppAvatar from '../avatar';
import { useSelector } from 'react-redux';
import { ALAN_AVATAR } from '../../config';

import './index.less'
const navigateTypeList = [
    {type: '文章', data: 9},
    {type: '标签', data: 3},
]
/**
 * 作者介绍
*/
function AlanCard(props) {
    const { type } = props;
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.user);
    useEffect(() => {
        
    }, []);

    // 渲染跳转类型
    const renderType = (type = '数据', data = 0, navigate = '/') => {
        return (
            <div className='alan-navigate'>
                <div className='navigateName'>{type}</div>
                <div className='navigateData'>{data}</div>
            </div>
        )
    }

    return (
        <Card style={{ margin: '16px auto' }}>
            <div className='alan-card'>
                <div className='alan-title'>
                    <AppAvatar style={{width: '70px', height: '70px'}} image={ALAN_AVATAR} popoverVisible={false} />
                </div>
                <div className='alan-name'>
                    <p>ALAN ARMSTRONG</p>
                </div>
                <div className='alan-type'>
                    {
                        navigateTypeList.map((item) => {
                            return renderType(item.type, item.data);
                        })
                    }
                </div>
                <div className='alan-button'>
                    <button>朋友圈</button>
                </div>
            </div>
        </Card>
    )
}

export default AlanCard
