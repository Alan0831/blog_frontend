import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { request } from '../../utils/request';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from '../../utils/dayjs'
import AppAvatar from '../avatar'
import { Comment, Button, Tooltip, Input, Popconfirm, message } from 'antd';

const { TextArea } = Input

const CommentItem = React.memo(props => {
    const { children, item, userInfo, id, commentId, replyId, replyVisible, pageType } = props;
    const { user } = item
    const [value, setValue] = useState('')

    useEffect(() => {
        replyVisible && setValue('')
    }, [replyVisible])

    const handleChange = (e) => {
        setValue(e.target.value)
    }

    const handleKeyUp = (e) => {
        if (e.ctrlKey && e.keyCode === 13) {
            onSubmit()
        }
    }

    const onSubmit = async () => {
        if (!userInfo.userId) return message.warn('您未登陆，请登录后再试。');
        if (pageType == 1) {
            let obj = {
                content: value,
                userId: userInfo.userId,
                articleId: parseInt(id),
                commentId,
                type: 2,
                replyTo: item?.user.id,
            }
            let res = await request('/createComment', { data: obj });
            if (res.status == 200) {
                message.success('回复成功！');
                props.setCommentList(res.data.comments);
                props.onReply({ commentId: 0, replyId: 0 });

            } else {
                message.error(res.errorMessage);
            }
        } else {
            let obj = {
                content: value,
                userId: userInfo.userId,
                videoId: parseInt(id),
                commentId,
                type: 2,
                replyTo: item?.user.id,
            }
            let res = await request('/createVideoComment', { data: obj });
            if (res.status == 200) {
                message.success('回复成功！');
                props.setCommentList(res.data.videocomments);
                props.onReply({ commentId: 0, replyId: 0 });

            } else {
                message.error(res.errorMessage);
            }
        }
    }

    // 删除评论
    const onDelete = async () => {
        if (pageType == 1) {
            if (replyId) {
                let obj = { type: 2, replyId };
                let res = await request('/deleteComment', { data: obj });
                if (res.status == 200) {
                    let commentList = [...props.commentList];
                    let tagetComment = commentList.find(c => c.id === commentId);
                    tagetComment.replies = tagetComment.replies.filter(r => r.id !== replyId);
                    props.setCommentList(commentList);
                    message.success('删除成功！');
                }
            } else {
                let obj = { type: 1, commentId };
                let res = await request('/deleteComment', { data: obj });
                if (res.status == 200) {
                    let commentList = [...props.commentList];
                    commentList = commentList.filter(c => c.id !== commentId);
                    props.setCommentList(commentList);
                    message.success('删除成功！');
                }
            }
        } else {
            if (replyId) {
                let obj = { type: 2, replyId };
                let res = await request('/deleteVideoComment', { data: obj });
                if (res.status == 200) {
                    let commentList = [...props.commentList];
                    let tagetComment = commentList.find(c => c.id === commentId);
                    tagetComment.videoreplies = tagetComment.videoreplies.filter(r => r.id !== replyId);
                    props.setCommentList(commentList);
                    message.success('删除成功！');
                }
            } else {
                let obj = { type: 1, commentId };
                let res = await request('/deleteVideoComment', { data: obj });
                if (res.status == 200) {
                    let commentList = [...props.commentList];
                    commentList = commentList.filter(c => c.id !== commentId);
                    props.setCommentList(commentList);
                    message.success('删除成功！');
                }
            }
        }

    }

    const handleReply = () => {
        props.onReply({ commentId, replyId })
    }

    return (
        <Comment
            actions={[
                <span onClick={handleReply}>回复</span>,
                <>
                    {userInfo.role === 1 && (
                        <Popconfirm title={'是否删除该留言？'} cancelText='取消' okText='确认' onConfirm={onDelete}>
                            <DeleteOutlined />
                        </Popconfirm>
                    )}
                </>
            ]}
            author={<span>{user && user.username}</span>}
            avatar={<AppAvatar userInfo={user} />}
            content={
                <div className='content'>
                    {
                        <span>
                            {item.replyUser ? (<span  style={{ marginRight: '7px' }}>@{item.replyUser}:</span>) : null}
                            <span>{item.content}</span>
                        </span>
                    }
                </div>
            }
            datetime={
                <Tooltip title={item.createdAt}>
                    <span>{dayjs(item.createdAt).fromNow()}</span>
                </Tooltip>
            }>
            {replyVisible && (
                <div className='reply-form'>
                    <TextArea
                        placeholder={`回复${user.username}...`}
                        value={value}
                        onChange={handleChange}
                        onKeyUp={handleKeyUp}
                    />
                    <div className='reply-form-controls'>
                        <Button className='button' htmlType='submit' type='primary' disabled={!value.trim()} onClick={onSubmit}>
                            发布
                        </Button>
                    </div>
                </div>
            )}
            {children}
        </Comment>
    )
})

const CommentList = props => {
    const userInfo = useSelector(state => state.user);
    const { commentList, id, pageType } = props
    const [replyTarget, setReplyTarget] = useState({ commentId: 0, replyId: 0 })

    return (
        <div className='discuss-list'>
            {commentList.map(comment => (
                <CommentItem
                    item={comment}
                    key={comment.id}
                    id={id}
                    userInfo={userInfo}
                    commentId={comment.id}
                    setCommentList={props.setCommentList}
                    commentList={props.commentList}
                    onReply={setReplyTarget}
                    pageType={pageType}
                    replyVisible={replyTarget.commentId === comment.id && !replyTarget.replyId}>
                    {(comment.videoreplies || comment.replies).map(reply => (
                        <CommentItem
                            item={reply}
                            key={reply.id}
                            id={id}
                            userInfo={userInfo}
                            commentId={comment.id}
                            replyId={reply.id}
                            setCommentList={props.setCommentList}
                            commentList={props.commentList}
                            onReply={setReplyTarget}
                            pageType={pageType}
                            replyVisible={replyTarget.commentId === comment.id && replyTarget.replyId === reply.id}
                        />
                    ))}
                </CommentItem>
            ))}
        </div>
    )
}

export default CommentList
