import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Empty, Input, message, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from '../../utils/dayjs';
import { request } from '../../utils/request';
import { normalizeComments } from '../../utils';
import { getErrorMessage } from '../../utils/errorMessage';
import AppAvatar from '../avatar';

const { TextArea } = Input;
const REPLY_LIMIT = 300;

const getReplies = (comment) => comment?.replies || comment?.videoreplies || [];

const updateDeletedReply = (commentList, commentId, replyId) => {
    return commentList.map(comment => {
        if (comment.id !== commentId) return comment;
        return {
            ...comment,
            replies: getReplies(comment).filter(reply => reply.id !== replyId),
        };
    });
};

function CommentItem(props) {
    const {
        item,
        children,
        userInfo,
        id,
        commentId,
        replyId,
        replyVisible,
        pageType,
        commentList,
        setCommentList,
        onReply,
        onLogin,
    } = props;
    const [value, setValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isLoggedIn = Boolean(userInfo?.username && userInfo?.userId > 0);
    const isOwner = Number(item?.user?.id) === Number(userInfo?.userId);
    const canDelete = isLoggedIn && (userInfo?.role === 1 || isOwner);
    const authorName = item?.user?.username || '匿名用户';
    const trimmedValue = value.trim();

    const handleReply = () => {
        if (!isLoggedIn) {
            message.warning('请先登录后再回复');
            onLogin();
            return;
        }
        setValue('');
        onReply({ commentId, replyId });
    };

    const submitReply = async () => {
        if (!trimmedValue) {
            message.warning('回复内容不能为空');
            return;
        }
        if (!isLoggedIn) {
            message.warning('请先登录后再回复');
            onLogin();
            return;
        }

        const data = {
            content: trimmedValue,
            userId: userInfo.userId,
            commentId,
            type: 2,
            replyTo: item?.user?.id,
            ...(pageType == 1 ? { articleId: parseInt(id) } : { videoId: parseInt(id) }),
        };

        setSubmitting(true);
        try {
            const res = await request(pageType == 1 ? '/createComment' : '/createVideoComment', { data });
            if (res.status == 200) {
                message.success('回复成功');
                setValue('');
                setCommentList(normalizeComments(res.data));
                onReply({ commentId: 0, replyId: 0 });
            } else {
                message.error(getErrorMessage(res, '回复失败'));
            }
        } catch (err) {
            message.error(getErrorMessage(err?.response, '回复失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const deleteComment = async () => {
        const endpoint = pageType == 1 ? '/deleteComment' : '/deleteVideoComment';
        const data = replyId ? { type: 2, replyId } : { type: 1, commentId };

        try {
            const res = await request(endpoint, { data });
            if (res.status == 200) {
                if (replyId) {
                    setCommentList(updateDeletedReply(commentList, commentId, replyId));
                } else {
                    setCommentList(commentList.filter(comment => comment.id !== commentId));
                }
                message.success('删除成功');
            } else {
                message.error(getErrorMessage(res, '删除失败'));
            }
        } catch (err) {
            message.error(getErrorMessage(err?.response, '删除失败'));
        }
    };

    return (
        <div className={replyId ? 'comment-item comment-reply-item' : 'comment-item'}>
            <div className='comment-item-avatar'>
                <AppAvatar userInfo={item?.user} />
            </div>
            <div className='comment-item-main'>
                <div className='comment-item-meta'>
                    <span className='comment-author'>{authorName}</span>
                    <Tooltip title={item?.createdAt}>
                        <span className='comment-time'>{dayjs(item?.createdAt).fromNow()}</span>
                    </Tooltip>
                </div>

                <div className='comment-content'>
                    {item?.replyUser ? <span className='reply-target'>@{item.replyUser}</span> : null}
                    <span>{item?.content}</span>
                </div>

                <div className='comment-actions'>
                    <button type='button' onClick={handleReply}>
                        <MessageOutlined />
                        回复
                    </button>
                    {canDelete ? (
                        <Popconfirm title='确认删除这条评论？' cancelText='取消' okText='删除' onConfirm={deleteComment}>
                            <button type='button' className='danger-action'>
                                <DeleteOutlined />
                                删除
                            </button>
                        </Popconfirm>
                    ) : null}
                </div>

                {replyVisible ? (
                    <div className='reply-form'>
                        <TextArea
                            rows={3}
                            maxLength={REPLY_LIMIT}
                            placeholder={`回复 @${authorName}`}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                        />
                        <div className='reply-form-controls'>
                            <span>{value.length}/{REPLY_LIMIT}</span>
                            <Button
                                className='comment-submit-button'
                                icon={<SendOutlined />}
                                type='primary'
                                loading={submitting}
                                onClick={submitReply}
                            >
                                发布回复
                            </Button>
                        </div>
                    </div>
                ) : null}

                {React.Children.count(children) ? <div className='reply-list'>{children}</div> : null}
            </div>
        </div>
    );
}

function CommentList(props) {
    const userInfo = useSelector(state => state.user);
    const { commentList = [], id, pageType, setCommentList, onLogin } = props;
    const [replyTarget, setReplyTarget] = useState({ commentId: 0, replyId: 0 });
    const normalizedComments = useMemo(() => Array.isArray(commentList) ? commentList : [], [commentList]);

    if (!normalizedComments.length) {
        return (
            <div className='comment-empty'>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='还没有评论，来发布第一条讨论吧' />
            </div>
        );
    }

    return (
        <div className='comment-list'>
            {normalizedComments.map(comment => (
                <CommentItem
                    item={comment}
                    key={comment.id}
                    id={id}
                    userInfo={userInfo}
                    commentId={comment.id}
                    setCommentList={setCommentList}
                    commentList={normalizedComments}
                    onReply={setReplyTarget}
                    onLogin={onLogin}
                    pageType={pageType}
                    replyVisible={replyTarget.commentId === comment.id && !replyTarget.replyId}
                >
                    {getReplies(comment).map(reply => (
                        <CommentItem
                            item={reply}
                            key={reply.id}
                            id={id}
                            userInfo={userInfo}
                            commentId={comment.id}
                            replyId={reply.id}
                            setCommentList={setCommentList}
                            commentList={normalizedComments}
                            onReply={setReplyTarget}
                            onLogin={onLogin}
                            pageType={pageType}
                            replyVisible={replyTarget.commentId === comment.id && replyTarget.replyId === reply.id}
                        />
                    ))}
                </CommentItem>
            ))}
        </div>
    );
}

export default CommentList;
