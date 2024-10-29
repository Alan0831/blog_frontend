import React, { Component, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import { Button, Input, message, Tag, Popover } from 'antd'
import 'react-quill/dist/quill.snow.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import { PlusOutlined } from '@ant-design/icons';
import './index.less'
const { CheckableTag } = Tag;

const toolbar = [
  ["bold", "italic", "underline", "strike"],       // 加粗 斜体 下划线 删除线
  ["blockquote", "code-block"],                    // 引用  代码块
  [{ list: "ordered" }, { list: "bullet" }],       // 有序、无序列表
  [{ indent: "-1" }, { indent: "+1" }],            // 缩进
  [{ size: ["small", false, "large", "huge"] }],   // 字体大小
  [{ header: [1, 2, 3, 4, 5, 6, false] }],         // 标题
  [{ color: [] }, { background: [] }],             // 字体颜色、字体背景颜色
  [{ align: [] }],                                 // 对齐方式
  ["clean"],                                       // 清除文本格式
  // ["link", "image", "video"]                       // 链接、图片、视频
]
const defaultTagsList = [
  {tagName: 'JavaScript', id: 1, key: '1'}, {tagName: 'Java', id: 2, key: '2'}, {tagName: 'php', id: 3, key: '3'}, {tagName: 'Python', id: 4, key: '4'}, {tagName: 'c语言', id: 5, key: '5'},
  {tagName: 'c++', id: 6, key: '6'}, {tagName: 'c#', id: 7, key: '7'}, {tagName: 'css', id: 8, key: '8'}, {tagName: 'node.js', id: 9, key: '9'}, {tagName: 'go', id: 10, key: '10'},
  {tagName: 'TypeScript', id: 11, key: '11'}, {tagName: 'react', id: 12, key: '12'}, {tagName: 'vue', id: 13, key: '13'}, {tagName: 'webpack', id: 14, key: '14'}, {tagName: 'vite', id: 15, key: '15'},
  {tagName: 'less', id: 16, key: '16'}, {tagName: 'sass', id: 17, key: '17'}, {tagName: 'html', id: 18, key: '18'}, {tagName: 'npm', id: 19, key: '19'}, {tagName: 'express', id: 20, key: '20'},
  {tagName: 'es6', id: 21, key: '21'}, {tagName: 'antd', id: 22, key: '22'}, {tagName: 'elementui', id: 23, key: '23'}, {tagName: 'layui', id: 24, key: '24'}, {tagName: 'angular', id: 25, key: '25'}, {tagName: 'koa', id: 26, key: '26'},
]

function MdEditor(props) {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const userInfo = useSelector(state => state.user);

  // 如果是修改模式，则设置初始值
  useEffect(() => {
    setContent(props.articleInfo.content);
    setTitle(props.articleInfo.title);
  }, [props.articleInfo]);

  // 文章内容改变
  const handleChange = (content) => {
    setContent(content);
  }

  // 标题改变
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
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
    let obj = {
      title,
      content,
      authorId,
      articleId: props.articleInfo.id,
    };
    const res = await request('/editArticle', { data: obj });
    if (res.status == 200) {
      message.success('修改成功！');
      navigate('/help', { state: { key: '1' } });
    } else {
      message.error(res.errorMessage);
    }
  }

  // 新增
  const add = async () => {
    console.log('新增');
    let { userId: authorId } = userInfo;
    if (!title) {
      message.warning('请输入标题！');
      return;
    }
    if (selectedTags.length === 0) {
      message.warning('请选择文章标签！');
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
    console.log(selectedTags);
    let obj = {
      title,
      content,
      authorId,
      tagList: selectedTags,
    };
    const res = await request('/createArticle', { data: obj });
    if (res.status == 200) {
      message.success('发布成功！');
      navigate('/');
    } else {
      message.error(res.errorMessage);
    }
  }

  // 新增标签选择框
  const selectTagsContent = () => {
    return (
      <div className='popover'>
        {
          defaultTagsList.map((item) => (
            <CheckableTag key={item.id} checked={selectedTags.indexOf(item.tagName) > -1} className='selectTag' onChange={(checked) => selectTag(item, checked)}>
              {item.tagName}
            </CheckableTag>
          ))
        }
      </div>
    )
  };

  // 点击标签
  const selectTag = (item, checked) => {
    if (selectedTags.length > 4 && checked) {
      message.info('最多添加5个标签哦');
      return;
    }
    console.log(checked)
    const nextSelectedTags = checked
      ? [...selectedTags, item.tagName]
      : selectedTags.filter((t) => t !== item.tagName);
      console.log('添加')
      console.log(nextSelectedTags);
    setSelectedTags(nextSelectedTags);
  }

  // 取消标签
  const cancelSelectedTags = (item) => {
    console.log(item);
    const nextSelectedTags = selectedTags.filter((t) => t !== item);
    console.log('减少')
    console.log(nextSelectedTags)
    setSelectedTags(nextSelectedTags);
  }

  return (
    <div className='article_md'>
      <Input
        placeholder='请输入文章标题'
        className='title-input'
        bordered={false}
        value={title}
        onChange={handleTitleChange}
      />
      <div className='article_tags'>
        <span style={{fontSize: '14px', fontWeight: 'bold', marginTop: '5px'}}>文章标签：</span>
        {
          selectedTags.map((item) => (
            <Tag key={item} onClose={() => cancelSelectedTags(item)} className='selectTag' closable>
              {item}
            </Tag>
          ))
        }
        <Popover placement="bottom" content={selectTagsContent()} trigger="click">
          <Tag key='999' className='selectTag'>
            <span>
              <PlusOutlined />
              <span style={{marginLeft: '5px'}}>添加文章标签</span>
            </span>
          </Tag>
        </Popover>
      </div>
      <ReactQuill
        className='content_md'
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={{toolbar}}
        placeholder="请输入内容"
      />
      <div className='content_btn'>
        <Button type='primary' onClick={props.isEdit ? edit : add}>提交</Button>
      </div>
    </div>
  )
}

export default MdEditor
