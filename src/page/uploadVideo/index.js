import React, { useState, useEffect } from 'react'
import './index.less'
import { request } from '../../utils/request';
import { Button, Input, message, Upload } from 'antd'
import MdEditor from '../../components/MdEditor'
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
function WriteArticle(props) {
  const [isEdit, setISedit] = useState(false);
  const [articleInfo, setArticleInfo] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState();
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector(state => state.user);
  useEffect(() => {
    if (location.state) {
    //   getArticle(location.state.editArticleId);
      setISedit(true);
    }
  }, []);

    // 新增
    const add = async () => {
        console.log('新增');
        let { userId: authorId } = userInfo;
        if (!title) {
          message.warning('请输入标题！');
          return;
        }
        if (!content) {
          message.warning('你的内容捏？');
          return;
        }
        if (!authorId) {
          message.warning('请先登陆！');
          return;
        }
        if (!videoUrl) {
          message.warning('你的视频捏！');
          return;
        }
        console.log(content);
        let obj = {
          title,
          content,
          authorId,
          videoUrl,
          visibleType: 1,
          poster: '',
        };
        const res = await request('/createVideo', { data: obj });
        if (res.status == 200) {
          message.success('上传成功！');
          navigate('/');
        } else {
          message.error(res.errorMessage);
        }
      }

  //  获取视频详情
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

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'video/mp4';
    if (!isJpgOrPng) {
      message.error('仅支持mp4格式的视频哦!');
    }
    const isLt2M = file.size / 1024 / 1024 < 100;
    if (!isLt2M) {
      message.error('仅支持100M以下的视频哦!');
    }
    return isJpgOrPng && isLt2M;
  };
    // 处理视频上传
  const uploadVideo = async (config) => {
    // 通过FormData构造函数创建一个空对象
    const formData = new FormData();
    // 通过append方法来追加数据
    formData.append('file', config.file);
    axios.post('/commit/api/uploadVideo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => {
      console.log(res?.data.data.url);
      setVideoUrl(res?.data.data.url);
    }).catch(error => {
      console.error(error);
    })
  }
  const videohandleChange = (info) => {
    console.log(info)
    setFileName(info.file.name);
    if (info.file.status === 'uploading') {
      setLoading(true);
    }
    if (info.file.status === 'done') {
      console.log(info)
    }
  };

  return (
    <div className='upload-video'>
        <Input
            placeholder='请输入视频标题'
            className='title-input'
            bordered={false}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
        />
        <div className='article_tags'>
            <span className='article_tags_title'>视频内容：</span>
            <Upload
                name="avatar"
                accept='multipart/form-data'
                className="avatar-uploader"
                showUploadList={false}
                fileList={[]}
                maxCount={1}
                listType='picture'
                previewFile = {(file) => <div>helo</div>}
                customRequest={uploadVideo}
                beforeUpload={beforeUpload}
                onChange={videohandleChange}
            >
              <Button icon={<UploadOutlined />}>上传视频</Button>
            </Upload>
            <span style={{fontSize: '12px', marginLeft: '7px'}}>{fileName}</span>
        </div>
        <div className='article_tags'> 
            <span className='article_tags_title'>视频描述：</span>
            <Input.TextArea rows={4} value={content} onChange={(e) => setContent(e.target.value)}></Input.TextArea>
        </div>
        <div className='content_btn'>
            <Button type='primary' onClick={add}>提交</Button>
        </div>
    </div>
  )
}

export default WriteArticle
