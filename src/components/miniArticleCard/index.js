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
  const { info, userInfo } = props;
  const [tagList, setTagList] = useState([]);
  const [cardInfo, setCardInfo] = useState({});
  const [content, setContent] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (info.type == 1) {
      setCardInfo(info.article);
      let { tagList } = info.article;
      setTagList(JSON.parse(tagList));
    } else {
      setCardInfo(info.video);
    }

  }, [props.info.id]);

  // 跳转文章或者视频
  const gotoArticle = () => {
    if (info.visibleType === 2 && info.userId !== userInfo.userId) {
      setPassword('');
      setModalOpen(true);
    } else {
      if (info.type == 2) {
        navigate(`/video/${info.videoId}`);
      } else {
        navigate(`/article/${info.articleId}`);
      }
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
      articleId: info.id,
    };
    const res = await request('/validateArticleLock', { data: obj });
    if (res.status == 200) {
      message.success('解锁成功！');
      navigate(`/article/${info.id}`);
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
            <img src={cardInfo.type == 1 && cardInfo.articleCover ? cardInfo.articleCover : cardInfo.type == 2 && cardInfo.poster ? cardInfo.poster : 'http://commit-alan.oss-cn-beijing.aliyuncs.com/uploads/894982879e71cf98f9d008b99bc73089.webp'}></img>
          </div>
          <div className='minicard-middle'>
            <div className='createAt'>{'发布时间：' + cardInfo.createdAt}</div>
            <div className='title'>{cardInfo.title}</div>
          </div>
          <div className='minicard-footer'>
            <div className='viewCount'>
              <div>
                <EyeOutlined style={{ margin: '0 7px 0 0' }} />
                {cardInfo.viewCount + '点击量'}
              </div>
              <div>
                <CommentOutlined style={{ margin: '0 3px 0 7px' }} />
                <span> {calcCommentsCount(cardInfo.comments) + '评论'}</span>
              </div>
              <div>
                <StarOutlined style={{ margin: '0 3px 0 7px' }} />
                <span>{cardInfo.collectionCount + '收藏'}</span>
              </div>
            </div>
            {
              tagList && info.type == 1 ? <div className='viewCount'>
                <TagOutlined style={{ marginRight: 7 }} />
                {tagList.map((item) => {
                  return (<Tag color="#2db7f5" key={item}>{item}</Tag>)
                })}
              </div> : null
            }

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
