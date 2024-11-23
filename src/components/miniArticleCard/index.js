import React, { useState, useEffect } from 'react'
import { Card, Divider, Tag, Modal, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, TagOutlined, CommentOutlined, StarOutlined, LockTwoTone } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils';
import { request } from '../../utils/request';
import './index.less'
/**
 * 迷你文章卡片
*/
function MiniArticleCard(props) {
  const { articleInfo, userInfo } = props;
  const [tagList, setTagList] = useState([]);
  const [content, setContent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(()=>{
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

  // 跳转文章
  const gotoArticle = () => {
    if (articleInfo.visibleType === 2 && articleInfo.userId !== userInfo.userId) {
      setPassword('');
      setModalOpen(true);
    } else {
      navigate(`/article/${articleInfo.id}`);
    }
  }

  // 解锁文章
  const unLockArticle = async () => {
    if (!password) {
      message.info('请输入文章密码');
      return;
    }
    let obj = {
      password,
      articleId: articleInfo.id,
    };
    const res = await request('/validateArticleLock', { data: obj });
    if (res.status == 200) {
      message.success('解锁成功！');
      navigate(`/article/${articleInfo.id}`);
    } else {
      message.error(res.errorMessage);
      setModalOpen(false);
    }
  }

  const closeModal = async () => {
    await request('/validateArticleLock', { data: {} });
    setModalOpen(false);
  }

  return (
    <div className='minicard-outter'>
      <Card style={{ margin: '16px 32px' }} onClick={gotoArticle}>
        <div className='minicard-main'>
            <div className='minicard-top'>
                <img src={articleInfo.articleCover ? articleInfo.articleCover : 'http://commit-alan.oss-cn-beijing.aliyuncs.com/uploads/894982879e71cf98f9d008b99bc73089.webp'}></img>
            </div>
            <div className='minicard-middle'>
                <div className='createAt'>{'发布时间：' + articleInfo.createdAt}</div>
                <div className='title'>{articleInfo.title}</div>   
            </div>
            <div className='minicard-footer'>
                <div className='viewCount'>
                    <div>
                        <EyeOutlined style={{ margin: '0 7px 0 0' }}/>
                        {articleInfo.viewCount + '点击量'}
                    </div>
                    <div>
                        <CommentOutlined style={{ margin: '0 3px 0 7px' }} />
                        <span> {calcCommentsCount(articleInfo.comments) + '评论'}</span>
                    </div>
                    <div>
                        <StarOutlined style={{ margin: '0 3px 0 7px' }} />
                        <span>{articleInfo.collectionCount + '收藏'}</span>
                    </div>
                </div>
                <div className='viewCount'>
                    <TagOutlined style={{ marginRight: 7 }}/>
                    {tagList.map((item) => {
                        return (<Tag color="#2db7f5" key={item}>{item}</Tag>)
                    })}
                </div>
            </div>
        </div>
      </Card>
      <Modal
          title="解锁文章"
          open={modalOpen}
          okText='确定'
          cancelText='关闭'
          closable={false}
          onOk={unLockArticle}
          onCancel={closeModal}
        >
          <Input placeholder='请输入密码' value={password} onChange={(e) => setPassword(e.target.value)} />
      </Modal>
    </div>  
  )
}

export default MiniArticleCard
