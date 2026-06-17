import React from 'react';
import { Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CodeOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons';
import './index.less';

function ChatterCodeCard(props) {
  const { codeInfo = {}, index = 0 } = props;
  const { title, difficult, id, createdAt, isCollected } = codeInfo;
  const navigate = useNavigate();
  const difficultyText = difficult < 3 ? '简单' : difficult < 5 ? '中等' : '困难';
  const difficultyColor = difficult < 3 ? 'lime' : difficult < 5 ? 'orange' : 'red';

  // 代码题目仍然跳转到原详情页，只替换首页列表的视觉呈现。
  const gotoCodePage = () => {
    navigate(`/code/${id}`);
  };

  return (
    <article
      className='chatter-code-card'
      style={{ '--chatter-index': index }}
      onClick={gotoCodePage}
    >
      <div className='chatter-code-card__mark'>
        <CodeOutlined />
      </div>
      <div className='chatter-code-card__body'>
        <div className='chatter-code-card__eyebrow'>
          <span>Code Quest</span>
          <span>{createdAt ? createdAt.slice(0, 10) : '待记录'}</span>
        </div>
        <h3>{title || '未命名题目'}</h3>
        <p>把这道题收进同一个电波频道，刷题、复盘和灵感记录保持同一套阅读节奏。</p>
        <div className='chatter-code-card__footer'>
          <Tag color={difficultyColor}>{difficultyText}</Tag>
          <span className='chatter-code-card__collect'>
            {isCollected ? <StarTwoTone twoToneColor='#d86b86' /> : <StarOutlined />}
            {isCollected ? '已收藏' : '未收藏'}
          </span>
        </div>
      </div>
    </article>
  );
}

export default ChatterCodeCard;
