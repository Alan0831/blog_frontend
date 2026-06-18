import React, { useState } from 'react'
import { Card, Tag, Modal, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, TagOutlined, CommentOutlined, StarOutlined } from '@ant-design/icons';
import { calcCommentsCount, parseMaybeJsonArray } from '../../utils';
import { request } from '../../utils/request';
import './index.less'
/**
 * 迷你文章卡片
*/
function MiniArticleCard(props) {
  const { info, userInfo } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const isArticle = info?.type == 1;
  const isVideo = info?.type == 2;
  const cardInfo = isArticle ? info?.article : info?.video;
  const tagList = isArticle ? parseMaybeJsonArray(cardInfo?.tagList) : [];
  const isMissingContent = !cardInfo;
  const cover = isArticle && cardInfo?.articleCover
    ? cardInfo.articleCover
    : isVideo && cardInfo?.poster
      ? cardInfo.poster
      : 'http://commit-alan.oss-cn-beijing.aliyuncs.com/uploads/894982879e71cf98f9d008b99bc73089.webp';

  // 跳转文章或者视频
  const gotoArticle = () => {
    if (isMissingContent) {
      message.warning('这条动态的内容已删除或暂不可用');
      return;
    }

    if (info.visibleType === 2 && info.userId !== userInfo?.userId) {
      setPassword('');
      setModalOpen(true);
    } else {
      if (isVideo) {
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
      articleId: info.articleId || cardInfo?.id || info.id,
    };
    const res = await request('/validateArticleLock', { data: obj });
    if (res.status == 200) {
      message.success('解锁成功！');
      navigate(`/article/${obj.articleId}`);
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
    <div className={`minicard-outter${isMissingContent ? ' is-missing' : ''}`}>
      <Card style={{ margin: '16px 32px' }} onClick={gotoArticle}>
        <div className='minicard-main'>
          <div className='minicard-top'>
            <img src={cover} alt={cardInfo?.title || '内容封面'}></img>
          </div>
          <div className='minicard-middle'>
            <div className='createAt'>{'发布时间：' + (cardInfo?.createdAt || info?.createdAt || '未知')}</div>
            <div className='title'>{cardInfo?.title || '内容已删除或暂不可用'}</div>
          </div>
          <div className='minicard-footer'>
            <div className='viewCount'>
              <div>
                <EyeOutlined style={{ margin: '0 7px 0 0' }} />
                {(cardInfo?.viewCount || 0) + '点击量'}
              </div>
              <div>
                <CommentOutlined style={{ margin: '0 3px 0 7px' }} />
                <span> {calcCommentsCount(cardInfo?.comments) + '评论'}</span>
              </div>
              <div>
                <StarOutlined style={{ margin: '0 3px 0 7px' }} />
                <span>{(cardInfo?.collectionCount || 0) + '收藏'}</span>
              </div>
            </div>
            {
              tagList.length > 0 && isArticle ? <div className='viewCount'>
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
