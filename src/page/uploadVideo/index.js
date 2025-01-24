import React, { useState, useEffect } from 'react'
import './index.less'
import { request } from '../../utils/request';
import { Button, Input, message, Upload, Progress } from 'antd'
import { uploadFileChunk } from '../../utils/uploadFile';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
function WriteArticle(props) {
  const [isEdit, setISedit] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [percent, setPercent] = useState(0);
  const [file, setFile] = useState([]);
  const [fileImage, setFileImage] = useState([]);

  const userInfo = useSelector(state => state.user);
  useEffect(() => {
    if (location.state) {
      getVideo(location.state.editVideoId);
      setVideoId(location.state.editVideoId);
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
      poster: imageUrl,
    };
    const res = await request('/createVideo', { data: obj });
    if (res.status == 200) {
      message.success('上传成功！');
      navigate('/');
    } else {
      message.error(res.errorMessage);
    }
  }

  // 修改
  const edit = async () => {
    console.log('修改');
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
    let obj = {
      videoId,
      title,
      content,
      authorId,
      videoUrl,
      visibleType: 1,
      poster: imageUrl,
    };
    const res = await request('/editVideo', { data: obj });
    if (res.status == 200) {
      message.success('修改成功！');
      navigate('/help', { state: { key: '6' } });
    } else {
      message.error(res.errorMessage);
    }
  }

  //  获取视频详情
  const getVideo = async (id) => {
    let res = await request('/findVideoById', { data: { id: parseInt(id), owner: parseInt(userInfo.userId) } });
    if (res.status == 200) {
      let data = res.data;
      if (data) {
        console.log(data);
        setVideoInfo(data);
        setTitle(data.title);
        setImageUrl(data.poster);
        setVideoUrl(data.videoUrl);
        setContent(data.content);
        setFile([{
          uid: data.id,
          name: data.title,
          status: 'done', // 设置状态为 'done'
          url: data.videoUrl, // 文件的URL
        }])
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
    const isLt2M = file.size / 1024 / 1024 < 200;
    if (!isLt2M) {
      message.error('仅支持200M以下的视频哦!');
    }
    return isJpgOrPng && isLt2M;
  };
  const beforeUpload2 = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('仅支持jpeg、png、webp格式的图片哦!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('仅支持2M以下的图片哦!');
    }
    return isJpgOrPng && isLt2M;
  };

  // 处理视频上传
  const uploadVideo = async (config) => {
    uploadFileChunk(config.file, userInfo.userId, (url) => {
      console.log(url);
      // 更新 fileList 以包含新上传的文件
      setFile(prevFileList => {
        return [{
          uid: prevFileList[0].uid,
          name: prevFileList[0].name,
          status: 'done', // 设置状态为 'done'
          url: url, // 文件的URL
        }];
      });
      setVideoUrl(url);
    }, () => {
      setFile(prevFileList => {
        return [{
          uid: prevFileList[0].uid,
          name: prevFileList[0].name,
          status: 'error', // 设置状态为 'error'
          url: '', // 文件的URL
        }];
      });
      setVideoUrl('');
    }, (percent) => {
      setPercent(percent);
    });
  }

  // 处理视频封面上传
  const uploadVideo2 = async (config) => {
    // 通过FormData构造函数创建一个空对象
    const formData = new FormData();
    // 通过append方法来追加数据
    formData.append('file', config.file);
    axios.post('/commit/api/uploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => {
      setImageUrl(res?.data.data.url);
    }).catch(error => {
      console.error(error);
    })
  }
  const videohandleChange = (info) => {
    setFile(info.fileList);
  };
  const videohandleChange2 = (info) => {
    setFileImage(info.fileList);
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
        <div className='upload_progress'>
          <Upload
            name="avatar"
            accept='multipart/form-data'
            className="avatar-uploader"
            fileList={file}
            maxCount={1}
            listType='picture'
            customRequest={uploadVideo}
            beforeUpload={beforeUpload}
            onChange={videohandleChange}
          >
            <Button icon={<UploadOutlined />}>上传视频</Button>
          </Upload>
          {percent !== 0 && <Progress percent={percent} />}
        </div>
      </div>
      <div className='article_tags'>
        <span className='article_tags_title'>视频封面：</span>
        <Upload
          name="avatar"
          accept='multipart/form-data'
          className="avatar-uploader"
          fileList={fileImage}
          maxCount={1}
          listType="picture-card"
          showUploadList={false}
          customRequest={uploadVideo2}
          beforeUpload={beforeUpload2}
          onChange={videohandleChange2}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }} >Upload</div>
            </div>
          )}
        </Upload>
      </div>
      <div className='article_tags'>
        <span className='article_tags_title'>视频描述：</span>
        <Input.TextArea rows={4} value={content} onChange={(e) => setContent(e.target.value)}></Input.TextArea>
      </div>
      <div className='content_btn'>
        <Button type='primary' onClick={isEdit ? edit : add}>提交</Button>
      </div>
    </div>
  )
}

export default WriteArticle
