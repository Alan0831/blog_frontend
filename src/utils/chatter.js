// 杂谈分区的兜底封面，沿用项目里已有的稳定图片地址，避免后端未传封面时出现破图。
export const CHATTER_FALLBACK_COVER = 'http://commit-alan.oss-cn-beijing.aliyuncs.com/uploads/894982879e71cf98f9d008b99bc73089.webp';

// 去除文章富文本标签，让卡片摘要只保留可读文字。
export const stripHtmlText = (text = '') => String(text).replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

// tagList 后端有时是 JSON 字符串，有时可能已经是数组，这里统一转成数组给 UI 使用。
export const parseChatterTags = (tagList) => {
  if (Array.isArray(tagList)) return tagList.filter(Boolean);
  if (!tagList) return [];

  try {
    const parsedTagList = JSON.parse(tagList);
    return Array.isArray(parsedTagList) ? parsedTagList.filter(Boolean) : [];
  } catch (error) {
    return String(tagList).split(',').map(item => item.trim()).filter(Boolean);
  }
};

// 将文章和视频整理成同一份卡片结构，减少杂谈卡片里的字段判断。
export const getChatterPostMeta = (post = {}, type = 'article') => {
  const isVideo = type === 'video';

  return {
    id: post.id,
    route: `/${isVideo ? 'video' : 'article'}/${post.id}`,
    cover: isVideo ? post.poster : post.articleCover,
    content: stripHtmlText(post.content),
    comments: post.comments || post.videocomments,
    tags: parseChatterTags(post.tagList),
    kindLabel: isVideo ? '影像' : '随笔',
    passwordLabel: isVideo ? '请输入视频密码' : '请输入文章密码',
    unlockTitle: isVideo ? '解锁视频' : '解锁文章',
  };
};
