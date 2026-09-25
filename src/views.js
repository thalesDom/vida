'use strict';
// Páginas públicas do blog renderizadas no servidor (SEO: título, descrição, Open Graph, JSON-LD).
const config = require('./config');
const { escapeHtml: e, formatDate, stripTags, slugify } = require('./utils');
const { versioned } = require('./assets');

const LOGO = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#lg)"/><path d="M11 26l6-7 5 4 7-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="29" cy="13" r="2.6" fill="#bef264"/></svg>`;

function header(active = '') {
  return `
<header class="nav is-solid" id="nav">
  <div class="container nav__inner">
    <a href="/" class="brand" aria-label="${e(config.siteName)} — início">${LOGO}<span><b>Vida</b></span></a>
    <nav class="nav__links" id="navLinks" aria-label="Principal">
      <a href="/#features">Funcionalidades</a>
      <a href="/#how">Como funciona</a>
      <a href="/#reviews">Depoimentos</a>
      <a href="/blog" class="${active === 'blog' ? 'is-active' : ''}">Blog</a>
      <a href="/#contato">Contato</a>
      <a href="/admin" class="btn btn--primary btn--sm nav__cta-mobile">Acessar painel</a>
    </nav>
    <div class="nav__actions">
      <a href="/admin" class="btn btn--primary btn--sm">Acessar painel <span aria-hidden="true">→</span></a>
      <button class="burger" id="burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function footer() {
  const y = new Date().getFullYear();
  return `
<footer class="footer" id="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a href="/" class="brand brand--light">${LOGO}<span><b>Vida</b></span></a>
        <p>Inteligência comercial para laboratórios. Visitação médica e B2B que gera resultado.</p>
        <div class="socials">
          <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
          <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7"/></svg></a>
          <a href="https://wa.me/${e(config.whatsapp)}" aria-label="WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.1-1.1z"/><path d="M9 9.5c.3 1.8 1.7 3.9 4.5 5l1.2-1.2 1.8.8-.4 1.6c-3 .4-7.4-3-7.6-6.6L10 7.8l1 1.6z" fill="currentColor" stroke="none"/></svg></a>
        </div>
      </div>
      <div><h4>Produto</h4><a href="/#features">Funcionalidades</a><a href="/#how">Como funciona</a><a href="/#dashboard">Plataforma</a></div>
      <div><h4>Empresa</h4><a href="/#reviews">Depoimentos</a><a href="/blog">Blog</a><a href="/#contato">Parceiros</a></div>
      <div><h4>Suporte</h4><a href="https://wa.me/${e(config.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:${e(config.contactEmail)}">${e(config.contactEmail)}</a><a href="/#faq">Perguntas frequentes</a></div>
    </div>
    <div class="footer__bottom">
      <span>© ${y} ${e(config.siteName)}. Todos os direitos reservados.</span>
      <span class="footer__legal"><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a><a href="#" data-cookie-prefs>Cookies</a><a href="/admin" class="footer__admin"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>Área restrita</a></span>
    </div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/${e(config.whatsapp)}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.1-1.1z"/><path d="M9 9.5c.3 1.8 1.7 3.9 4.5 5l1.2-1.2 1.8.8-.4 1.6c-3 .4-7.4-3-7.6-6.6L10 7.8l1 1.6z" fill="currentColor" stroke="none"/></svg></a>`;
}

function layout({ title, description = '', image = '', url = '', type = 'website', body, jsonLd = null, active = '' }) {
  const fullTitle = title ? `${title} | ${config.siteName}` : `${config.siteName} — Blog`;
  const img = image ? (image.startsWith('http') ? image : config.siteUrl + image) : `${config.siteUrl}/img/og.png`;
  return versioned(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${e(config.siteUrl + url)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${e(fullTitle)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(config.siteUrl + url)}">
<meta property="og:image" content="${e(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#064e3b">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${e(config.siteName)} Blog" href="/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/blog.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body class="page-blog">
<div class="progress" id="progress"></div>
${header(active)}
<main>${body}</main>
${footer()}
<script src="/js/main.js" defer></script>
</body>
</html>`);
}

function postCard(p, big = false) {
  return `
<article class="post-card${big ? ' post-card--big' : ''} reveal">
  <a href="/blog/${e(p.slug)}" class="post-card__media" tabindex="-1" aria-hidden="true">
    ${p.cover ? `<img src="${e(p.cover)}" alt="" loading="lazy">` : `<div class="post-card__ph"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M4 32l14-14 10 8 18-20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="6" r="4" fill="#bef264"/></svg><em>${e(p.category || 'Blog')}</em></div>`}
  </a>
  <div class="post-card__body">
    <div class="post-meta">
      ${p.category ? `<a class="chip" href="/blog/categoria/${e(p.category_slug)}">${e(p.category)}</a>` : ''}
      <span>${formatDate(p.published_at)}</span><span>·</span><span>${p.reading_time} min de leitura</span>
    </div>
    <h3><a href="/blog/${e(p.slug)}">${e(p.title)}</a></h3>
    <p>${e(p.excerpt)}</p>
    <a href="/blog/${e(p.slug)}" class="link-arrow">Ler artigo <span aria-hidden="true">→</span></a>
  </div>
</article>`;
}

function blogIndex({ posts, categories, page, pages, category, q, total }) {
  const base = category ? `/blog/categoria/${category.slug}` : '/blog';
  const qs = (n) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), page: n })}`;
  const heading = category ? category.name : q ? `Resultados para “${q}”` : 'Conteúdo para quem vive de resultado';
  const [first, ...rest] = posts;
  const featured = page === 1 && !q && first;

  const body = `
<section class="blog-hero">
  <div class="blog-hero__bg" aria-hidden="true"></div>
  <div class="container">
    <span class="eyebrow reveal">${category ? 'Categoria' : 'Blog Vida'}</span>
    <h1 class="reveal">${e(heading)}</h1>
    <p class="reveal">${e(category?.description || 'Estratégia comercial, visitação médica e inteligência de dados para laboratórios que querem crescer.')}</p>
    <form class="search reveal" action="${base}" role="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input type="search" name="q" value="${e(q || '')}" placeholder="Buscar artigos..." aria-label="Buscar artigos">
      <button class="btn btn--primary btn--sm">Buscar</button>
    </form>
    <nav class="cat-pills reveal" aria-label="Categorias">
      <a href="/blog" class="${!category ? 'is-active' : ''}">Todos</a>
      ${categories.filter((c) => c.total > 0).map((c) => `<a href="/blog/categoria/${e(c.slug)}" class="${category?.id === c.id ? 'is-active' : ''}">${e(c.name)} <small>${c.total}</small></a>`).join('')}
    </nav>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    ${!posts.length ? `<div class="empty reveal"><h3>Nenhum artigo encontrado</h3><p>Tente outra busca ou explore todas as categorias.</p><a href="/blog" class="btn btn--ghost">Ver todos os artigos</a></div>` : ''}
    ${featured ? postCard(first, true) : ''}
    <div class="post-grid">${(featured ? rest : posts).map((p) => postCard(p)).join('')}</div>
    ${pages > 1 ? `<nav class="pager" aria-label="Paginação">
      ${page > 1 ? `<a href="${qs(page - 1)}">← Anterior</a>` : '<span></span>'}
      <span>Página ${page} de ${pages}</span>
      ${page < pages ? `<a href="${qs(page + 1)}">Próxima →</a>` : '<span></span>'}
    </nav>` : ''}
  </div>
</section>
${newsletterCta()}`;

  return layout({
    title: category ? category.name : q ? `Busca: ${q}` : 'Blog',
    description: category?.description || 'Artigos sobre gestão comercial, visitação médica e BI para laboratórios.',
    url: base + (page > 1 ? `?page=${page}` : ''),
    body, active: 'blog',
  });
}

function newsletterCta() {
  return `
<section class="cta cta--compact">
  <div class="container">
    <div class="cta__box reveal">
      <div class="cta__glow" aria-hidden="true"></div>
      <h2>Leve essa inteligência para o seu laboratório</h2>
      <p>Transforme dados de visitas em crescimento comercial real.</p>
      <div class="cta__actions"><a href="/#contato" class="btn btn--light btn--lg">Falar com um especialista</a></div>
    </div>
  </div>
</section>`;
}

function blogPost({ post, related }) {
  const tags = (post.tags || '').split(',').filter(Boolean);
  const url = `/blog/${post.slug}`;
  const shareUrl = encodeURIComponent(config.siteUrl + url);
  const shareText = encodeURIComponent(post.title);
  const body = `
<article class="article">
  <header class="article__head">
    <div class="blog-hero__bg" aria-hidden="true"></div>
    <div class="container container--narrow">
      <nav class="crumbs reveal" aria-label="Trilha"><a href="/">Início</a><span>/</span><a href="/blog">Blog</a>${post.category ? `<span>/</span><a href="/blog/categoria/${e(post.category_slug)}">${e(post.category)}</a>` : ''}</nav>
      <h1 class="reveal">${e(post.title)}</h1>
      <p class="article__lead reveal">${e(post.excerpt)}</p>
      <div class="article__meta reveal">
        <span class="avatar">${e((post.author || 'Vida').split(' ').map((w) => w[0]).slice(0, 2).join(''))}</span>
        <div><strong>${e(post.author || config.siteName)}</strong><span>${formatDate(post.published_at)} · ${post.reading_time} min de leitura</span></div>
      </div>
    </div>
  </header>
  ${post.cover ? `<div class="container container--wide"><figure class="article__cover reveal"><img src="${e(post.cover)}" alt="${e(post.title)}"></figure></div>` : ''}
  <div class="container container--narrow article__layout">
    <aside class="share" aria-label="Compartilhar">
      <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.1-1.1z"/></svg></a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener" aria-label="Compartilhar no LinkedIn"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7"/></svg></a>
      <button type="button" data-copy="${e(config.siteUrl + url)}" aria-label="Copiar link"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg></button>
    </aside>
    <div class="prose">${post.content}</div>
  </div>
  <div class="container container--narrow">
    ${tags.length ? `<div class="tags">${tags.map((t) => `<a href="/blog?q=${encodeURIComponent(t)}">#${e(t)}</a>`).join('')}</div>` : ''}
  </div>
</article>
${related.length ? `<section class="section section--tight section--mint"><div class="container"><div class="section__head section__head--left"><span class="eyebrow">Continue lendo</span><h2>Artigos relacionados</h2></div><div class="post-grid">${related.map((p) => postCard(p)).join('')}</div></div></section>` : ''}
${newsletterCta()}`;

  return layout({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    image: post.cover, url, type: 'article', body, active: 'blog',
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.title, description: post.excerpt,
      image: post.cover ? (post.cover.startsWith('http') ? post.cover : config.siteUrl + post.cover) : undefined,
      datePublished: post.published_at?.replace(' ', 'T') + 'Z',
      dateModified: post.updated_at?.replace(' ', 'T') + 'Z',
      author: { '@type': 'Person', name: post.author || config.siteName },
      publisher: { '@type': 'Organization', name: config.siteName },
      mainEntityOfPage: config.siteUrl + url,
    },
  });
}

function legalPage({ page }) {
  // gera âncoras nos títulos <h2> para montar o índice lateral
  const toc = [];
  const content = page.content.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
    const text = stripTags(inner);
    const id = slugify(text);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  const other = page.slug === 'privacidade'
    ? { href: '/termos', label: 'Termos de Uso' }
    : { href: '/privacidade', label: 'Política de Privacidade' };

  const body = `
<section class="legal-hero">
  <div class="blog-hero__bg" aria-hidden="true"></div>
  <div class="container">
    <span class="eyebrow reveal">Transparência</span>
    <h1 class="reveal">${e(page.title)}</h1>
    <p class="reveal">${e(page.description)}</p>
    <div class="legal-meta reveal">
      <span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Última atualização: ${formatDate(page.updated_at)}</span>
      <span><svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>Em conformidade com a LGPD</span>
    </div>
    <nav class="legal-switch reveal" aria-label="Documentos legais">
      <a href="/privacidade" class="${page.slug === 'privacidade' ? 'is-active' : ''}">Política de Privacidade</a>
      <a href="/termos" class="${page.slug === 'termos' ? 'is-active' : ''}">Termos de Uso</a>
    </nav>
  </div>
</section>
<section class="section section--tight legal">
  <div class="container legal__grid">
    ${toc.length ? `<aside class="legal-toc" aria-label="Nesta página">
      <strong>Nesta página</strong>
      <nav>${toc.map((t) => `<a href="#${e(t.id)}">${e(t.text)}</a>`).join('')}</nav>
    </aside>` : ''}
    <div>
      <article class="prose legal__body">${content}</article>
      <div class="legal-help">
        <div>
          <strong>Ficou com alguma dúvida?</strong>
          <p>Nossa equipe responde sobre privacidade, dados e termos de uso.</p>
        </div>
        <div class="legal-help__actions">
          <a href="mailto:${e(config.contactEmail)}" class="btn btn--primary">Enviar e-mail</a>
          <a href="${other.href}" class="btn btn--ghost">Ler ${e(other.label)} <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </div>
  </div>
</section>`;

  return layout({ title: page.title, description: page.description, url: `/${page.slug}`, body });
}

function notFound() {
  return layout({
    title: 'Página não encontrada', url: '/404',
    body: `<section class="blog-hero blog-hero--404"><div class="blog-hero__bg" aria-hidden="true"></div><div class="container">
      <span class="eyebrow">Erro 404</span><h1>Essa página saiu da rota</h1>
      <p>O conteúdo que você procura não existe ou foi movido.</p>
      <div class="cta__actions"><a href="/" class="btn btn--primary btn--lg">Voltar ao início</a><a href="/blog" class="btn btn--ghost btn--lg">Ir para o blog</a></div>
    </div></section>`,
  });
}

module.exports = { blogIndex, blogPost, legalPage, notFound };
