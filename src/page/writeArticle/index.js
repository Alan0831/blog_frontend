import React, { useEffect, useState } from 'react';
import './index.less';
import { request } from '../../utils/request';
import { Button, message } from 'antd';
import { ArrowLeftOutlined, BookOutlined, EditOutlined } from '@ant-design/icons';
import MdEditor from '../../components/MdEditor';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import bilan from '../../assets/images/bilan.jpeg';

function WriteArticle() {
  const [isEdit, setIsEdit] = useState(false);
  const [articleInfo, setArticleInfo] = useState({});
  const [pageLoading, setPageLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector(state => state.user);

  useEffect(() => {
    const editArticleId = location.state?.editArticleId;
    if (editArticleId) {
      setIsEdit(true);
      getArticle(editArticleId);
    }
  }, [location.state?.editArticleId, userInfo.userId]);

  const getArticle = async (id) => {
    if (!id || !userInfo.userId) return;

    try {
      setPageLoading(true);
      const res = await request('/findArticleById', {
        data: {
          id: parseInt(id),
          owner: parseInt(userInfo.userId),
        },
      });
      if (res.status === 200) {
        setArticleInfo(res.data || {});
      } else {
        message.error(res.errorMessage);
      }
    } catch (error) {
      message.error('文章详情加载失败，请稍后再试');
    } finally {
      setPageLoading(false);
    }
  };

  const goBack = () => {
    if (isEdit) {
      navigate('/help', { state: { key: '1' } });
    } else {
      navigate('/');
    }
  };

  return (
    <div className='admin-edit-article'>
      <div className='write-shell'>
        <header className='write-hero'>
          <div className='write-hero-copy'>
            <Button className='back-pill' icon={<ArrowLeftOutlined />} onClick={goBack}>
              返回
            </Button>
            <span className='write-eyebrow'>
              <BookOutlined />
              {isEdit ? '文章修整室' : '甜系写作工坊'}
            </span>
            <h1>{isEdit ? '把作品再打磨得可爱一点' : '开始写一篇有光的文章'}</h1>
            <p>整理标题、标签、封面与正文，让读者在打开前就能感受到你的创作气质。</p>
          </div>

          <div className='hero-art'>
            <img src={bilan} alt='二次元写作看板' />
            <div className='hero-card'>
              <EditOutlined />
              <span>{pageLoading ? '正在读取稿纸' : isEdit ? '编辑模式' : '发布模式'}</span>
            </div>
          </div>
        </header>

        <MdEditor isEdit={isEdit} articleInfo={articleInfo} loading={pageLoading} onBack={goBack} />
      </div>
    </div>
  );
}

export default WriteArticle;
