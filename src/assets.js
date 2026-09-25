'use strict';
// Cache-busting: acrescenta ?v=<versão> aos CSS/JS locais do HTML.
// A versão muda sozinha sempre que o arquivo é alterado, então o navegador
// nunca fica preso numa versão antiga do estilo ou do script.
const fs = require('fs');
const path = require('path');
const config = require('./config');

const publicDir = path.join(config.root, 'public');
const cache = new Map();

function version(urlPath) {
  if (config.isProd && cache.has(urlPath)) return cache.get(urlPath);
  let v = '0';
  try { v = Math.floor(fs.statSync(path.join(publicDir, urlPath)).mtimeMs).toString(36); } catch { /* arquivo ausente */ }
  cache.set(urlPath, v);
  return v;
}

function versioned(html) {
  return html.replace(/(href|src)="(\/(?:css|js|admin)\/[\w./-]+\.(?:css|js))"/g,
    (m, attr, url) => `${attr}="${url}?v=${version(url)}"`);
}

module.exports = { versioned };
