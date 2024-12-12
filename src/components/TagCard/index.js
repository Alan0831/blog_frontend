import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Modal, Input, message } from 'antd';
import { TagsTwoTone } from '@ant-design/icons';
import { request } from '../../utils/request';
import { getRandomColor } from '../../utils';

import './index.less'
/**
 * tag列表
*/
function TagCard(props) {
    const { tagList } = props;
    useEffect(() => {

    }, [])

    return (
        <Card style={{ margin: '16px auto' }}>
            <div className='re-card'>
                <div className='re-title'>
                    <span>热门标签</span>
                    <span style={{ marginLeft: '7px' }}>
                        <TagsTwoTone twoToneColor='#e0730d'/>
                    </span>
                </div>
                <div className='tagContent'>
                    {
                        tagList.length ? (
                            tagList.map((item, index) => <div key={index} className='tagChildren'style={{ backgroundColor: getRandomColor(), opacity: 0.8 }}>
                                {item.tagName}
                            </div>)
                        ) : null
                    }
                </div>
            </div>
        </Card>
    )
}

export default React.memo(TagCard)
