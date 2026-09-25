'use strict';
// Gera a versão estática do site em docs/ para o GitHub Pages.
// Uso: npm run build:pages
//   BASE     caminho do site no Pages (padrão: /vida/)
//   SITE_URL endereço público (padrão: https://thalesdom.github.io/vida)
// O conteúdo (artigos, depoimentos, páginas legais) vem do banco local data/site.db.
// Área restrita e formulários precisam de servidor: na versão estática os
// formulários abrem o WhatsApp e /admin mostra um aviso.

const BASE = process.env.BASE || '/vida/';
process.env.SITE_URL = process.env.SITE_URL || 'https://thalesdom.github.io/vida';

const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const db = require('../src/db');
const views = require('../src/views');
const { versioned } = require('../src/assets');

const OUT = path.join(config.root, 'docs');
const PUB = path.join(config.root, 'public');
const PUBLISHED = `p.status='published' AND p.published_at <= datetime('now')`;
const COLS = `p.*, c.name AS category, c.slug AS category_slug, u.name AS author`;
const JOIN = `FROM posts p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=p.author_id`;

// ---------- utilitários ----------
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function copyDir(from, to, filter = () => true) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b, filter);
    else if (filter(a)) fs.copyFileSync(a, b);
  }
}
// ajusta o HTML para rodar em BASE e sem servidor
function staticize(html) {
  return html
    .replace('<html lang="pt-BR"', `<html lang="pt-BR" data-static data-base="${BASE}"`)
    .replace(/<form class="search[\s\S]*?<\/form>/, '') // busca precisa de servidor
    .replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}`)
    .replace(/content="\/(?!\/)/g, `content="${BASE}`);
}
const page = (html) => staticize(html);

// ---------- limpa e copia arquivos ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(PUB, 'css'), path.join(OUT, 'css'));
copyDir(path.join(PUB, 'js'), path.join(OUT, 'js'));
copyDir(path.join(PUB, 'img'), path.join(OUT, 'img'));
copyDir(config.uploadsDir, path.join(OUT, 'uploads'), (f) => /\.(jpe?g|png|webp|gif)$/i.test(f));
write('.nojekyll', '');

// ---------- home ----------
const home = versioned(fs.readFileSync(path.join(PUB, 'index.html'), 'utf8')
  .replaceAll('5500000000000', config.whatsapp)
  .replaceAll('contato@vida.com.br', config.contactEmail));
write('index.html', page(home));

// ---------- dados para a home (blog e depoimentos) ----------
const cardCols = `p.id, p.title, p.slug, p.excerpt, p.cover, p.reading_time, p.published_at, c.name AS category, c.slug AS category_slug`;
write('data/posts.json', JSON.stringify({
  items: db.prepare(`SELECT ${cardCols} ${JOIN} WHERE ${PUBLISHED} ORDER BY p.featured DESC, p.published_at DESC LIMIT 3`).all(),
}));
const testimonials = db.prepare(`SELECT id, name, role, company, rating, text, featured FROM testimonials WHERE status='approved' ORDER BY featured DESC, created_at DESC LIMIT 12`).all();
const agg = db.prepare(`SELECT COUNT(*) AS total, ROUND(AVG(rating), 1) AS avg FROM testimonials WHERE status='approved'`).get();
write('data/testimonials.json', JSON.stringify({ items: testimonials, total: agg.total, avg: agg.avg || 0 }));

// ---------- blog ----------
const categories = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id=c.id AND ${PUBLISHED}) AS total FROM categories c ORDER BY c.name`).all();
const allPosts = db.prepare(`SELECT ${COLS} ${JOIN} WHERE ${PUBLISHED} ORDER BY p.featured DESC, p.published_at DESC`).all();
write('blog/index.html', page(views.blogIndex({ posts: allPosts, categories, page: 1, pages: 1, category: null, q: '', total: allPosts.length })));
for (const c of categories) {
  const posts = allPosts.filter((p) => p.category_id === c.id);
  write(`blog/categoria/${c.slug}/index.html`, page(views.blogIndex({ posts, categories, page: 1, pages: 1, category: c, q: '', total: posts.length })));
}
for (const post of allPosts) {
  const related = allPosts.filter((p) => p.id !== post.id)
    .sort((a, b) => (b.category_id === post.category_id) - (a.category_id === post.category_id)).slice(0, 3);
  write(`blog/${post.slug}/index.html`, page(views.blogPost({ post, related })));
}

// ---------- páginas legais ----------
for (const p of db.prepare('SELECT * FROM pages').all()) {
  write(`${p.slug}/index.html`, page(views.legalPage({ page: p })));
}

// ---------- área restrita (aviso) e 404 ----------
write('admin/index.html', page(views.layout({
  title: 'Área restrita', url: '/admin',
  body: `<section class="blog-hero blog-hero--404"><div class="blog-hero__bg" aria-hidden="true"></div><div class="container">
    <span class="eyebrow">Área restrita</span>
    <h1>Disponível na versão hospedada</h1>
    <p>Esta é uma prévia pública do site. O painel para publicar artigos, aprovar depoimentos e ver contatos funciona quando o site está hospedado com servidor.</p>
    <div class="cta__actions"><a href="/" class="btn btn--primary btn--lg">Voltar ao início</a><a href="/blog" class="btn btn--ghost btn--lg">Ir para o blog</a></div>
  </div></section>`,
})));
write('404.html', page(views.notFound()));

// ---------- SEO ----------
const u = (loc) => `<url><loc>${config.siteUrl}${loc}</loc></url>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
  ['/', '/blog/', '/privacidade/', '/termos/', ...categories.map((c) => `/blog/categoria/${c.slug}/`), ...allPosts.map((p) => `/blog/${p.slug}/`)].map(u).join('')}</urlset>`);

console.log(`✔ Versão estática gerada em docs/ (${allPosts.length} artigos, ${categories.length} categorias) — base ${BASE}`);
