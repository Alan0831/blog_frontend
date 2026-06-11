import React, { useRef, useState } from 'react';
import { Button, message, Modal, Table } from 'antd';
import { CloudUploadOutlined, FileSearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { request } from '../../utils/request';
import { lookAnswerPreview } from '../../utils/imgreview';
import 'react-quill/dist/quill.snow.css';
import 'codemirror/lib/codemirror.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python.js';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/foldcode.js';
import 'codemirror/addon/fold/foldgutter.js';
import 'codemirror/addon/fold/brace-fold.js';
import 'codemirror/addon/fold/comment-fold.js';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/anyword-hint.js';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import './index.less';

function CodeMirrorComponent({ id, userId }) {
    const editorRef = useRef(null);
    const [code, setCode] = useState('function main() {\n  \n}');
    const [cursor, setCursor] = useState({ line: 1, ch: 1 });
    const [recordData, setRecordData] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isAnswerModalOpen, setAnswerModalOpen] = useState(false);
    const [answerContent, setAnswerContent] = useState('');

    const updateCursor = (editor) => {
        const pos = editor.getCursor();
        setCursor({ line: pos.line + 1, ch: pos.ch + 1 });
    };

    const editorDidMount = (editor) => {
        editorRef.current = editor;
        editor.setSize('100%', '100%');
        editor.focus();
        updateCursor(editor);
        setTimeout(() => editor.refresh(), 0);
    };

    const editorOptions = {
        lineNumbers: true,
        mode: { name: 'javascript', json: true },
        autofocus: true,
        styleActiveLine: true,
        theme: 'material-darker',
        lineWrapping: false,
        foldGutter: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        showCursorWhenSelecting: true,
        smartIndent: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-/': 'toggleComment',
            'Cmd-/': 'toggleComment',
            'Ctrl-F': 'findPersistent',
            Tab: (cm) => {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                    return;
                }
                cm.replaceSelection('    ', 'end');
            },
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    };

    const changeCode = (_editor, _changeObj, value) => {
        setCode(value);
    };

    const submitMycode = async () => {
        try {
            if (!code.trim()) {
                message.info('请输入代码内容');
                return;
            }
            if (!userId) {
                message.warning('请先登录');
                return;
            }
            await request('/submitMyCode', { data: { content: code, authorId: parseInt(userId), codeId: parseInt(id) } });
            message.success('提交成功');
        } catch (err) {
            message.error('提交失败');
        }
    };

    const myCodeRecord = async () => {
        try {
            if (!userId) {
                message.warning('请先登录');
                return;
            }
            const data = await request('/searchCodeListByUser', { data: { authorId: parseInt(userId), codeId: parseInt(id) } });
            setRecordData(data?.data?.rows || []);
            setModalOpen(true);
        } catch (err) {
            message.error('查询失败');
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setAnswerModalOpen(false);
    };

    const chooseItem = (item) => {
        setCode(item);
        if (editorRef.current) {
            editorRef.current.setValue(item);
            editorRef.current.focus();
        }
        setModalOpen(false);
    };

    const setToAnswer = async (record) => {
        try {
            await request('/setToAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id), answerId: record.id } });
            message.success('设置成功');
            setModalOpen(false);
        } catch (err) {
            message.error('设置失败');
        }
    };

    const cancelToAnswer = async (record) => {
        try {
            await request('/cancelToAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id), answerId: record.id } });
            message.success('取消成功');
            setModalOpen(false);
        } catch (err) {
            message.error('取消失败');
        }
    };

    const searchAnswer = async () => {
        lookAnswerPreview(lookAnswer);
    };

    const lookAnswer = async () => {
        try {
            if (!userId) {
                message.warning('请先登录');
                return;
            }
            const res = await request('/searchAnswer', { data: { authorId: parseInt(userId), codeId: parseInt(id) } });
            if (res?.data?.content) {
                setAnswerContent(res.data.content);
                setAnswerModalOpen(true);
            } else {
                message.info('暂无答案');
            }
        } catch (err) {
            message.error('查询失败');
        }
    };

    const columns = [
        {
            title: '序号',
            dataIndex: 'id',
            key: 'id',
            width: '10%',
            render: (_, _record, index) => <span>{index + 1}</span>,
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
            render: (item, record) => (
                <div>
                    <span onClick={() => chooseItem(item)} className='chooseItem'>选择</span>
                    {userId === 1 && record.isAnswer === 0 ? <span style={{ marginLeft: '1rem' }} onClick={() => setToAnswer(record)} className='chooseItem'>设置为答案</span> : null}
                    {userId === 1 && record.isAnswer === 1 ? <span style={{ marginLeft: '1rem', color: '#d25555' }} onClick={() => cancelToAnswer(record)} className='chooseItem'>取消设置</span> : null}
                </div>
            ),
        },
    ];

    return (
        <div className='code-editor'>
            <div className='editor-window'>
                <div className='editor-titlebar'>
                    <div className='window-controls' aria-hidden='true'>
                        <span className='control close'></span>
                        <span className='control minimize'></span>
                        <span className='control maximize'></span>
                    </div>
                    <div className='editor-tab active'>
                        <span className='file-dot'></span>
                        <span>Main.js</span>
                    </div>
                    <div className='editor-actions'>
                        <Button icon={<HistoryOutlined />} onClick={myCodeRecord} type='primary'>我的记录</Button>
                        <Button icon={<FileSearchOutlined />} onClick={searchAnswer} type='primary'>查看答案</Button>
                    </div>
                </div>
                <div className='editor-body'>
                    <CodeMirror
                        id='scriptDesc'
                        editorDidMount={editorDidMount}
                        onCursorActivity={updateCursor}
                        detach
                        autoCursor={false}
                        autoScroll={false}
                        value={code}
                        onChange={changeCode}
                        options={editorOptions}
                    />
                </div>
                <div className='editor-statusbar'>
                    <span>JavaScript</span>
                    <span>UTF-8</span>
                    <span>Spaces: 4</span>
                    <span>Ln {cursor.line}, Col {cursor.ch}</span>
                </div>
            </div>
            <div className='submit-row'>
                <Button icon={<CloudUploadOutlined />} onClick={submitMycode} type='primary'>提交</Button>
            </div>
            <Modal title="我的提交" open={isModalOpen} onOk={closeModal} onCancel={closeModal} width="60%" okText="关闭" cancelButtonProps={{ style: { display: 'none' } }}>
                <Table columns={columns} dataSource={recordData} rowKey={(record) => record.id} />
            </Modal>
            <Modal title="答案" open={isAnswerModalOpen} onOk={closeModal} onCancel={closeModal} width="50%" okText="关闭" cancelButtonProps={{ style: { display: 'none' } }}>
                <div className='answer-editor-shell'>
                    <CodeMirror
                        id='scriptDesc2'
                        value={answerContent}
                        options={{
                            ...editorOptions,
                            autofocus: false,
                            readOnly: true,
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default React.memo(CodeMirrorComponent);
