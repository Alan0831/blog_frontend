import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Divider } from 'antd';
import { FireTwoTone, EyeTwoTone } from '@ant-design/icons';

import './index.less'
/**
 * 推荐文章
*/
function Recommend(props) {
    const [listData, setData] = useState([])
    const navigate = useNavigate();
    useEffect(() => {
        setData(props.articleList);
    }, [props.articleList])

    return (
        <Card style={{ margin: '16px auto' }}>
            <div className='re-card'>
                <div className='re-title'>热门文章<span style={{marginLeft: '7px'}}><FireTwoTone twoToneColor='#e0730d' /></span></div>
                <div className='re-list'>
                    {
                        listData.length ? (
                            listData.map((item, index) => <p onClick={() => navigate(`/article/${item.id}`)} key={index}>
                                <span  className='re-content'>{index + 1} 、&nbsp; {item.title}</span>
                                <span style={{marginLeft: '7px'}}><EyeTwoTone twoToneColor='#858585' /></span>
                                <span style={{marginLeft: '7px'}}>{item.viewCount}</span>
                            </p>)
                        ) : null
                    }
                </div>
            </div>
        </Card>
    )
}

export default Recommend
