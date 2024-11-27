import React, { useState, useEffect } from 'react'
import { Card, Divider, Tag, Modal, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, TagOutlined, CommentOutlined, StarOutlined, LockTwoTone } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils';
import { request } from '../../utils/request';
import './index.less'
/**
 * 视频卡片
*/
function VideoCard(props) {
  const { videoInfo, userInfo } = props;
  const [tagList, setTagList] = useState([]);
  const [content, setContent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(()=>{
    let { content } = videoInfo;
    setContent(content);
  }, [videoInfo.id]);

  // 跳转视频
  const gotoVideo = () => {
    if (videoInfo.visibleType === 2 && videoInfo.userId !== userInfo.userId) {
      setPassword('');
      setModalOpen(true);
    } else {
      navigate(`/video/${videoInfo.id}`);
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
      articleId: videoInfo.id,
    };
    const res = await request('/validateArticleLock', { data: obj });
    if (res.status == 200) {
      message.success('解锁成功！');
      navigate(`/article/${videoInfo.id}`);
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
    <div className='card-outter'>
      <Card style={{ margin: '16px 32px' }} onClick={gotoVideo}>
        <div className='card-main'>
          <div className='card-title'>{videoInfo.title}</div>
          <Divider></Divider>
          {
            (videoInfo.visibleType === 2 && videoInfo.userId !== userInfo.userId) ? (
              <div className='card-content'>
                <div className='mosaic-effect'>{content}</div>
                <div className='card-lock'><LockTwoTone style={{ fontSize: '32px' }}/></div>
              </div>
            ) : (
              <div className='card-content'>
                <div className='content-left'>{content}</div>
                <div className='content-right'><img src={videoInfo.poster ? videoInfo.poster : 'http://commit-alan.oss-cn-beijing.aliyuncs.com/uploads/894982879e71cf98f9d008b99bc73089.webp'}></img></div>
              </div>
            )
          }
          <Divider></Divider>
          <div className='card-footer'>
            <div className='viewCount'>
              <div>
                <EyeOutlined style={{ margin: '0 7px 0 0' }}/>
                {videoInfo.viewCount}
              </div>
              <div>
                <CommentOutlined style={{ margin: '0 3px 0 7px' }} />
                <span> {calcCommentsCount(videoInfo.comments)}</span>
              </div>
              <div>
                <StarOutlined style={{ margin: '0 3px 0 7px' }} />
                <span>{videoInfo.collectionCount}</span>
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
              <div className='createAt'>{'发布时间：' + videoInfo.createdAt}</div>    
              <div>{'作者：' + videoInfo.author}</div>
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

export default VideoCard
