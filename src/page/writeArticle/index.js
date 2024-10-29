import React, { useState, useEffect } from 'react'
import './index.less'
import { request } from '../../utils/request';
import { Button, Input, message } from 'antd'
import MdEditor from '../../components/MdEditor'
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
function WriteArticle() {
  const [isEdit, setISedit] = useState(false);
  const [articleInfo, setArticleInfo] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector(state => state.user)
  useEffect(() => {
    console.log(location);
    if (location.state) {
      getArticle(location.state.editArticleId);
      setISedit(true);
    }
  }, [])

  //  获取文章详情
  const getArticle = async (id) => {
    let res = await request('/findArticleById', { data: {id: parseInt(id), owner: parseInt(userInfo.userId)} });
    if (res.status == 200) {
      let data = res.data;
      if (data) {
        console.log(data);
        
        setArticleInfo(data);
      }
    } else {
      message.error(res.errorMessage);
    }
  }

  const goBack = () => {
    if(isEdit) {
      navigate('/help', { state: { key: '1' } });
    } else {
      navigate('/');
    }
  }

  return (
    <div className='admin-edit-article'>
      <div>
        <MdEditor isEdit={isEdit} articleInfo={articleInfo} /> 
        <div className='write-button'>
          <Button type='primary' onClick={goBack}>返回</Button>
        </div>
      </div>
    </div>
  )
}

export default WriteArticle
