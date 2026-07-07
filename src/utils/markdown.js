import MarkdownIt from 'markdown-it';
import { sanitizeRichText } from './security';

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
});

const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
const markdownSignalPattern = /(^|\n)\s{0,3}(#{1,6}\s+|```|~~~|[-*+]\s+|\d+\.\s+|>\s+|\|.*\|)|!\[[^\]]*]\([^)]+\)|\[[^\]]+]\([^)]+\)|`[^`]+`|\*\*[^*]+?\*\*/;
const structuralHtmlPattern = /<(img|table|pre|blockquote|ul|ol|h[1-6])\b/i;
const blockClosePattern = /<\/(p|div|li|h[1-6]|blockquote|pre)>/gi;

function decodeHtmlEntities(text) {
  if (!text || typeof document === 'undefined') return text || '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function htmlToPlainMarkdown(html = '') {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(blockClosePattern, '\n')
      .replace(/<[^>]+>/g, '')
  ).trim();
}

function shouldTreatHtmlAsMarkdown(raw = '') {
  if (structuralHtmlPattern.test(raw)) return false;
  return markdownSignalPattern.test(htmlToPlainMarkdown(raw));
}

function isHtml(raw = '') {
  return htmlTagPattern.test(raw);
}

function enhanceArticleHtml(html = '') {
  if (typeof DOMParser === 'undefined') {
    return { html, headings: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const headings = [];

  if (!root) {
    return { html, headings };
  }

  root.querySelectorAll('img').forEach((img) => {
    img.classList.add('preview');
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });

  root.querySelectorAll('h1, h2, h3, h4').forEach((heading, index) => {
    const value = heading.textContent.trim();
    if (!value) return;

    const level = Number(heading.tagName.slice(1));
    const id = `article-heading-${index}`;
    heading.id = id;
    headings.push({ id, value, level });
  });

  return {
    html: root.innerHTML,
    headings,
  };
}

export function renderArticleContent(rawContent = '') {
  const raw = String(rawContent || '');
  if (!raw.trim()) return { html: '', headings: [] };

  const hasHtml = isHtml(raw);
  const shouldRenderMarkdown = !hasHtml || shouldTreatHtmlAsMarkdown(raw);
  const source = hasHtml && shouldRenderMarkdown ? htmlToPlainMarkdown(raw) : raw;
  const renderedHtml = shouldRenderMarkdown
    ? markdown.render(source)
    : source.replace(/(\r\n|\r|\n|\u21b5)/g, '<br />');

  return enhanceArticleHtml(sanitizeRichText(renderedHtml));
}
