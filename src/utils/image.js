const OSS_IMAGE_HOST = 'commit-alan.oss-cn-beijing.aliyuncs.com';

// OSS 卡片封面按实际展示宽度裁剪并转 WebP，避免下载原始大图后再由 CSS 缩小。
export const getOptimizedCoverUrl = (src, width = 720) => {
  if (!src) return src;

  try {
    const url = new URL(src, window.location.origin);
    if (url.hostname !== OSS_IMAGE_HOST) return src;

    url.protocol = 'https:';
    url.searchParams.set(
      'x-oss-process',
      `image/resize,w_${width},m_lfit/format,webp/quality,q_78`,
    );
    return url.toString();
  } catch (error) {
    return src;
  }
};

export const getCoverSrcSet = src => [480, 720]
  .map(width => `${getOptimizedCoverUrl(src, width)} ${width}w`)
  .join(', ');
