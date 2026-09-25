'use strict';
const sanitizeHtml = require('sanitize-html');

function slugify(str = '') {
  return String(str)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'post';
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Limpa o HTML vindo do editor: só tags seguras de conteúdo
function cleanContent(html = '') {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'img', 'figure', 'figcaption', 'hr', 'span', 'iframe',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
      span: ['class'], p: ['class'], li: ['class'], pre: ['class'], code: ['class'],
    },
    allowedClasses: { '*': ['ql-align-center', 'ql-align-right', 'ql-align-justify', 'ql-syntax', 'ql-indent-1', 'ql-indent-2'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
    transformTags: {
      a: (tag, attribs) => ({
        tagName: 'a',
        attribs: /^https?:/.test(attribs.href || '')
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : attribs,
      }),
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
      h1: 'h2',
    },
  });
}

function stripTags(html = '') {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

function readingTime(html = '') {
  const words = stripTags(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function formatDate(sqlDate) {
  if (!sqlDate) return '';
  const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

module.exports = { slugify, escapeHtml, cleanContent, stripTags, readingTime, formatDate };
