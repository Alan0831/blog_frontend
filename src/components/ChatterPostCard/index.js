import React, { useMemo, useState } from 'react';
import { Input, Modal, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CommentOutlined, EyeOutlined, LockTwoTone, StarOutlined, TagOutlined } from '@ant-design/icons';
import { calcCommentsCount } from '../../utils';
import { request } from '../../utils/request';
import { CHATTER_FALLBACK_COVER, getChatterPostMeta } from '../../utils/chatter';
import { getCoverSrcSet, getOptimizedCoverUrl } from '../../utils/image';
import './index.less';

function ChatterPostCard(props) {
  const { post, type = 'article', userInfo, index = 0 } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const meta = useMemo(() => getChatterPostMeta(post, type), [post, type]);
  const isLocked = post.visibleType === 2 && post.userId !== userInfo.userId;
  const cover = meta.cover || CHATTER_FALLBACK_COVER;
  const isPriorityCover = index === 0;

  // 锁定内容先走密码弹窗，非锁定内容直接跳转到现有详情页。
  const gotoPost = () => {
    if (isLocked) {
      setPassword('');
      setModalOpen(true);
      return;
    }
    navigate(meta.route);
  };

  // 解锁接口沿用旧卡片的 /validateArticleLock，避免这次视觉改造牵动后端。
  const unlockPost = async () => {
    if (!password) {
      message.info(meta.passwordLabel);
      return;
    }

    const res = await request('/validateArticleLock', {
      data: {
        password,
        articleId: post.id,
      },
    });

    if (res.status == 200) {
      message.success('解锁成功');
      navigate(meta.route);
      return;
    }

    message.error(res.errorMessage);
    setModalOpen(false);
  };

  const closeModal = async () => {
    await request('/validateArticleLock', { data: {} });
    setModalOpen(false);
  };

  return (
    <article
      className='chatter-post-card'
      style={{ '--chatter-index': index }}
      onClick={gotoPost}
    >
      <div className='chatter-post-card__media'>
        <img
          src={getOptimizedCoverUrl(cover)}
          srcSet={getCoverSrcSet(cover)}
          sizes='(max-width: 860px) calc(100vw - 24px), 34vw'
          width='720'
          height='540'
          loading={isPriorityCover ? 'eager' : 'lazy'}
          fetchPriority={isPriorityCover ? 'high' : 'auto'}
          decoding={isPriorityCover ? 'auto' : 'async'}
          alt={post.title || '杂谈封面'}
        />
        <span className='chatter-post-card__kind'>{meta.kindLabel}</span>
      </div>
      <div className='chatter-post-card__body'>
        <div className='chatter-post-card__eyebrow'>
          <span>{post.author || '匿名作者'}</span>
          <span>{post.createdAt || '刚刚发布'}</span>
        </div>
        <h3>{post.title}</h3>
        <p className={isLocked ? 'is-locked' : ''}>{meta.content || '这篇杂谈还没有摘要，点进去看看完整内容。'}</p>
        {isLocked ? (
          <div className='chatter-post-card__lock'>
            <LockTwoTone twoToneColor='#d86b86' />
            <span>需要密码解锁</span>
          </div>
        ) : null}
        <div className='chatter-post-card__footer'>
          <span><EyeOutlined />{post.viewCount || 0}</span>
          <span><CommentOutlined />{calcCommentsCount(meta.comments)}</span>
          <span><StarOutlined />{post.collectionCount || 0}</span>
        </div>
        <div className='chatter-post-card__tags'>
          <TagOutlined />
          {meta.tags.length > 0 ? meta.tags.slice(0, 4).map(item => (
            <Tag key={item} color='cyan'>{item}</Tag>
          )) : <span className='chatter-post-card__no-tag'>未设置标签</span>}
        </div>
      </div>
      <Modal
        title={meta.unlockTitle}
        open={modalOpen}
        okText='确定'
        cancelText='关闭'
        closable={false}
        onOk={unlockPost}
        onCancel={closeModal}
      >
        <Input.Password
          placeholder={meta.passwordLabel}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Modal>
    </article>
  );
}

export default ChatterPostCard;
