'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const config = require('./config');
const { setSession, clearSession, requireAuth, requireAdmin } = require('./auth');
const { slugify, cleanContent, stripTags, readingTime } = require('./utils');

const router = express.Router();
router.use(express.json({ limit: '2mb' }));

const PUBLISHED = `p.status='published' AND p.published_at <= datetime('now')`;
const POST_COLS = `p.id, p.title, p.slug, p.excerpt, p.cover, p.tags, p.status, p.featured, p.views,
  p.reading_time, p.published_at, p.created_at, p.updated_at,
  c.name AS category, c.slug AS category_slug, u.name AS author`;
const POST_JOIN = `FROM posts p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=p.author_id`;

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const int = (v, def, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

function uniqueSlug(base, ignoreId = 0) {
  let slug = slugify(base), i = 2;
  const q = db.prepare('SELECT id FROM posts WHERE slug=? AND id<>?');
  while (q.get(slug, ignoreId)) slug = `${slugify(base)}-${i++}`;
  return slug;
}

// =============== PÚBLICO ===============
router.get('/posts', (req, res) => {
  const limit = int(req.query.limit, 9, 1, 50);
  const page = int(req.query.page, 1, 1, 10000);
  const where = [PUBLISHED], params = [];
  if (req.query.category) { where.push('c.slug=?'); params.push(str(req.query.category, 100)); }
  if (req.query.q) {
    where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)');
    const q = `%${str(req.query.q, 100)}%`; params.push(q, q, q);
  }
  const w = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n ${POST_JOIN} WHERE ${w}`).get(...params).n;
  const items = db.prepare(
    `SELECT ${POST_COLS} ${POST_JOIN} WHERE ${w} ORDER BY p.featured DESC, p.published_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, (page - 1) * limit);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

router.get('/categories', (req, res) => {
  res.json(db.prepare(`SELECT c.id, c.name, c.slug, c.description,
    (SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id AND ${PUBLISHED}) AS total
    FROM categories c ORDER BY c.name`).all());
});

// Formulário de contato da landing page
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas mensagens enviadas. Tente novamente mais tarde.' } });
router.post('/contact', contactLimiter, (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot anti-spam
  const name = str(b.name, 120), email = str(b.email, 160);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Informe nome e e-mail válidos.' });
  }
  db.prepare('INSERT INTO leads (name, email, phone, company, message) VALUES (?,?,?,?,?)')
    .run(name, email, str(b.phone, 40), str(b.company, 160), str(b.message, 3000));
  res.json({ ok: true });
});

// Depoimentos: lista pública (só aprovados) + envio pelo visitante (entra como pendente)
router.get('/testimonials', (req, res) => {
  const items = db.prepare(`SELECT id, name, role, company, rating, text, featured FROM testimonials
    WHERE status='approved' ORDER BY featured DESC, created_at DESC LIMIT 12`).all();
  const agg = db.prepare(`SELECT COUNT(*) AS total, ROUND(AVG(rating), 1) AS avg FROM testimonials WHERE status='approved'`).get();
  res.json({ items, total: agg.total, avg: agg.avg || 0 });
});

const testimonialLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Você já enviou depoimentos recentemente. Tente novamente mais tarde.' } });
router.post('/testimonials', testimonialLimiter, (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot anti-spam
  const name = str(b.name, 80), text = str(b.text, 600), email = str(b.email, 160);
  const rating = int(b.rating, 0, 0, 5);
  if (name.length < 2) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (rating < 1) return res.status(400).json({ error: 'Escolha uma nota de 1 a 5 estrelas.' });
  if (text.length < 20) return res.status(400).json({ error: 'Escreva um depoimento com pelo menos 20 caracteres.' });
  if (!b.consent) return res.status(400).json({ error: 'É preciso autorizar a publicação do depoimento.' });
  db.prepare('INSERT INTO testimonials (name, role, company, email, rating, text) VALUES (?,?,?,?,?,?)')
    .run(name, str(b.role, 80), str(b.company, 100), email, rating, text);
  res.status(201).json({ ok: true });
});

// Registro de consentimento de cookies (prova de consentimento — LGPD)
const consentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas requisições.' } });
router.post('/consent', consentLimiter, (req, res) => {
  const b = req.body || {};
  const cid = str(b.consent_id, 64);
  if (!/^[a-z0-9-]{8,64}$/i.test(cid)) return res.status(400).json({ error: 'Identificador inválido.' });
  const analytics = b.analytics ? 1 : 0, marketing = b.marketing ? 1 : 0;
  const choice = analytics && marketing ? 'accept_all' : !analytics && !marketing ? 'reject_all' : 'custom';
  // IP anonimizado: hash com o segredo do servidor (não dá para recuperar o IP original)
  const ipHash = crypto.createHmac('sha256', config.secret).update(String(req.ip || '')).digest('hex').slice(0, 16);
  db.prepare('INSERT INTO consents (consent_id, choice, analytics, marketing, page, user_agent, ip_hash) VALUES (?,?,?,?,?,?,?)')
    .run(cid, choice, analytics, marketing, str(b.page, 200), str(req.get('user-agent'), 300), ipHash);
  res.status(201).json({ ok: true });
});

// =============== AUTENTICAÇÃO ===============
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' } });

router.post('/auth/login', loginLimiter, (req, res) => {
  const email = str(req.body?.email, 160), password = String(req.body?.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  // compara mesmo sem usuário, para não revelar quais e-mails existem pelo tempo de resposta
  const ok = bcrypt.compareSync(password, user?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) return res.status(401).json({ error: 'Login ou senha incorretos.' });
  db.prepare(`UPDATE users SET last_login=datetime('now') WHERE id=?`).run(user.id);
  setSession(res, user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, must_change: user.must_change } });
});

router.post('/auth/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });

router.get('/auth/me', requireAuth, (req, res) => {
  const { token_version, ...user } = req.user;
  res.json({ user });
});

router.post('/auth/password', requireAuth, (req, res) => {
  const current = String(req.body?.current || ''), next = String(req.body?.next || '');
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current, row.password_hash)) return res.status(400).json({ error: 'Senha atual incorreta.' });
  if (next.length < 8) return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
  db.prepare('UPDATE users SET password_hash=?, must_change=0, token_version=token_version+1 WHERE id=?')
    .run(bcrypt.hashSync(next, 12), req.user.id);
  setSession(res, db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id));
  res.json({ ok: true });
});

router.post('/auth/profile', requireAuth, (req, res) => {
  const name = str(req.body?.name, 120);
  if (name.length < 2) return res.status(400).json({ error: 'Nome inválido.' });
  db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.user.id);
  res.json({ ok: true });
});

// =============== ADMIN ===============
const admin = express.Router();
admin.use(requireAuth);

admin.get('/stats', (req, res) => {
  const one = (sql) => db.prepare(sql).get();
  res.json({
    posts: one('SELECT COUNT(*) AS n FROM posts').n,
    published: one(`SELECT COUNT(*) AS n FROM posts p WHERE ${PUBLISHED}`).n,
    scheduled: one(`SELECT COUNT(*) AS n FROM posts WHERE status='published' AND published_at > datetime('now')`).n,
    drafts: one(`SELECT COUNT(*) AS n FROM posts WHERE status='draft'`).n,
    views: one('SELECT COALESCE(SUM(views),0) AS n FROM posts').n,
    leads: one('SELECT COUNT(*) AS n FROM leads').n,
    unreadLeads: one('SELECT COUNT(*) AS n FROM leads WHERE read=0').n,
    categories: one('SELECT COUNT(*) AS n FROM categories').n,
    pendingTestimonials: one(`SELECT COUNT(*) AS n FROM testimonials WHERE status='pending'`).n,
    top: db.prepare(`SELECT id, title, slug, views FROM posts p WHERE ${PUBLISHED} ORDER BY views DESC LIMIT 5`).all(),
    recent: db.prepare(`SELECT ${POST_COLS} ${POST_JOIN} ORDER BY p.updated_at DESC LIMIT 5`).all(),
  });
});

// ----- Posts -----
admin.get('/posts', (req, res) => {
  const limit = int(req.query.limit, 20, 1, 100), page = int(req.query.page, 1, 1, 10000);
  const where = ['1=1'], params = [];
  const status = str(req.query.status, 20);
  if (status === 'draft') where.push(`p.status='draft'`);
  if (status === 'published') where.push(PUBLISHED);
  if (status === 'scheduled') where.push(`p.status='published' AND p.published_at > datetime('now')`);
  if (req.query.category) { where.push('p.category_id=?'); params.push(int(req.query.category, 0, 0, 1e9)); }
  if (req.query.q) { where.push('(p.title LIKE ? OR p.tags LIKE ?)'); const q = `%${str(req.query.q, 100)}%`; params.push(q, q); }
  const w = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n ${POST_JOIN} WHERE ${w}`).get(...params).n;
  const items = db.prepare(`SELECT ${POST_COLS}, p.category_id ${POST_JOIN} WHERE ${w}
    ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

admin.get('/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(int(req.params.id, 0, 0, 1e9));
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
  res.json(post);
});

function readPostBody(body = {}) {
  const content = cleanContent(typeof body.content === 'string' ? body.content : '');
  const status = body.status === 'published' ? 'published' : 'draft';
  let publishedAt = null;
  if (body.published_at) {
    const d = new Date(body.published_at);
    if (!isNaN(d)) publishedAt = d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const catId = int(body.category_id, 0, 0, 1e9);
  return {
    title: str(body.title, 200),
    slugInput: str(body.slug, 120),
    excerpt: str(body.excerpt, 400) || stripTags(content).slice(0, 220),
    content,
    cover: /^\/uploads\/[\w.-]+$|^https:\/\//.test(body.cover || '') ? str(body.cover, 500) : '',
    category_id: catId && db.prepare('SELECT id FROM categories WHERE id=?').get(catId) ? catId : null,
    tags: str(body.tags, 300).split(',').map((t) => t.trim()).filter(Boolean).join(','),
    status,
    featured: body.featured ? 1 : 0,
    seo_title: str(body.seo_title, 70),
    seo_description: str(body.seo_description, 170),
    reading_time: readingTime(content),
    publishedAt,
  };
}

admin.post('/posts', (req, res) => {
  const p = readPostBody(req.body);
  if (p.title.length < 3) return res.status(400).json({ error: 'O título precisa ter pelo menos 3 caracteres.' });
  const slug = uniqueSlug(p.slugInput || p.title);
  const pub = p.status === 'published' ? (p.publishedAt || new Date().toISOString().slice(0, 19).replace('T', ' ')) : p.publishedAt;
  const r = db.prepare(`INSERT INTO posts (title, slug, excerpt, content, cover, category_id, author_id, tags, status,
    featured, seo_title, seo_description, reading_time, published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(p.title, slug, p.excerpt, p.content, p.cover, p.category_id, req.user.id, p.tags, p.status,
      p.featured, p.seo_title, p.seo_description, p.reading_time, pub);
  res.status(201).json(db.prepare('SELECT * FROM posts WHERE id=?').get(r.lastInsertRowid));
});

admin.put('/posts/:id', (req, res) => {
  const id = int(req.params.id, 0, 0, 1e9);
  const old = db.prepare('SELECT * FROM posts WHERE id=?').get(id);
  if (!old) return res.status(404).json({ error: 'Post não encontrado.' });
  const p = readPostBody(req.body);
  if (p.title.length < 3) return res.status(400).json({ error: 'O título precisa ter pelo menos 3 caracteres.' });
  const slug = p.slugInput ? uniqueSlug(p.slugInput, id) : old.slug;
  let pub = p.publishedAt || old.published_at;
  if (p.status === 'published' && !pub) pub = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`UPDATE posts SET title=?, slug=?, excerpt=?, content=?, cover=?, category_id=?, tags=?, status=?,
    featured=?, seo_title=?, seo_description=?, reading_time=?, published_at=?, updated_at=datetime('now') WHERE id=?`)
    .run(p.title, slug, p.excerpt, p.content, p.cover, p.category_id, p.tags, p.status, p.featured,
      p.seo_title, p.seo_description, p.reading_time, pub, id);
  res.json(db.prepare('SELECT * FROM posts WHERE id=?').get(id));
});

admin.post('/posts/:id/duplicate', (req, res) => {
  const old = db.prepare('SELECT * FROM posts WHERE id=?').get(int(req.params.id, 0, 0, 1e9));
  if (!old) return res.status(404).json({ error: 'Post não encontrado.' });
  const title = `${old.title} (cópia)`;
  const r = db.prepare(`INSERT INTO posts (title, slug, excerpt, content, cover, category_id, author_id, tags, status,
    featured, seo_title, seo_description, reading_time) VALUES (?,?,?,?,?,?,?,?,'draft',0,?,?,?)`)
    .run(title, uniqueSlug(title), old.excerpt, old.content, old.cover, old.category_id, req.user.id, old.tags,
      old.seo_title, old.seo_description, old.reading_time);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

admin.delete('/posts/:id', (req, res) => {
  const r = db.prepare('DELETE FROM posts WHERE id=?').run(int(req.params.id, 0, 0, 1e9));
  if (!r.changes) return res.status(404).json({ error: 'Post não encontrado.' });
  res.json({ ok: true });
});

// ----- Upload de imagens -----
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
fs.mkdirSync(config.uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED[file.mimetype])),
});

// Confere a assinatura real do arquivo (não confia só no mimetype enviado)
function looksLikeImage(file) {
  const b = Buffer.alloc(12);
  const fd = fs.openSync(file, 'r'); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
  return (b[0] === 0xff && b[1] === 0xd8) ||                               // jpg
    b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) ||          // png
    b.slice(0, 3).toString() === 'GIF' ||                                   // gif
    (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP');
}

admin.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Imagem acima de 5 MB.' : 'Falha no upload.' });
    if (!req.file) return res.status(400).json({ error: 'Envie uma imagem JPG, PNG, WEBP ou GIF.' });
    if (!looksLikeImage(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Arquivo não é uma imagem válida.' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

admin.get('/media', (req, res) => {
  const files = fs.readdirSync(config.uploadsDir)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .map((f) => ({ name: f, url: `/uploads/${f}`, size: fs.statSync(path.join(config.uploadsDir, f)).size }))
    .sort((a, b) => b.name.localeCompare(a.name));
  res.json(files);
});

admin.delete('/media/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(config.uploadsDir, name);
  if (!/^[\w.-]+$/.test(name) || !fs.existsSync(file)) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

// ----- Categorias -----
admin.get('/categories', (req, res) => {
  res.json(db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id) AS total
    FROM categories c ORDER BY c.name`).all());
});

function saveCategory(req, res, id) {
  const name = str(req.body?.name, 80);
  if (name.length < 2) return res.status(400).json({ error: 'Nome muito curto.' });
  const slug = slugify(str(req.body?.slug, 80) || name);
  const clash = db.prepare('SELECT id FROM categories WHERE slug=? AND id<>?').get(slug, id || 0);
  if (clash) return res.status(400).json({ error: 'Já existe uma categoria com esse endereço.' });
  const desc = str(req.body?.description, 300);
  if (id) db.prepare('UPDATE categories SET name=?, slug=?, description=? WHERE id=?').run(name, slug, desc, id);
  else id = Number(db.prepare('INSERT INTO categories (name, slug, description) VALUES (?,?,?)').run(name, slug, desc).lastInsertRowid);
  res.json(db.prepare('SELECT * FROM categories WHERE id=?').get(id));
}
admin.post('/categories', (req, res) => saveCategory(req, res, 0));
admin.put('/categories/:id', (req, res) => saveCategory(req, res, int(req.params.id, 0, 0, 1e9)));
admin.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(int(req.params.id, 0, 0, 1e9));
  res.json({ ok: true });
});

// ----- Leads (contatos da landing) -----
admin.get('/leads', (req, res) => {
  res.json(db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500').all());
});
admin.put('/leads/:id/read', (req, res) => {
  db.prepare('UPDATE leads SET read=1 WHERE id=?').run(int(req.params.id, 0, 0, 1e9));
  res.json({ ok: true });
});
admin.delete('/leads/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id=?').run(int(req.params.id, 0, 0, 1e9));
  res.json({ ok: true });
});

// ----- Depoimentos (moderação) -----
admin.get('/testimonials', (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : null;
  const items = db.prepare(`SELECT * FROM testimonials ${status ? 'WHERE status=?' : ''} ORDER BY created_at DESC LIMIT 300`)
    .all(...(status ? [status] : []));
  const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM testimonials GROUP BY status').all().map((r) => [r.status, r.n]));
  res.json({ items, counts });
});
admin.put('/testimonials/:id', (req, res) => {
  const id = int(req.params.id, 0, 0, 1e9);
  const t = db.prepare('SELECT * FROM testimonials WHERE id=?').get(id);
  if (!t) return res.status(404).json({ error: 'Depoimento não encontrado.' });
  const b = req.body || {};
  const status = ['pending', 'approved', 'rejected'].includes(b.status) ? b.status : t.status;
  const name = b.name !== undefined ? str(b.name, 80) : t.name;
  const text = b.text !== undefined ? str(b.text, 600) : t.text;
  if (name.length < 2 || text.length < 5) return res.status(400).json({ error: 'Nome e texto são obrigatórios.' });
  db.prepare('UPDATE testimonials SET name=?, role=?, company=?, text=?, rating=?, status=?, featured=? WHERE id=?').run(
    name,
    b.role !== undefined ? str(b.role, 80) : t.role,
    b.company !== undefined ? str(b.company, 100) : t.company,
    text,
    b.rating !== undefined ? int(b.rating, t.rating, 1, 5) : t.rating,
    status,
    b.featured !== undefined ? (b.featured ? 1 : 0) : t.featured,
    id,
  );
  res.json(db.prepare('SELECT * FROM testimonials WHERE id=?').get(id));
});
admin.delete('/testimonials/:id', (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id=?').run(int(req.params.id, 0, 0, 1e9));
  res.json({ ok: true });
});

// ----- Consentimentos de cookies -----
admin.get('/consents', (req, res) => {
  const page = int(req.query.page, 1, 1, 100000), limit = 25;
  const where = [], params = [];
  const choice = str(req.query.choice, 20);
  if (['accept_all', 'reject_all', 'custom'].includes(choice)) { where.push('choice=?'); params.push(choice); }
  if (req.query.q) { where.push('consent_id LIKE ?'); params.push(`%${str(req.query.q, 64)}%`); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM consents ${w}`).get(...params).n;
  const items = db.prepare(`SELECT * FROM consents ${w} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);

  // estatísticas consideram só a escolha mais recente de cada visitante
  const latest = `SELECT c.* FROM consents c JOIN (SELECT consent_id, MAX(id) AS mid FROM consents GROUP BY consent_id) l ON l.mid = c.id`;
  const s = db.prepare(`SELECT COUNT(*) AS visitors,
      SUM(choice='accept_all') AS accept_all, SUM(choice='reject_all') AS reject_all, SUM(choice='custom') AS custom,
      SUM(analytics) AS analytics, SUM(marketing) AS marketing FROM (${latest})`).get();
  const days = db.prepare(`SELECT date(created_at) AS d, COUNT(*) AS n, SUM(choice='accept_all') AS a
      FROM consents WHERE created_at >= datetime('now','-29 days') GROUP BY d ORDER BY d`).all();
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), stats: s, days, records: db.prepare('SELECT COUNT(*) AS n FROM consents').get().n });
});

admin.get('/consents/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM consents ORDER BY id DESC LIMIT 50000').all();
  const label = { accept_all: 'Aceitou todos', reject_all: 'Recusou', custom: 'Personalizou' };
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + ['ID do consentimento;Escolha;Desempenho;Marketing;Página;Navegador;IP (anonimizado);Data (UTC)',
    ...rows.map((r) => [r.consent_id, label[r.choice], r.analytics ? 'Sim' : 'Não', r.marketing ? 'Sim' : 'Não', r.page, r.user_agent, r.ip_hash, r.created_at].map(q).join(';'))].join('\n');
  res.set('Content-Disposition', `attachment; filename="consentimentos-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.type('text/csv; charset=utf-8').send(csv);
});

// ----- Páginas legais (Privacidade, Termos) -----
admin.get('/pages', (req, res) => {
  res.json(db.prepare('SELECT slug, title, description, updated_at FROM pages ORDER BY title').all());
});
admin.get('/pages/:slug', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug=?').get(str(req.params.slug, 60));
  if (!page) return res.status(404).json({ error: 'Página não encontrada.' });
  res.json(page);
});
admin.put('/pages/:slug', (req, res) => {
  const slug = str(req.params.slug, 60);
  if (!db.prepare('SELECT slug FROM pages WHERE slug=?').get(slug)) return res.status(404).json({ error: 'Página não encontrada.' });
  const title = str(req.body?.title, 120);
  if (title.length < 3) return res.status(400).json({ error: 'Título muito curto.' });
  db.prepare(`UPDATE pages SET title=?, description=?, content=?, updated_at=datetime('now') WHERE slug=?`)
    .run(title, str(req.body?.description, 200), cleanContent(String(req.body?.content || '')), slug);
  res.json(db.prepare('SELECT * FROM pages WHERE slug=?').get(slug));
});

// ----- Usuários (apenas admin) -----
admin.get('/users', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, name, email, role, created_at, last_login FROM users ORDER BY id').all());
});

admin.post('/users', requireAdmin, (req, res) => {
  const name = str(req.body?.name, 120), email = str(req.body?.email, 160), pass = String(req.body?.password || '');
  const role = req.body?.role === 'admin' ? 'admin' : 'editor';
  if (name.length < 2) return res.status(400).json({ error: 'Informe o nome completo.' });
  if (email.length < 3 || /\s/.test(email)) return res.status(400).json({ error: 'O login precisa ter pelo menos 3 caracteres e não pode ter espaços.' });
  if (pass.length < 8) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(400).json({ error: 'Esse login já está em uso.' });
  db.prepare('INSERT INTO users (name, email, password_hash, role, must_change) VALUES (?,?,?,?,1)')
    .run(name, email, bcrypt.hashSync(pass, 12), role);
  res.status(201).json({ ok: true });
});

admin.put('/users/:id', requireAdmin, (req, res) => {
  const id = int(req.params.id, 0, 0, 1e9);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  const role = req.body?.role === 'admin' ? 'admin' : 'editor';
  if (user.role === 'admin' && role !== 'admin' &&
      db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role='admin'`).get().n <= 1) {
    return res.status(400).json({ error: 'É preciso manter pelo menos um administrador.' });
  }
  db.prepare('UPDATE users SET name=?, role=? WHERE id=?').run(str(req.body?.name, 120) || user.name, role, id);
  const pass = String(req.body?.password || '');
  if (pass) {
    if (pass.length < 8) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    db.prepare('UPDATE users SET password_hash=?, must_change=1, token_version=token_version+1 WHERE id=?')
      .run(bcrypt.hashSync(pass, 12), id);
  }
  res.json({ ok: true });
});

admin.delete('/users/:id', requireAdmin, (req, res) => {
  const id = int(req.params.id, 0, 0, 1e9);
  if (id === req.user.id) return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ ok: true });
});

router.use('/admin', admin);

// Erros de JSON inválido etc.
router.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status === 400 ? 'Dados inválidos.' : 'Erro interno.' });
});

module.exports = router;
