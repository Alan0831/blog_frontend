import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, message, Modal, Table } from 'antd';
import { request } from '../../utils/request';
import { ToTopOutlined } from '@ant-design/icons';
import { lookAnswerPreview } from '../../utils/imgreview';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'react-quill/dist/quill.snow.css';
import 'codemirror/lib/codemirror.js'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/yonce.css';
// 代码模式，clike是包含java,c++等模式的
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';   //js
import 'codemirror/mode/python/python.js';        //python
//代码高亮
import 'codemirror/addon/selection/active-line';
// 代码折叠
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/foldcode.js';
import 'codemirror/addon/fold/foldgutter.js';
import 'codemirror/addon/fold/brace-fold.js';
import 'codemirror/addon/fold/comment-fold.js';
import 'codemirror/addon/hint/show-hint.css'; // start-ctrl+空格代码提示补全
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js'; // end

import './index.less'
import { render } from '@testing-library/react';
import { displayName } from 'react-quill';


function CodeMirrorComponent({ id, userId }) {
    const navigate = useNavigate();
    const userInfo = useSelector(state => state.user);
    const myCodeMirror = useRef(null);
    
    const [code, setCode] = useState();
    const [instance, setInstance] = useState("");   // 编辑器实例
    const [recordData, setRecordData] = useState([]); //  代码记录
    const [isModalOpen, setModalOpen] = useState(false); //  我的记录弹窗
    const [isAnswerModalOpen, setAnswerModalOpen] = useState(false); //  答案弹窗
    const [answerContent, setAnswerContent] = useState(''); //  答案弹窗

    const columns = [
        {
            title: '序号',
            dataIndex: 'id',
            key: 'id',
            width: '10%',
            render: (_, _record, index) => <span>{index + 1}</span>
        },
        {
            title: '内容',
            dataIndex: 'content',
            key: 'content',
            width: '60%',
            ellipsis: true,
        },
        {
            title: '提交时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '15%',
        },
        {
            title: '操作',
            dataIndex: 'content',
            key: 'updatedAt',
            width: '15%',
            render: (item, record) => <div>
                <span onClick={() => chooseItem(item)} className='chooseItem'>选择</span>
                {userId === 1 && record.isAnswer === 0 ? <span  style={{marginLeft: '1rem'}} onClick={() => setToAnswer(record)} className='chooseItem'>设置为答案</span> : null}
                {userId === 1 && record.isAnswer === 1 ? <span  style={{marginLeft: '1rem', color: 'red'}} onClick={() => cancelToAnswer(record)} className='chooseItem'>取消设置</span> : null}
            </div>
        },
    ];

    useEffect(() => {
        const codemirrorDom = document.getElementsByClassName('CodeMirror')[0]
        codemirrorDom.setAttribute("style", "height: 70vh")
    }, []);

    const changeCode = (CodeMirror, changeObj, value) => {
        if (!value) return;
        // 获取 CodeMirror.doc.getValue()
        // 赋值 CodeMirror.doc.setValue(value) // 会触发 onChange 事件，小心进入无线递归。
        setCode(value);
    }

    const submitMycode = async () => {
        try {
            if (!code) {
                message.info('你的内容捏?');
                return;
            }
            if (!userId) {
                message.warning('请先登陆！');
                return;
            }
            await request('/submitMyCode', { data: { content: code, authorId: parseInt(userId), codeId: parseInt(id) } });
            message.success("提交成功");
        } catch (err) {
            message.error("提交失败");
        }
    }

    const myCodeRecord = async () => {
        try {
            if (!userId) {
                message.warning('请先登陆！');
                return;
            }
            const data = await request('/searchCodeListByUser', { data: { authorId: parseInt(userId), codeId: parseInt(id) } });
            setRecordData(data?.data?.rows);
            setModalOpen(true);
        } catch (err) {
            message.error("查询失败");
        }
    }

    const closeModal = () => {
        setModalOpen(false);
        setAnswerModalOpen(false);
    }

    // 选择数据回显到编辑器中
    const chooseItem = (item) => {
        setCode(item);
        setModalOpen(false);
    }
    
    //  设置该提交为答案
    const setToAnswer = async (record) => {
        try {
            await request('/setToAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id), answerId: record.id } });
            message.success("设置成功");
            setModalOpen(false);
        } catch (err) {
            message.error("设置失败");
        }
    }

    //  取消设置该提交为答案
    const cancelToAnswer = async (record) => {
        try {
            await request('/cancelToAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id), answerId: record.id } });
            message.success("取消成功");
            setModalOpen(false);
        } catch (err) {
            message.error("取消失败");
        }
    }

    //  查看答案
    const searchAnswer = async () => {
        lookAnswerPreview(lookAnswer);
    }

    //  查看答案（广告结束后）
    const lookAnswer = async () => {
        try {
            if (!userId) {
                message.warning('请先登陆！');
                return;
            }
            setAnswerModalOpen(true);
            const res = await request('/searchAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id)} });
            if (res && res?.data?.content) {
                setAnswerContent(res?.data?.content);
            } else {
                message.info('暂无答案哦~');
            }
        } catch (err) {
            message.error("取消失败");
        }
    }

    return (
        <div className='code-editor'>
            <div className='btnList'>
                <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                    <Button style={{ borderRadius: '5px' }} onClick={myCodeRecord} type='primary' >我的记录</Button>
                </div>
                <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                    <Button style={{ borderRadius: '5px' }} onClick={searchAnswer} type='primary' >查看答案</Button>
                </div>
            </div>
            <CodeMirror
                id='scriptDesc'
                className="my-custom-height"
                editorDidMount={editor => { setInstance(editor) }}
                value={code}
                onChange={changeCode}
                ref={(c) => myCodeMirror.current = c}// 添加ref属性获取dom节点
                options={{
                    lineNumbers: true, // 显示行号
                    mode: { name: 'text/x-java' || 'javascript', json: true }, // 语言
                    autofocus: true, // 自动获取焦点
                    styleActiveLine: true, // 光标代码高亮
                    theme: 'yonce', // 主题
                    // scrollbarStyle: 'overlay',
                    lineWrapping: true, // 代码自动换行
                    foldGutter: true,
                    matchBrackets: true,
                    lineWrapping: true,
                    showCursorWhenSelecting: true,
                    smartIndent: true,
                    extraKeys: { "Ctrl": "autocomplete" },
                    gutters: ['CodeMirror-linenumbers', 'CodeMirrorfoldgutter'] // end
                }}
            />
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <Button icon={<ToTopOutlined />} style={{ borderRadius: '5px' }} onClick={submitMycode} type='primary' >提交</Button>
            </div>
            <Modal title="我的提交" open={isModalOpen} onOk={closeModal} onCancel={closeModal} width="60%" okText="关闭" cancelButtonProps={{ style: { display: 'none' } }} >
                <div>
                    <Table columns={columns} dataSource={recordData} rowKey={(record) => record.id} />
                </div>
            </Modal>
            <Modal title="答案" open={isAnswerModalOpen} onOk={closeModal} onCancel={closeModal} width="40%" okText="关闭" cancelButtonProps={{ style: { display: 'none' } }} >
                <CodeMirror
                    id='scriptDesc2'
                    className="my-custom-height"
                    value={answerContent}
                    options={{
                        lineNumbers: true, // 显示行号
                        mode: { name: 'text/x-java' || 'javascript', json: true }, // 语言
                        styleActiveLine: true, // 光标代码高亮
                        theme: 'yonce', // 主题
                        readOnly: true,
                        lineWrapping: true, // 代码自动换行
                        foldGutter: true,
                        matchBrackets: true,
                        lineWrapping: true,
                        showCursorWhenSelecting: true,
                        smartIndent: true,
                        gutters: ['CodeMirror-linenumbers', 'CodeMirrorfoldgutter'] // end
                    }}
                />
            </Modal>
        </div>
    )
}

export default React.memo(CodeMirrorComponent)
