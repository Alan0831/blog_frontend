import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.less';
import { request } from '../../utils/request';
import { Button, Input, message, Upload, Progress, Select } from 'antd';
import { uploadFileChunk } from '../../utils/uploadFile';
import { getErrorMessage } from '../../utils/errorMessage';
import { getAuthorizationHeader, handleAuthFailure, isAuthErrorResponse } from '../../utils/auth';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  LoadingOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  SendOutlined,
  VideoCameraAddOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import bilan from '../../assets/images/bilan.jpeg';

const MAX_VIDEO_SIZE = 200;
const MAX_COVER_SIZE = 2;

const partitionOptions = [
  { value: 'codeStudy', label: '学习' },
  { value: 'chatter', label: '杂谈' },
];

function UploadVideo() {
  const [isEdit, setIsEdit] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [partition, setPartition] = useState('codeStudy');
  const [videoId, setVideoId] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [percent, setPercent] = useState(0);
  const [videoProcessStatus, setVideoProcessStatus] = useState('idle');
  const [videoProcessMessage, setVideoProcessMessage] = useState('等待上传视频文件');
  const [videoFileHash, setVideoFileHash] = useState('');
  const [file, setFile] = useState([]);
  const [fileImage, setFileImage] = useState([]);
  const [originalVideoInfo, setOriginalVideoInfo] = useState({ videoUrl: '', poster: '' });

  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector(state => state.user);
  const uploadAliveRef = useRef(true);

  useEffect(() => () => {
    // 上传/轮询可能持续较久，页面卸载后不再回写 React 状态
    uploadAliveRef.current = false;
  }, []);

  const isVideoProcessing = videoProcessStatus === 'processing';
  const isVideoFailed = videoProcessStatus === 'failed';
  const isVideoReady = Boolean(videoUrl) && !isVideoProcessing && !isVideoFailed;

  const videoStats = useMemo(() => ({
    titleReady: Boolean(title.trim()),
    videoReady: isVideoReady,
    coverReady: Boolean(imageUrl),
    descCount: content.trim().length,
    processText: videoUploading ? '上传中' : isVideoProcessing ? '处理中' : isVideoFailed ? '处理失败' : isVideoReady ? '已完成' : '待上传',
  }), [content, imageUrl, isVideoFailed, isVideoProcessing, isVideoReady, title, videoUploading]);

  useEffect(() => {
    const editVideoId = location.state?.editVideoId;
    if (editVideoId) {
      setIsEdit(true);
      setVideoId(editVideoId);
      getVideo(editVideoId);
    }
  }, [location.state?.editVideoId, userInfo.userId]);

  const goBack = () => {
    if (isEdit) {
      navigate('/help', { state: { key: '6' } });
    } else {
      navigate('/');
    }
  };

  const getVideo = async (id) => {
    if (!id || !userInfo.userId) return;

    try {
      setPageLoading(true);
      const res = await request('/findVideoById', {
        data: {
          id: parseInt(id),
          owner: parseInt(userInfo.userId),
        },
      });
      if (res.status === 200) {
        const data = res.data || {};
        setTitle(data.title || '');
        setPartition(data.partition || 'codeStudy');
        setImageUrl(data.poster || '');
        setVideoUrl(data.videoUrl || '');
        setOriginalVideoInfo({
          videoUrl: data.videoUrl || '',
          poster: data.poster || '',
        });
        setContent(data.content || '');
        setPercent(data.videoUrl ? 100 : 0);
        setVideoProcessStatus(data.videoUrl ? 'success' : 'idle');
        setVideoProcessMessage(data.videoUrl ? '视频已处理完成，可以保存修改' : '等待上传视频文件');
        setFile(data.videoUrl ? [{
          uid: String(data.id || id),
          name: data.title || '已上传视频',
          status: 'done',
          url: data.videoUrl,
        }] : []);
        setFileImage(data.poster ? [{
          uid: `poster-${data.id || id}`,
          name: '视频封面',
          status: 'done',
          url: data.poster,
        }] : []);
      } else {
        message.error(res.errorMessage);
      }
    } catch (error) {
      message.error('视频详情加载失败，请稍后再试');
    } finally {
      setPageLoading(false);
    }
  };

  const validateForm = () => {
    const { userId: authorId } = userInfo;
    if (!authorId) {
      message.warning('请先登录后再上传');
      return false;
    }
    if (isEdit && !videoId) {
      message.warning('视频详情还在加载中，请稍后再保存');
      return false;
    }
    if (!title.trim()) {
      message.warning('请输入视频标题');
      return false;
    }
    if (!videoUrl) {
      message.warning('请先上传视频文件');
      return false;
    }
    if (isVideoProcessing) {
      message.warning('视频仍在后台处理中，请等待完成后再发布');
      return false;
    }
    if (isVideoFailed) {
      message.warning('视频处理失败，请重新上传后再发布');
      return false;
    }
    if (!content.trim()) {
      message.warning('请输入视频描述');
      return false;
    }
    return true;
  };

  const submitVideo = async () => {
    if (submitting || videoUploading || isVideoProcessing || !validateForm()) return;

    const { userId: authorId } = userInfo;
    const payload = {
      title: title.trim(),
      content: content.trim(),
      authorId,
      partition,
      visibleType: 1,
    };
    if (isEdit) {
      payload.videoId = videoId;
      if (videoUrl !== originalVideoInfo.videoUrl) payload.videoUrl = videoUrl;
      if (imageUrl !== originalVideoInfo.poster) payload.poster = imageUrl;
    } else {
      payload.videoUrl = videoUrl;
      payload.poster = imageUrl;
    }

    try {
      setSubmitting(true);
      const res = await request(isEdit ? '/editVideo' : '/createVideo', { data: payload });
      if (res.status === 200) {
        message.success(isEdit ? '修改成功' : '上传成功');
        navigate(isEdit ? '/help' : '/', isEdit ? { state: { key: '6' } } : undefined);
      } else {
        message.error(getErrorMessage(res, '提交失败，请稍后再试'));
      }
    } catch (error) {
      message.error(getErrorMessage(error?.response, '提交失败，请稍后再试'));
    } finally {
      setSubmitting(false);
    }
  };

  const beforeUpload = (nextFile) => {
    const isMp4 = nextFile.type === 'video/mp4';
    if (!isMp4) {
      message.error('仅支持 mp4 格式的视频');
    }
    const isValidSize = nextFile.size / 1024 / 1024 < MAX_VIDEO_SIZE;
    if (!isValidSize) {
      message.error(`仅支持 ${MAX_VIDEO_SIZE}M 以下的视频`);
    }
    return isMp4 && isValidSize;
  };

  const beforeUploadCover = (nextFile) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type);
    if (!isValidType) {
      message.error('仅支持 jpeg、png、webp 格式的图片');
    }
    const isValidSize = nextFile.size / 1024 / 1024 < MAX_COVER_SIZE;
    if (!isValidSize) {
      message.error(`仅支持 ${MAX_COVER_SIZE}M 以下的图片`);
    }
    return isValidType && isValidSize;
  };

  const uploadVideo = async (config) => {
    if (!userInfo.userId) {
      message.warning('请先登录');
      config.onError?.(new Error('missing user'));
      return;
    }

    const currentFile = config.file;
    setVideoUploading(true);
    setVideoProcessStatus('uploading');
    setVideoProcessMessage('正在上传视频分片');
    setVideoFileHash('');
    setPercent(1);
    setFile([{
      uid: currentFile.uid || String(Date.now()),
      name: currentFile.name,
      status: 'uploading',
      url: '',
    }]);

    uploadFileChunk(
      currentFile,
      userInfo.userId,
      (url, processInfo = {}) => {
        if (!uploadAliveRef.current) return;
        const uploadedFile = {
          uid: currentFile.uid || String(Date.now()),
          name: currentFile.name,
          status: 'done',
          url,
        };
        setFile([uploadedFile]);
        setVideoUrl(url);
        setVideoFileHash(processInfo.fileHash || '');
        setVideoProcessStatus('success');
        setVideoProcessMessage(processInfo.message || '视频已处理完成，可以发布');
        setPercent(100);
        setVideoUploading(false);
        config.onSuccess?.({ url, processInfo });
      },
      (error) => {
        setFile([{
          uid: currentFile.uid || String(Date.now()),
          name: currentFile.name,
          status: 'error',
          url: '',
        }]);
        setVideoUrl('');
        setVideoProcessStatus('failed');
        setVideoProcessMessage(error?.message || '视频上传或处理失败');
        setVideoUploading(false);
        config.onError?.(new Error('upload failed'));
        message.error(error?.message || '视频上传或处理失败');
      },
      (nextPercent, processInfo = {}) => {
        if (!uploadAliveRef.current) return;
        // 80% 以后是后端切片/转码阶段，保持进度条活跃并更新状态文案
        const nextValue = Math.max(1, Math.round(nextPercent));
        setPercent(nextValue);
        if (processInfo.fileHash) setVideoFileHash(processInfo.fileHash);
        if (processInfo.status) setVideoProcessStatus(processInfo.status);
        if (processInfo.message) setVideoProcessMessage(processInfo.message);
        if (!processInfo.status && nextValue >= 80 && nextValue < 100) {
          setVideoProcessStatus('processing');
          setVideoProcessMessage('视频正在后台切片');
        }
      },
    ).catch((error) => {
      setFile([{
        uid: currentFile.uid || String(Date.now()),
        name: currentFile.name,
        status: 'error',
        url: '',
      }]);
      setVideoUrl('');
      setVideoProcessStatus('failed');
      setVideoProcessMessage(error?.message || '视频上传或处理失败');
      setVideoUploading(false);
      config.onError?.(error || new Error('upload failed'));
      message.error(error?.message || '视频上传或处理失败');
    });
  };
  const uploadCover = async (config) => {
    const formData = new FormData();
    formData.append('file', config.file);

    try {
      setCoverUploading(true);
      const res = await axios.post('/commit/api/uploadImage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthorizationHeader(),
        },
      }).catch((error) => {
        // 直连上传接口不经过 request 拦截器，这里单独补上 401 登录态处理。
        if (error?.response?.status === 401 || isAuthErrorResponse(error?.response?.data)) {
          handleAuthFailure(error?.response?.data, message);
        }
        throw error;
      });
      if (isAuthErrorResponse(res?.data)) {
        handleAuthFailure(res.data, message);
      }
      const url = res?.data?.data?.url;
      if (!url) throw new Error('missing image url');
      setImageUrl(url);
      setFileImage([{
        uid: config.file.uid || String(Date.now()),
        name: config.file.name,
        status: 'done',
        url,
      }]);
      config.onSuccess?.({ url });
      message.success('封面上传成功');
    } catch (error) {
      config.onError?.(error);
      message.error('封面上传失败，请稍后再试');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleVideoChange = (info) => {
    setFile(info.fileList.slice(-1));
  };

  const handleCoverChange = (info) => {
    setFileImage(info.fileList.slice(-1));
  };

  const removeVideo = () => {
    setFile([]);
    setVideoUrl('');
    setVideoFileHash('');
    setVideoProcessStatus('idle');
    setVideoProcessMessage('等待上传视频文件');
    setPercent(0);
  };

  const removeCover = () => {
    setFileImage([]);
    setImageUrl('');
  };

  return (
    <div className='upload-video-page'>
      <div className='upload-video-shell'>
        <header className='video-hero'>
          <div className='video-hero-copy'>
            <Button className='video-back-pill' icon={<ArrowLeftOutlined />} onClick={goBack}>
              返回
            </Button>
            <span className='video-eyebrow'>
              <PlayCircleOutlined />
              {isEdit ? '视频修整室' : '甜系视频放映间'}
            </span>
            <h1>{isEdit ? '给视频换上更闪亮的登场姿势' : '上传一支会被记住的视频'}</h1>
            <p>整理标题、视频源、封面和简介，让作品在列表里第一眼就有辨识度。</p>
          </div>
          <div className='video-hero-art'>
            <img src={bilan} alt='二次元视频看板' />
            <div className='video-hero-card'>
              <VideoCameraAddOutlined />
              <span>{pageLoading ? '读取视频资料' : isEdit ? '编辑模式' : '上传模式'}</span>
            </div>
          </div>
        </header>

        <div className='upload-video-workspace'>
          <section className='video-main-panel'>
            <div className='video-section-kicker'>
              <VideoCameraAddOutlined />
              <span>{isEdit ? '继续完善作品' : '新视频准备入库'}</span>
            </div>

            <label className='video-field-block video-title-field'>
              <span className='video-field-label'>视频标题</span>
              <Input
                placeholder='请输入一个有记忆点的视频标题'
                className='video-title-input'
                bordered={false}
                value={title}
                maxLength={80}
                onChange={e => setTitle(e.target.value)}
              />
            </label>

            <label className='video-field-block video-partition-field'>
              <span className='video-field-label'>
                <PartitionOutlined />
                内容分区
              </span>
              <Select
                value={partition}
                onChange={value => setPartition(value)}
                className='video-soft-select'
                options={partitionOptions}
              />
            </label>

            <div className='video-field-block video-upload-field'>
              <span className='video-field-label'>
                <CloudUploadOutlined />
                视频内容
              </span>
              <div className='upload-zone'>
                <Upload
                  name='video'
                  accept='video/mp4'
                  className='video-uploader'
                  fileList={file}
                  maxCount={1}
                  listType='picture'
                  customRequest={uploadVideo}
                  beforeUpload={beforeUpload}
                  onChange={handleVideoChange}
                  onRemove={removeVideo}
                >
                  <Button className='upload-action' icon={<CloudUploadOutlined />} disabled={videoUploading || isVideoProcessing}>
                    {isVideoProcessing ? '视频处理中' : videoUploading ? '正在上传' : videoUrl ? '重新上传视频' : '上传视频'}
                  </Button>
                </Upload>
                {percent > 0 ? (
                  <Progress
                    percent={percent}
                    status={isVideoFailed ? 'exception' : (videoUploading || isVideoProcessing) ? 'active' : videoUrl ? 'success' : 'normal'}
                    strokeColor={{ '0%': '#d8688a', '100%': '#6e9fca' }}
                  />
                ) : null}
                <div className={`video-process-note is-${videoProcessStatus}`}>
                  {/* 这里展示后端异步切片进度，避免用户在处理中直接提交 */}
                  <span>{videoProcessMessage}</span>
                  {videoFileHash ? <em>{videoFileHash}</em> : null}
                </div>
              </div>
              <span className='video-field-hint'>支持 mp4，单个文件不超过 {MAX_VIDEO_SIZE}M。</span>
            </div>

            <div className='video-field-block video-cover-field'>
              <span className='video-field-label'>
                <FileImageOutlined />
                视频封面
              </span>
              <Upload
                name='poster'
                accept='image/jpeg,image/png,image/webp'
                className='cover-uploader'
                fileList={fileImage}
                maxCount={1}
                listType='picture-card'
                showUploadList={false}
                customRequest={uploadCover}
                beforeUpload={beforeUploadCover}
                onChange={handleCoverChange}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt='视频封面预览' className='video-cover-preview' />
                ) : (
                  <div className='video-cover-empty'>
                    {coverUploading ? <LoadingOutlined /> : <FileImageOutlined />}
                    <span>上传封面</span>
                  </div>
                )}
              </Upload>
              {imageUrl ? (
                <Button type='link' className='video-cover-change-btn' onClick={removeCover}>
                  移除封面
                </Button>
              ) : null}
            </div>

            <label className='video-field-block video-desc-field'>
              <span className='video-field-label'>视频描述</span>
              <Input.TextArea
                rows={5}
                value={content}
                maxLength={600}
                showCount
                placeholder='写下视频亮点、章节提示或观看建议'
                onChange={e => setContent(e.target.value)}
              />
            </label>

            <div className='video-content-btn'>
              <Button className='video-ghost-action' onClick={goBack}>
                返回
              </Button>
              <Button
                type='primary'
                className='video-submit-action'
                icon={<SendOutlined />}
                loading={submitting || pageLoading}
                disabled={pageLoading || videoUploading || isVideoProcessing || isVideoFailed}
                onClick={submitVideo}
              >
                {isEdit ? '保存修改' : '发布视频'}
              </Button>
            </div>
          </section>

          <aside className='video-side-panel'>
            <div className='mini-projector' aria-hidden='true'>
              <span className='projector-lens' />
              <span className='projector-reel reel-a' />
              <span className='projector-reel reel-b' />
              <span className='projector-light' />
            </div>
            <div className='video-side-copy'>
              <span className='video-side-label'>上传状态</span>
              <strong>{videoStats.videoReady ? '片源已经就位' : isVideoProcessing ? '视频正在处理' : isVideoFailed ? '处理失败' : '等待第一支视频'}</strong>
              <p>封面负责吸引目光，描述负责留住想看的人。</p>
            </div>
            <div className='video-stat-list'>
              <div>
                <span>{videoStats.titleReady ? '已填写' : '未填写'}</span>
                <p>标题状态</p>
              </div>
              <div>
                <span>{videoStats.videoReady || videoUploading || isVideoProcessing || isVideoFailed ? `${percent}%` : '未上传'}</span>
                <p>{videoStats.processText}</p>
              </div>
              <div>
                <span>{videoStats.coverReady ? '已设置' : '未设置'}</span>
                <p>封面状态</p>
              </div>
              <div>
                <span>{videoStats.descCount}</span>
                <p>描述字符</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default UploadVideo;
