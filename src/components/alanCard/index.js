import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Modal, Input, message } from 'antd';
import { FireTwoTone, EyeTwoTone, SmileTwoTone } from '@ant-design/icons';
import { request } from '../../utils/request';
import AppAvatar from '../avatar';
import { useSelector } from 'react-redux';
import { ALAN_AVATAR } from '../../config';

import './index.less'

/**
 * 作者介绍
*/
function AlanCard(props) {
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.user);
    const { articleTotal, videoTotal } = props;
    const navigateTypeList = [
        {type: '文章', data: articleTotal},
        {type: '视频', data: videoTotal},
    ]
    useEffect(() => {

    }, []);

    // 渲染跳转类型
    const renderType = (type = '数据', data = 0) => {
        return (
            <div className='alan-navigate' key={type}>
                <div className='navigateName'>{type}</div>
                <div className='navigateData'>{data}</div>
            </div>
        )
    }

    return (
        <Card style={{ margin: '16px auto', cursor: 'default' }}>
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
                    <button onClick={() => navigate('/alan')} >朋友圈</button>
                </div>
            </div>
        </Card>
    )
}

export default React.memo(AlanCard)
