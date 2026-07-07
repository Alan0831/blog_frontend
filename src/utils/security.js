import filterXSS from 'xss';

// 只允许富文本编辑器正常会产出的标签和属性；事件属性、script、javascript: 链接都会被 xss 库拦截。
const richTextWhiteList = {
  a: ['href', 'title', 'target', 'rel'],
  b: ['style'],
  blockquote: ['class', 'style'],
  br: [],
  code: ['class'],
  div: ['class', 'style'],
  em: ['style'],
  h1: ['class', 'style'],
  h2: ['class', 'style'],
  h3: ['class', 'style'],
  h4: ['class', 'style'],
  h5: ['class', 'style'],
  h6: ['class', 'style'],
  hr: [],
  i: ['style'],
  img: ['src', 'alt', 'title', 'width', 'height', 'class'],
  li: ['class', 'style'],
  ol: ['class'],
  p: ['class', 'style'],
  pre: ['class'],
  s: ['style'],
  span: ['class', 'style'],
  strike: ['style'],
  strong: ['style'],
  sub: ['style'],
  sup: ['style'],
  table: ['class'],
  tbody: [],
  td: ['align', 'class', 'colspan', 'rowspan'],
  th: ['align', 'class', 'colspan', 'rowspan'],
  thead: [],
  tr: [],
  u: ['style'],
  ul: ['class'],
};

export const sanitizeRichText = (html = '') => {
  if (!html || typeof html !== 'string') return '';

  return filterXSS(html, {
    whiteList: richTextWhiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    onTagAttr(tag, name, value, isWhiteAttr) {
      if (!isWhiteAttr) return undefined;

      // 富文本里的外链统一补 rel，避免 target="_blank" 被反向控制 opener。
      if (tag === 'a' && name === 'target' && value === '_blank') {
        return 'target="_blank" rel="noopener noreferrer"';
      }
      return undefined;
    },
  });
};

export const isUnsafeMethod = (method = 'get') => {
  return !['get', 'head', 'options', 'trace'].includes(String(method).toLowerCase());
};

export const getAjaxHeaders = (method = 'post') => {
  if (!isUnsafeMethod(method)) return {};

  // 项目已使用 Authorization: Bearer <token>，跨站表单不会自动带该头；这里仅保留 AJAX 标识供后端区分普通表单请求。
  return {
    'X-Requested-With': 'XMLHttpRequest',
  };
};
