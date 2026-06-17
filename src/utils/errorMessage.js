const ERROR_MESSAGE_MAP = {
  COMMENT_EMPTY: '评论内容不能为空',
  COMMENT_TOO_LONG: '评论内容超出长度限制',
  COMMENT_DELETE_FORBIDDEN: '无权删除该评论或回复',
  VIDEO_CHUNK_UPLOAD_FAILED: '单片上传失败，请重试当前视频',
  VIDEO_CHUNKS_NOT_FOUND: '未找到视频分片，请重新上传',
  VIDEO_MERGE_FAILED: '视频合并失败，请稍后重试或重新上传',
  TOKEN_MISSING: '请先登录',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  TOKEN_INVALID: '登录状态无效，请重新登录',
};

export function getErrorMessage(res, fallback = '操作失败') {
  const errorCode = res?.errorCode || res?.data?.errorCode;
  return ERROR_MESSAGE_MAP[errorCode] || res?.errorMessage || res?.message || fallback;
}

export function createErrorByResponse(res, fallback) {
  const error = new Error(getErrorMessage(res, fallback));
  error.errorCode = res?.errorCode || res?.data?.errorCode;
  error.response = res;
  return error;
}
