import React, { useState, useEffect } from 'react'
import { Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { StarOutlined, StarTwoTone } from '@ant-design/icons';
import './index.less'
/**
 * 代码题目卡片
*/
function CodeCard(props) {
  const { codeInfo, userInfo } = props;
  const { title, difficult, id, createdAt, isCollected } = codeInfo;
  const navigate = useNavigate();

  useEffect(()=>{

  }, [props.codeInfo.id]);

  // 跳转题目
  const gotoCodePage = () => {
    navigate(`/code/${id}`);
  }

  return (
    <div className='code-card'>
      <div className='code-line' onClick={gotoCodePage}>
        <div className='code-line-left'>
          <div>{title}</div>
        </div>
        <div className='code-line-right'>
          <div>
            <Tag color={difficult <  3 ? "lime" : difficult < 5 ? "orange" : "red"}><span>{difficult <  3 ? "简单" : difficult < 5 ? "中等" : "困难"}</span></Tag>
          </div>
          <div>{createdAt.slice(0, 10)}</div>
          {isCollected ? <StarTwoTone twoToneColor="#e0730d" style={{ margin: '0 2px 0 5px' }} /> : <StarOutlined style={{ margin: '0 2px 0 5px' }} />}
        </div>
      </div>
    </div>  
  )
}

export default CodeCard
