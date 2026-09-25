'use strict';
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const config = require('./src/config');
const db = require('./src/db');
const api = require('./src/api');
const views = require('./src/views');
const { escapeHtml } = require('./src/utils');
const { versioned } = require('./src/assets');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'frame-src': ['https://www.youtube.com', 'https://player.vimeo.com'],
      'connect-src': ["'self'"],
      'upgrade-insecure-requests': config.isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ---------- API ----------
app.use('/api', api);

// ---------- Home: aplica WhatsApp / e-mail / link do painel vindos do .env ----------
const fs = require('fs');
const homeFile = path.join(__dirname, 'public', 'index.html');
let homeCache = null;
app.get(['/', '/index.html'], (req, res) => {
  if (!homeCache || !config.isProd) {
    homeCache = versioned(fs.readFileSync(homeFile, 'utf8')
      .replaceAll('5500000000000', config.whatsapp)
      .replaceAll('contato@vida.com.br', config.contactEmail)
      .replaceAll('https://app.vida.com.br', config.appUrl));
  }
  res.set('Cache-Control', 'no-cache').type('html').send(homeCache);
});

// Área restrita: o painel (o próprio painel exige login via API)
const adminFile = path.join(__dirname, 'public', 'admin', 'index.html');
function sendAdmin(req, res) {
  res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-cache' });
  res.type('html').send(versioned(fs.readFileSync(adminFile, 'utf8')));
}
app.get(['/admin', '/admin/', '/admin/index.html'], sendAdmin);

// ---------- Arquivos estáticos ----------
// CSS/JS com ?v= (versão no endereço) podem ficar em cache por 1 ano; o resto é revalidado.
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '30d', immutable: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders(res, file) {
    const url = res.req.originalUrl;
    if (/\.(css|js)$/.test(file) && /[?&]v=/.test(url)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
    else res.set('Cache-Control', 'no-cache');
  },
}));
app.get('/admin/*', sendAdmin);

// ---------- Blog (renderizado no servidor) ----------
const PUBLISHED = `p.status='published' AND p.published_at <= datetime('now')`;
const COLS = `p.*, c.name AS category, c.slug AS category_slug, u.name AS author`;
const JOIN = `FROM posts p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=p.author_id`;
const PER_PAGE = 9;

function listPosts(req, res, category = null) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const where = [PUBLISHED], params = [];
  if (category) { where.push('p.category_id=?'); params.push(category.id); }
  if (q) { where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const w = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n ${JOIN} WHERE ${w}`).get(...params).n;
  const posts = db.prepare(`SELECT ${COLS} ${JOIN} WHERE ${w} ORDER BY p.featured DESC, p.published_at DESC LIMIT ? OFFSET ?`)
    .all(...params, PER_PAGE, (page - 1) * PER_PAGE);
  const categories = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id AND ${PUBLISHED}) AS total FROM categories c ORDER BY c.name`).all();
  res.send(views.blogIndex({ posts, categories, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)), category, q, total }));
}

app.get('/blog', (req, res) => listPosts(req, res));

app.get('/blog/categoria/:slug', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE slug=?').get(req.params.slug);
  if (!category) return res.status(404).send(views.notFound());
  listPosts(req, res, category);
});

// Pré-visualização de rascunho (apenas logado)
const { currentUser } = require('./src/auth');
app.get('/blog/preview/:id', (req, res) => {
  if (!currentUser(req)) return res.redirect('/admin');
  const post = db.prepare(`SELECT ${COLS} ${JOIN} WHERE p.id=?`).get(Number(req.params.id) || 0);
  if (!post) return res.status(404).send(views.notFound());
  res.set('X-Robots-Tag', 'noindex');
  res.send(views.blogPost({ post, related: [] }));
});

app.get('/blog/:slug', (req, res) => {
  const post = db.prepare(`SELECT ${COLS} ${JOIN} WHERE p.slug=? AND ${PUBLISHED}`).get(req.params.slug);
  if (!post) return res.status(404).send(views.notFound());
  db.prepare('UPDATE posts SET views=views+1 WHERE id=?').run(post.id);
  const related = db.prepare(`SELECT ${COLS} ${JOIN} WHERE ${PUBLISHED} AND p.id<>?
    ORDER BY (p.category_id IS ?) DESC, p.published_at DESC LIMIT 3`).all(post.id, post.category_id);
  res.send(views.blogPost({ post, related }));
});

// ---------- Páginas legais ----------
app.get(['/privacidade', '/termos'], (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug=?').get(req.path.slice(1));
  if (!page) return res.status(404).send(views.notFound());
  res.send(views.legalPage({ page }));
});

// ---------- SEO: sitemap, RSS, robots ----------
app.get('/sitemap.xml', (req, res) => {
  const posts = db.prepare(`SELECT slug, updated_at FROM posts p WHERE ${PUBLISHED}`).all();
  const cats = db.prepare('SELECT slug FROM categories').all();
  const u = (loc, mod) => `<url><loc>${config.siteUrl}${loc}</loc>${mod ? `<lastmod>${mod.slice(0, 10)}</lastmod>` : ''}</url>`;
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u('/')}${u('/blog')}${u('/privacidade')}${u('/termos')}${cats.map((c) => u(`/blog/categoria/${c.slug}`)).join('')}${posts.map((p) => u(`/blog/${p.slug}`, p.updated_at)).join('')}</urlset>`);
});

app.get('/rss.xml', (req, res) => {
  const posts = db.prepare(`SELECT p.title, p.slug, p.excerpt, p.published_at FROM posts p WHERE ${PUBLISHED} ORDER BY p.published_at DESC LIMIT 20`).all();
  const x = escapeHtml;
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${x(config.siteName)} — Blog</title><link>${config.siteUrl}/blog</link><description>Inteligência comercial para laboratórios</description>
${posts.map((p) => `<item><title>${x(p.title)}</title><link>${config.siteUrl}/blog/${p.slug}</link><guid>${config.siteUrl}/blog/${p.slug}</guid><pubDate>${new Date(p.published_at.replace(' ', 'T') + 'Z').toUTCString()}</pubDate><description>${x(p.excerpt)}</description></item>`).join('')}
</channel></rss>`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

app.use((req, res) => res.status(404).send(views.notFound()));

app.listen(config.port, () => {
  console.log(`\n  ${config.siteName} rodando em http://localhost:${config.port}`);
  console.log(`  Área restrita:      http://localhost:${config.port}/admin\n`);
});
