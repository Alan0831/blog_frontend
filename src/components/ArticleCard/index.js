import React, { useState, useEffect } from 'react'
import { Card, Divider, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, TagOutlined, CommentOutlined, StarOutlined } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils'
import './index.less'
/**
 * 文章卡片
*/
function ArticleCard(props) {
  const { articleInfo } = props;
  const [tagList, setTagList] = useState([]);
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  useEffect(()=>{
    console.log(props)
    // let { content } = props.articleInfo;
    let { content, tagList } = articleInfo;
    content = removeHTMLTags(content);
    setContent(content);
    setTagList(JSON.parse(tagList));
  }, [props.articleInfo.id]);

  // 去除文本中的标签内容
  const removeHTMLTags = (text) => {
    return text.replace(/<[^>]*>?/gm, '');
  }

  return (
    <Card style={{ margin: '16px auto' }} onClick={() => navigate(`/article/${articleInfo.id}`)}>
      <div className='card-main'>
        <div className='card-title'>{articleInfo.title}</div>
        <Divider></Divider>
        <div className='card-content'>{content}</div>
        <Divider></Divider>
        <div className='card-footer'>
          <div className='viewCount'>
            <div>
              <EyeOutlined style={{ margin: '0 7px 0 0' }}/>
              {articleInfo.viewCount}
            </div>
            <div>
              <CommentOutlined style={{ margin: '0 3px 0 7px' }} />
              <span> {calcCommentsCount(articleInfo.comments)}</span>
            </div>
            <div>
              <StarOutlined style={{ margin: '0 3px 0 7px' }} />
              <span>{articleInfo.collectionCount}</span>
            </div>
          </div>
          <Divider type='vertical' style={{ marginRight: 7 }} />
          <div className='viewCount'>
            <TagOutlined style={{ marginRight: 7 }}/>
            {tagList.map((item) => {
              return (<Tag color="#2db7f5" key={item}>{item}</Tag>)
            })}
          </div>
          <Divider type='vertical' style={{ marginRight: 7 }} />
          <div className='timeAndAuthor'>
            <div className='createAt'>{'发布时间：' + articleInfo.createdAt}</div>    
            <div>{'作者：' + articleInfo.author}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ArticleCard
