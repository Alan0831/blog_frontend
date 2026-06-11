import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import { Button, Input, message, Tag, Popover, Select, Upload } from 'antd';
import {
  CloudUploadOutlined,
  EditOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  HighlightOutlined,
  LoadingOutlined,
  LockOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SendOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import 'react-quill/dist/quill.snow.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { request } from '../../utils/request';
import './index.less';

const { CheckableTag } = Tag;
const MAX_TAG_COUNT = 5;
const MAX_TAG_LENGTH = 16;

const defaultTagsList = [
  { tagName: 'JavaScript', id: 1, key: '1' },
  { tagName: 'Java', id: 2, key: '2' },
  { tagName: 'php', id: 3, key: '3' },
  { tagName: 'Python', id: 4, key: '4' },
  { tagName: 'c语言', id: 5, key: '5' },
  { tagName: 'c++', id: 6, key: '6' },
  { tagName: 'c#', id: 7, key: '7' },
  { tagName: 'css', id: 8, key: '8' },
  { tagName: 'node.js', id: 9, key: '9' },
  { tagName: 'go', id: 10, key: '10' },
  { tagName: 'TypeScript', id: 11, key: '11' },
  { tagName: 'react', id: 12, key: '12' },
  { tagName: 'vue', id: 13, key: '13' },
  { tagName: 'webpack', id: 14, key: '14' },
  { tagName: 'vite', id: 15, key: '15' },
  { tagName: 'less', id: 16, key: '16' },
  { tagName: 'sass', id: 17, key: '17' },
  { tagName: 'html', id: 18, key: '18' },
  { tagName: 'npm', id: 19, key: '19' },
  { tagName: 'express', id: 20, key: '20' },
  { tagName: 'es6', id: 21, key: '21' },
  { tagName: 'antd', id: 22, key: '22' },
  { tagName: 'elementui', id: 23, key: '23' },
  { tagName: 'layui', id: 24, key: '24' },
  { tagName: 'angular', id: 25, key: '25' },
  { tagName: 'koa', id: 26, key: '26' },
];

const visibleTypeList = [
  { value: 1, label: '公开可见' },
  { value: 2, label: '密码可见' },
  { value: 3, label: '仅自己可见' },
];

function getPlainTextFromHtml(html) {
  const box = document.createElement('div');
  box.innerHTML = html || '';
  return box.textContent.replace(/\u00a0/g, ' ').trim();
}

function parseTagList(tagList) {
  if (Array.isArray(tagList)) return tagList;
  if (!tagList) return [];
  try {
    const parsed = JSON.parse(tagList);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeTag(tag) {
  return tag.trim().replace(/\s+/g, ' ');
}

function MdEditor(props) {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [articleClass, setArticleClass] = useState();
  const [oldArticleClass, setOldArticleClass] = useState(-1);
  const [articleClassOptions, setArticleClassOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [visibleType, setVisibleType] = useState(1);
  const [password, setPassword] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef(null);
  const quillEdit = useRef();
  const tagDockRef = useRef(null);
  const userInfo = useSelector(state => state.user);
  const [tagScrollState, setTagScrollState] = useState({
    canLeft: false,
    canRight: false,
    hasOverflow: false,
  });

  const options = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['clean'],
        ['link', 'image'],
      ],
    },
  }), []);

  const articleStats = useMemo(() => {
    const plainText = getPlainTextFromHtml(content);
    return {
      chars: plainText.length,
      tags: selectedTags.length,
      hasCover: Boolean(imageUrl),
    };
  }, [content, imageUrl, selectedTags.length]);

  useEffect(() => {
    if (!props.isEdit || !props.articleInfo?.id) return;

    setContent(props.articleInfo.content || '');
    setTitle(props.articleInfo.title || '');
    setArticleClass(props.articleInfo.articleclassId || undefined);
    setOldArticleClass(props.articleInfo.articleclassId || -1);
    setSelectedTags(parseTagList(props.articleInfo.tagList));
    setVisibleType(props.articleInfo.visibleType || 1);
    setPassword('');
    setImageUrl(props.articleInfo.articleCover || '');
  }, [props.articleInfo, props.isEdit]);

  useEffect(() => {
    searchArticleClassName();
  }, [userInfo.userId]);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  useEffect(() => {
    updateTagScrollState();
    window.addEventListener('resize', updateTagScrollState);
    return () => window.removeEventListener('resize', updateTagScrollState);
  }, [selectedTags, inputVisible]);

  const updateTagScrollState = () => {
    const tagDock = tagDockRef.current;
    if (!tagDock) return;

    const maxScrollLeft = tagDock.scrollWidth - tagDock.clientWidth;
    const hasOverflow = maxScrollLeft > 2;
    setTagScrollState({
      hasOverflow,
      canLeft: hasOverflow && tagDock.scrollLeft > 2,
      canRight: hasOverflow && tagDock.scrollLeft < maxScrollLeft - 2,
    });
  };

  const searchArticleClassName = async () => {
    if (!userInfo.userId) return;

    try {
      const res = await request('/searchArticleClassName', { data: { userId: userInfo.userId } });
      if (res.status === 200) {
        const options = (res.data?.rows || []).map(item => ({
          value: item.id,
          label: item.className,
        }));
        setArticleClassOptions(options);
      } else {
        message.error(res.errorMessage);
      }
    } catch (error) {
      message.error('文章分类加载失败，请稍后再试');
    }
  };

  const validateForm = () => {
    const currentTitle = title.trim();
    const plainText = getPlainTextFromHtml(content);
    const { userId: authorId } = userInfo;

    if (!authorId) {
      message.warning('请先登录后再创作');
      return false;
    }
    if (props.isEdit && !props.articleInfo?.id) {
      message.warning('文章详情还在加载中，请稍后再保存');
      return false;
    }
    if (!currentTitle) {
      message.warning('请输入文章标题');
      return false;
    }
    if (selectedTags.length === 0) {
      message.warning('请选择至少一个文章标签');
      return false;
    }
    if (!plainText) {
      message.warning('正文还没有内容哦');
      return false;
    }
    if (visibleType === 2 && !props.isEdit && !password.trim()) {
      message.warning('请输入文章密码');
      return false;
    }
    return true;
  };

  const submitArticle = async () => {
    if (submitting || !validateForm()) return;

    const { userId: authorId } = userInfo;
    const isEdit = props.isEdit;
    const payload = {
      title: title.trim(),
      content,
      authorId,
      tagList: selectedTags,
      visibleType,
      articleCover: imageUrl,
    };

    if (articleClass) payload.classId = articleClass;
    if (visibleType === 2 && password.trim()) payload.password = password.trim();
    if (isEdit) {
      payload.articleId = props.articleInfo.id;
      payload.oldClassId = oldArticleClass || -1;
    }

    try {
      setSubmitting(true);
      const res = await request(isEdit ? '/editArticle' : '/createArticle', { data: payload });
      if (res.status === 200) {
        message.success(isEdit ? '修改成功' : '发布成功');
        navigate(isEdit ? '/help' : '/', isEdit ? { state: { key: '1' } } : undefined);
      } else {
        message.error(res.errorMessage);
      }
    } catch (error) {
      message.error('提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const selectTag = (item, checked) => {
    if (selectedTags.length >= MAX_TAG_COUNT && checked) {
      message.info(`最多添加${MAX_TAG_COUNT}个标签`);
      return;
    }

    const nextSelectedTags = checked
      ? [...selectedTags, item.tagName]
      : selectedTags.filter(t => t !== item.tagName);
    setSelectedTags(nextSelectedTags);
  };

  const cancelSelectedTags = (item) => {
    setSelectedTags(selectedTags.filter(t => t !== item));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    const nextTag = normalizeTag(inputValue);
    if (!nextTag) {
      setInputVisible(false);
      setInputValue('');
      return;
    }
    if (nextTag.length > MAX_TAG_LENGTH) {
      message.info(`自定义标签最多${MAX_TAG_LENGTH}个字`);
      return;
    }
    if (selectedTags.some(tag => tag.toLowerCase() === nextTag.toLowerCase())) {
      setInputVisible(false);
      setInputValue('');
      return;
    }
    if (selectedTags.length >= MAX_TAG_COUNT) {
      message.info(`最多添加${MAX_TAG_COUNT}个标签`);
      return;
    }

    setSelectedTags([...selectedTags, nextTag]);
    setInputVisible(false);
    setInputValue('');
  };

  const showInput = () => {
    if (selectedTags.length >= MAX_TAG_COUNT) {
      message.info(`最多添加${MAX_TAG_COUNT}个标签`);
      return;
    }
    setInputVisible(true);
  };

  const scrollTagDock = (direction) => {
    const tagDock = tagDockRef.current;
    if (!tagDock) return;

    const left = direction === 'right'
      ? tagDock.scrollWidth - tagDock.clientWidth
      : 0;
    tagDock.scrollTo({ left, behavior: 'smooth' });
    window.setTimeout(updateTagScrollState, 320);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post('/commit/api/uploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res?.data?.data?.url;
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/webp');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !beforeUpload(file)) return;

      try {
        setImageUploading(true);
        const url = await uploadFile(file);
        if (!url) throw new Error('missing image url');
        const quill = quillEdit.current?.getEditor();
        const cursorPosition = quill.getSelection(true).index;
        quill.insertEmbed(cursorPosition, 'image', url);
        quill.setSelection(cursorPosition + 1);
      } catch (error) {
        message.error('图片插入失败，请稍后再试');
      } finally {
        setImageUploading(false);
      }
    };
  };

  const setQuillEdit = (editor) => {
    quillEdit.current = editor;
    if (editor) {
      editor.getEditor().getModule('toolbar').handlers.image = handleImageUpload;
    }
  };

  const beforeUpload = (file) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isValidType) {
      message.error('仅支持 jpeg、png、webp 格式的图片');
    }
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('仅支持 10M 以下的图片');
    }
    return isValidType && isValidSize;
  };

  const uploadCover = async (config) => {
    try {
      setCoverUploading(true);
      const url = await uploadFile(config.file);
      if (!url) throw new Error('missing image url');
      setImageUrl(url);
      config.onSuccess?.({ url });
      message.success('封面上传成功');
    } catch (error) {
      config.onError?.(error);
      message.error('封面上传失败，请稍后再试');
    } finally {
      setCoverUploading(false);
    }
  };

  const selectTagsContent = () => (
    <div className='popover write-tag-popover'>
      {defaultTagsList.map(item => (
        <CheckableTag
          key={item.id}
          checked={selectedTags.indexOf(item.tagName) > -1}
          className='selectTag'
          onChange={checked => selectTag(item, checked)}
        >
          {item.tagName}
        </CheckableTag>
      ))}
    </div>
  );

  return (
    <div className='article_md'>
      <section className='editor-main-panel'>
        <div className='section-kicker'>
          <HighlightOutlined />
          <span>{props.isEdit ? '继续打磨这篇作品' : '新稿纸已经铺好'}</span>
        </div>

        <label className='field-block title-field'>
          <span className='field-label'>文章标题</span>
          <Input
            placeholder='给这篇文章取一个闪闪发亮的名字'
            className='title-input'
            bordered={false}
            value={title}
            maxLength={80}
            onChange={e => setTitle(e.target.value)}
          />
        </label>

        <div className='form-grid'>
          <div className='field-block tag-field'>
            <span className='field-label required-label'>
              <TagsOutlined />
              文章标签
            </span>
            <div
              className={`tag-dock-shell ${tagScrollState.hasOverflow ? 'has-overflow' : ''} ${tagScrollState.canLeft ? 'can-left' : ''} ${tagScrollState.canRight ? 'can-right' : ''}`}
            >
              <div className='tag-dock' ref={tagDockRef} onScroll={updateTagScrollState}>
                {selectedTags.map(item => (
                  <Tag key={item} onClose={() => cancelSelectedTags(item)} className='selectTag chosen-tag' closable>
                    {item}
                  </Tag>
                ))}
                <Popover placement='bottomLeft' content={selectTagsContent()} trigger='click'>
                  <Tag className='selectTag action-tag'>
                    <PlusOutlined />
                    <span>添加标签</span>
                  </Tag>
                </Popover>
                {inputVisible ? (
                  <Input
                    ref={inputRef}
                    type='text'
                    size='small'
                    className='tag-input'
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputConfirm}
                    onPressEnter={handleInputConfirm}
                  />
                ) : (
                  <Tag className='site-tag-plus action-tag' onClick={showInput}>
                    自定义
                  </Tag>
                )}
              </div>
              <button
                type='button'
                aria-label='查看左侧标签'
                className={`tag-scroll-arrow tag-scroll-left ${tagScrollState.canLeft ? 'is-visible' : ''}`}
                onClick={() => scrollTagDock('left')}
                disabled={!tagScrollState.canLeft}
              >
                <LeftOutlined />
              </button>
              <button
                type='button'
                aria-label='查看右侧标签'
                className={`tag-scroll-arrow tag-scroll-right ${tagScrollState.canRight ? 'is-visible' : ''}`}
                onClick={() => scrollTagDock('right')}
                disabled={!tagScrollState.canRight}
              >
                <RightOutlined />
              </button>
            </div>
            <span className='field-hint'>最多 {MAX_TAG_COUNT} 个标签，方便读者快速找到你。</span>
          </div>

          <label className='field-block'>
            <span className='field-label'>
              <FolderOpenOutlined />
              文章归属
            </span>
            <Select
              allowClear
              placeholder='选择分类'
              onChange={value => setArticleClass(value)}
              value={articleClass}
              className='soft-select'
              options={articleClassOptions}
            />
          </label>

          <label className='field-block'>
            <span className='field-label'>
              <FileProtectOutlined />
              可见范围
            </span>
            <Select
              onChange={value => setVisibleType(value)}
              value={visibleType}
              className='soft-select'
              options={visibleTypeList}
            />
          </label>

          {visibleType === 2 ? (
            <label className='field-block'>
              <span className='field-label'>
                <LockOutlined />
                访问密码
              </span>
              <Input.Password
                placeholder={props.isEdit ? '留空则保持原密码' : '请输入文章密码'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className='field-block cover-field'>
          <span className='field-label'>文章封面</span>
          <Upload
            name='cover'
            accept='image/jpeg,image/png,image/webp'
            listType='picture-card'
            className='avatar-uploader'
            showUploadList={false}
            fileList={[]}
            customRequest={uploadCover}
            beforeUpload={beforeUpload}
          >
            {imageUrl ? (
              <img src={imageUrl} alt='文章封面预览' className='cover-preview' />
            ) : (
              <div className='cover-empty'>
                {coverUploading ? <LoadingOutlined /> : <CloudUploadOutlined />}
                <span>上传封面</span>
              </div>
            )}
          </Upload>
          {imageUrl ? (
            <Button type='link' className='cover-change-btn' onClick={() => setImageUrl('')}>
              移除封面
            </Button>
          ) : null}
        </div>

        <div className='field-block editor-field'>
          <span className='field-label'>正文内容</span>
          {imageUploading ? <span className='upload-status'>正在插入图片...</span> : null}
          <ReactQuill
            ref={setQuillEdit}
            className='content_md'
            theme='snow'
            value={content}
            onChange={setContent}
            modules={options}
            placeholder='把灵感写下来吧'
          />
        </div>

        <div className='content_btn'>
          <Button className='ghost-action' onClick={props.onBack}>
            返回
          </Button>
          <Button
            type='primary'
            className='submit-action'
            icon={props.isEdit ? <EditOutlined /> : <SendOutlined />}
            loading={submitting || props.loading}
            disabled={props.loading}
            onClick={submitArticle}
          >
            {props.isEdit ? '保存修改' : '发布文章'}
          </Button>
        </div>
      </section>

      <aside className='editor-side-panel'>
        <div className='mini-character' aria-hidden='true'>
          <span className='character-hair' />
          <span className='character-face'>
            <span className='character-eye left' />
            <span className='character-eye right' />
            <span className='character-mouth' />
          </span>
        </div>
        <div className='side-copy'>
          <span className='side-label'>创作状态</span>
          <strong>{articleStats.chars > 0 ? '灵感正在发光' : '等待第一行文字'}</strong>
          <p>标题、标签、封面和正文都会影响读者的第一眼印象。</p>
        </div>
        <div className='stat-list'>
          <div>
            <span>{articleStats.chars}</span>
            <p>正文字符</p>
          </div>
          <div>
            <span>{articleStats.tags}/{MAX_TAG_COUNT}</span>
            <p>标签数量</p>
          </div>
          <div>
            <span>{articleStats.hasCover ? '已设置' : '未设置'}</span>
            <p>封面状态</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default MdEditor;
