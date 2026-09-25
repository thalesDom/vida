/* SD Vendas — Painel administrativo (SPA com rotas por hash) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = $('#root');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('pt-BR');
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const toDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z') : null);
  const fdate = (s, time) => {
    const d = toDate(s); if (!d) return '—';
    const base = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    return time ? `${base}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : base;
  };
  const initials = (n = '') => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const slugify = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

  const I = {
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0M16 4a4 4 0 010 8M22 21a7 7 0 00-4-6.3"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    cookie: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 109.8 8 2.8 2.8 0 01-3.4-2.7 2.8 2.8 0 01-3.4-3.4A10 10 0 0112 2z"/><path d="M8.5 9.5h.01M15 14h.01M9 15.5h.01"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  };
  const LOGO = '<svg viewBox="0 0 40 40"><defs><linearGradient id="alg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#alg)"/><path d="M11 26l6-7 5 4 7-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="29" cy="13" r="2.6" fill="#bef264"/></svg>';

  /* ---------- API ---------- */
  let me = null;
  async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' };
    if (opts.body instanceof FormData) init.body = opts.body;
    else if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    const r = await fetch('/api' + path, init);
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && !path.startsWith('/auth/login')) { me = null; location.hash = '#/login'; throw new Error(data.error || 'Sessão expirada.'); }
    if (!r.ok) throw new Error(data.error || 'Algo deu errado.');
    return data;
  }

  /* ---------- UI helpers ---------- */
  function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' toast--err' : '');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  function modal({ title, body, foot = '', wide = false, onMount }) {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modal__box${wide ? ' modal__box--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal__head"><h3>${esc(title)}</h3><button class="modal__close" aria-label="Fechar">×</button></div>
      <div class="modal__body">${body}</div>${foot ? `<div class="modal__foot">${foot}</div>` : ''}</div>`;
    const close = () => { m.remove(); removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    m.addEventListener('mousedown', (e) => { if (e.target === m) close(); });
    $('.modal__close', m).onclick = close;
    addEventListener('keydown', onKey);
    document.body.appendChild(m);
    onMount?.(m, close);
    $('input, textarea, select, button:not(.modal__close)', m)?.focus();
    return { el: m, close };
  }
  function confirmBox(text, okLabel = 'Excluir') {
    return new Promise((res) => {
      const { el, close } = modal({
        title: 'Confirmar ação',
        body: `<p>${esc(text)}</p>`,
        foot: `<button class="btn" data-no>Cancelar</button><button class="btn btn--primary" data-yes style="background:var(--danger);box-shadow:none">${esc(okLabel)}</button>`,
      });
      $('[data-no]', el).onclick = () => { close(); res(false); };
      $('[data-yes]', el).onclick = () => { close(); res(true); };
    });
  }
  function busy(btn, on) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true; }
    else { btn.innerHTML = btn.dataset.label || btn.innerHTML; btn.disabled = false; }
  }
  function statusOf(p) {
    if (p.status === 'draft') return '<span class="st st--draft">Rascunho</span>';
    if (toDate(p.published_at) > new Date()) return `<span class="st st--sch" title="${fdate(p.published_at, true)}">Agendado</span>`;
    return '<span class="st st--pub">Publicado</span>';
  }
  async function uploadFile(file) {
    const fd = new FormData(); fd.append('file', file);
    return api('/admin/upload', { method: 'POST', body: fd });
  }

  /* ---------- Login ---------- */
  function renderLogin() {
    root.innerHTML = `
    <div class="login">
      <aside class="login__side">
        <div class="login__orb"></div>
        <a href="/" class="brand">${LOGO}<span>SD<b>Vendas</b></span></a>
        <div>
          <h1>Seu conteúdo, <em>sua autoridade</em> no mercado.</h1>
          <p>Publique artigos, gerencie categorias, imagens e contatos recebidos pelo site — tudo em um só lugar.</p>
        </div>
        <div class="login__feats">
          <span><i>✓</i>Editor visual com imagens e vídeos</span>
          <span><i>✓</i>Agendamento de publicações</span>
          <span><i>✓</i>SEO otimizado em cada artigo</span>
        </div>
      </aside>
      <main class="login__main">
        <form class="login__card" id="loginForm" novalidate>
          <a href="/" class="brand brand--dark">${LOGO}<span>SD<b>Vendas</b></span></a>
          <div><h2>Bem-vindo de volta</h2><p class="sub">Acesse a área restrita para gerenciar o blog.</p></div>
          <div class="alert alert--err" id="loginErr" hidden></div>
          <label class="fld"><span>Login</span><input class="inp" name="email" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
          <label class="fld"><span>Senha</span><div class="inp-wrap"><input class="inp" name="password" type="password" autocomplete="current-password" required><button type="button" id="togglePw">Mostrar</button></div></label>
          <button class="btn btn--primary btn--block" type="submit">Entrar</button>
          <p class="sub" style="font-size:13px;text-align:center">Acesso reservado. Os usuários são criados pelo administrador.</p>
        </form>
      </main>
    </div>`;
    $('#togglePw').onclick = (e) => {
      const i = $('[name=password]'); const show = i.type === 'password';
      i.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Ocultar' : 'Mostrar';
    };
    $('#loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, btn = $('button[type=submit]', f), err = $('#loginErr');
      err.hidden = true; busy(btn, true);
      try {
        const { user } = await api('/auth/login', { method: 'POST', body: { email: f.email.value, password: f.password.value } });
        me = user;
        location.hash = user.must_change ? '#/perfil' : '#/';
      } catch (ex) { err.textContent = ex.message; err.hidden = false; busy(btn, false); }
    };
    $('[name=email]').focus();
  }

  /* ---------- Layout ---------- */
  let unread = 0;
  function shell(title, actions = '') {
    const cur = location.hash.replace(/^#/, '') || '/';
    const is = (p) => (p === '/' ? cur === '/' : cur.startsWith(p)) ? 'is-active' : '';
    // botão "voltar" nas telas de edição
    const back = /^\/(posts\/(novo|\d+)|categorias|midia)$/.test(cur) ? ['#/posts', 'Artigos']
      : /^\/paginas\/.+/.test(cur) ? ['#/paginas', 'Páginas'] : null;
    root.innerHTML = `
    <div class="app" id="app">
      <aside class="side">
        <a href="#/" class="brand">${LOGO}<span>SD<b>Vendas</b></span></a>
        <nav class="side__nav">
          <a href="#/" class="${is('/')}">${I.grid}Visão geral</a>
          <div class="side__label">Blog</div>
          <a href="#/posts" class="${/^\/(posts|categorias|midia)/.test(cur) ? 'is-active' : ''}">${I.file}Artigos</a>
          <div class="side__label">Site</div>
          <a href="#/depoimentos" class="${is('/depoimentos')}">${I.star}Depoimentos</a>
          <a href="#/contatos" class="${is('/contatos')}">${I.mail}Contatos ${unread ? `<span class="badge">${unread}</span>` : ''}</a>
          <a href="#/paginas" class="${is('/paginas')}">${I.shield}Páginas legais</a>
          <a href="#/cookies" class="${is('/cookies')}">${I.cookie}Cookies (LGPD)</a>
          <a href="#/usuarios" class="${/^\/(usuarios|perfil)/.test(cur) ? 'is-active' : ''}">${me.role === 'admin' ? `${I.users}Usuários` : `${I.user}Minha conta`}</a>
          <a href="/" target="_blank" rel="noopener">${I.ext}Ver site</a>
        </nav>
        <div class="side__user">
          <span class="av">${esc(initials(me.name))}</span>
          <div><strong>${esc(me.name)}</strong><small>${me.role === 'admin' ? 'Administrador' : 'Editor'}</small></div>
          <button id="logout" title="Sair" aria-label="Sair">${I.out}</button>
        </div>
      </aside>
      <div class="scrim" id="scrim"></div>
      <div class="main">
        <header class="topbar">
          <button class="topbar__menu" id="menuBtn" aria-label="Menu">${I.menu}</button>
          ${back ? `<a href="${back[0]}" class="topbar__back" title="Voltar para ${back[1]}"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg><span>${back[1]}</span></a>` : ''}
          <h1>${esc(title)}</h1>
          ${actions}
        </header>
        ${me.must_change && !/^\/(perfil|usuarios)/.test(cur) ? `<div style="padding:18px 32px 0"><div class="alert alert--warn"><span>⚠ Por segurança, troque a senha padrão da sua conta.</span><a href="#/perfil" class="btn btn--sm">Trocar senha</a></div></div>` : ''}
        <section class="view" id="view"></section>
      </div>
    </div>`;
    const app = $('#app');
    $('#menuBtn').onclick = () => app.classList.toggle('is-menu');
    $('#scrim').onclick = () => app.classList.remove('is-menu');
    $('#logout').onclick = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); me = null; location.hash = '#/login'; };
    refreshBadges();
    return $('#view');
  }

  /* ---------- Dashboard ---------- */
  async function renderDashboard() {
    const v = shell('Visão geral', `<a href="#/posts/novo" class="btn btn--primary">${I.plus}<span class="hide-sm">Novo artigo</span></a>`);
    const s = await api('/admin/stats');
    unread = s.unreadLeads;
    const hour = new Date().getHours();
    v.innerHTML = `
      <p style="font-size:17px;margin-bottom:20px"><strong>${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}, ${esc(me.name.split(' ')[0])}!</strong> <span class="muted">Aqui está o resumo do seu blog.</span></p>
      <div class="kpis">
        <div class="card kpi kpi--hl"><small>Visualizações totais</small><strong>${nf.format(s.views)}</strong><i>${I.eye}</i></div>
        <div class="card kpi"><small>Artigos publicados</small><strong>${s.published}</strong><i>${I.check}</i></div>
        <div class="card kpi"><small>Rascunhos · Agendados</small><strong>${s.drafts} · ${s.scheduled}</strong><i>${I.clock}</i></div>
        <div class="card kpi"><small>Contatos recebidos</small><strong>${s.leads}</strong><i>${I.mail}</i></div>
      </div>
      <div class="quick">
        <a href="#/posts/novo"><span>${I.plus}</span>Escrever novo artigo</a>
        <a href="#/midia"><span>${I.upload}</span>Enviar imagens</a>
        <a href="#/contatos"><span>${I.mail}</span>Ver contatos ${s.unreadLeads ? `<b class="badge" style="margin-left:auto">${s.unreadLeads} ${s.unreadLeads > 1 ? 'novos' : 'novo'}</b>` : ''}</a>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card__head"><h3>Atualizados recentemente</h3><a href="#/posts" class="btn btn--sm">Ver todos</a></div>
          ${s.recent.length ? `<div class="list-simple">${s.recent.map((p) => `
            <a href="#/posts/${p.id}"><span class="grow">${esc(p.title)}</span>${statusOf(p)}<small class="muted">${fdate(p.updated_at)}</small></a>`).join('')}</div>`
            : `<div class="empty">${I.file}<p>Nenhum artigo ainda.</p></div>`}
        </div>
        <div class="card">
          <div class="card__head"><h3>Mais lidos</h3>${I.chart.replace('<svg', '<svg width="18" height="18" style="fill:none;stroke:var(--g-600);stroke-width:2"')}</div>
          ${s.top.length ? `<div class="list-simple">${s.top.map((p, i) => `
            <a href="/blog/${esc(p.slug)}" target="_blank" rel="noopener"><span class="rank">${i + 1}</span><span class="grow">${esc(p.title)}</span><strong>${nf.format(p.views)}</strong></a>`).join('')}</div>`
            : `<div class="empty"><p>Sem dados ainda.</p></div>`}
        </div>
      </div>`;
    if (s.pendingTestimonials) {
      $('.quick', v).insertAdjacentHTML('beforebegin', `<div class="alert alert--warn" style="margin-bottom:16px"><span>★ ${s.pendingTestimonials} ${s.pendingTestimonials > 1 ? 'depoimentos aguardando' : 'depoimento aguardando'} sua aprovação.</span><a href="#/depoimentos" class="btn btn--sm">Revisar agora</a></div>`);
    }
  }

  // Atualiza os contadores do menu (contatos não lidos e depoimentos pendentes)
  async function refreshBadges() {
    try {
      const s = await api('/admin/stats');
      unread = s.unreadLeads;
      const set = (href, n) => {
        const a = $(`.side__nav a[href="${href}"]`); if (!a) return;
        $('.badge', a)?.remove();
        if (n) a.insertAdjacentHTML('beforeend', `<span class="badge">${n}</span>`);
      };
      set('#/contatos', s.unreadLeads);
      set('#/depoimentos', s.pendingTestimonials);
    } catch { /* silencioso */ }
  }

  /* ---------- Lista de posts ---------- */
  const listState = { q: '', status: '', category: '', page: 1 };
  async function renderPosts() {
    const v = shell('Artigos', `
      <a href="#/categorias" class="btn">${I.tag}<span class="hide-sm">Categorias</span></a>
      <a href="#/midia" class="btn">${I.image}<span class="hide-sm">Mídia</span></a>
      <a href="#/posts/novo" class="btn btn--primary">${I.plus}<span class="hide-sm">Novo artigo</span></a>`);
    const cats = await api('/admin/categories');
    v.innerHTML = `
      <div class="toolbar">
        <input class="inp" id="q" type="search" placeholder="Buscar por título ou tag..." value="${esc(listState.q)}">
        <select class="sel" id="cat"><option value="">Todas as categorias</option>${cats.map((c) => `<option value="${c.id}" ${String(c.id) === listState.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <span class="spacer"></span>
        <div class="seg" id="seg">
          ${[['', 'Todos'], ['published', 'Publicados'], ['scheduled', 'Agendados'], ['draft', 'Rascunhos']].map(([k, l]) => `<button data-s="${k}" class="${listState.status === k ? 'is-active' : ''}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="card" id="list"></div>`;
    let t;
    $('#q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { listState.q = e.target.value; listState.page = 1; load(); }, 300); };
    $('#cat').onchange = (e) => { listState.category = e.target.value; listState.page = 1; load(); };
    $$('#seg button').forEach((b) => b.onclick = () => {
      listState.status = b.dataset.s; listState.page = 1;
      $$('#seg button').forEach((x) => x.classList.toggle('is-active', x === b)); load();
    });

    async function load() {
      const box = $('#list');
      const qs = new URLSearchParams({ q: listState.q, status: listState.status, category: listState.category, page: listState.page, limit: 15 });
      const d = await api('/admin/posts?' + qs);
      if (!d.items.length) {
        box.innerHTML = `<div class="empty">${I.file}<p>Nenhum artigo encontrado.</p><a href="#/posts/novo" class="btn btn--primary">${I.plus}Escrever o primeiro</a></div>`;
        return;
      }
      box.innerHTML = `
        <table class="tbl">
          <thead><tr><th>Artigo</th><th>Status</th><th>Categoria</th><th>Views</th><th>Atualizado</th><th></th></tr></thead>
          <tbody>${d.items.map((p) => `
            <tr>
              <td><div class="post-cell">${p.cover ? `<img class="thumb" src="${esc(p.cover)}" alt="">` : '<span class="thumb"></span>'}
                <div><a href="#/posts/${p.id}">${esc(p.title)}</a>${p.featured ? '<small>★ Destaque</small>' : `<small>${esc(p.author || '')}</small>`}</div></div></td>
              <td>${statusOf(p)}</td>
              <td data-hide-sm class="muted">${esc(p.category || '—')}</td>
              <td data-hide-sm>${nf.format(p.views)}</td>
              <td data-hide-sm class="muted">${fdate(p.updated_at)}</td>
              <td><div class="actions">
                <a class="btn btn--sm btn--icon" href="${p.status === 'published' && toDate(p.published_at) <= new Date() ? `/blog/${esc(p.slug)}` : `/blog/preview/${p.id}`}" target="_blank" rel="noopener" title="Visualizar">${I.eye}</a>
                <a class="btn btn--sm btn--icon" href="#/posts/${p.id}" title="Editar">${I.edit}</a>
                <button class="btn btn--sm btn--icon" data-dup="${p.id}" title="Duplicar">${I.copy}</button>
                <button class="btn btn--sm btn--icon btn--danger" data-del="${p.id}" title="Excluir">${I.trash}</button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table>
        ${d.pages > 1 ? `<div class="pager"><button class="btn btn--sm" id="prev" ${d.page <= 1 ? 'disabled' : ''}>← Anterior</button><span>Página ${d.page} de ${d.pages} · ${d.total} artigos</span><button class="btn btn--sm" id="next" ${d.page >= d.pages ? 'disabled' : ''}>Próxima →</button></div>` : ''}`;
      $('#prev')?.addEventListener('click', () => { listState.page--; load(); });
      $('#next')?.addEventListener('click', () => { listState.page++; load(); });
      $$('[data-del]', box).forEach((b) => b.onclick = async () => {
        if (!(await confirmBox('Excluir este artigo definitivamente? Essa ação não pode ser desfeita.'))) return;
        try { await api('/admin/posts/' + b.dataset.del, { method: 'DELETE' }); toast('Artigo excluído.'); load(); } catch (ex) { toast(ex.message, 'err'); }
      });
      $$('[data-dup]', box).forEach((b) => b.onclick = async () => {
        try { const r = await api(`/admin/posts/${b.dataset.dup}/duplicate`, { method: 'POST' }); toast('Cópia criada como rascunho.'); location.hash = '#/posts/' + r.id; } catch (ex) { toast(ex.message, 'err'); }
      });
    }
    load();
  }

  /* ---------- Editor de post ---------- */
  let dirty = false;
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  async function renderEditor(id) {
    const isNew = !id;
    const v = shell(isNew ? 'Novo artigo' : 'Editar artigo', `
      <span class="save-state" id="saveState">${isNew ? 'Não salvo' : 'Salvo'}</span>
      <a class="btn" id="previewBtn" target="_blank" rel="noopener" ${isNew ? 'hidden' : ''}>${I.eye}<span class="hide-sm">Pré-visualizar</span></a>
      <button class="btn btn--primary" id="saveBtn">${I.check}<span class="hide-sm">Salvar</span></button>`);
    const [cats, post] = await Promise.all([api('/admin/categories'), isNew ? Promise.resolve({}) : api('/admin/posts/' + id)]);
    const localDate = (s) => { const d = toDate(s); if (!d) return ''; const o = d.getTimezoneOffset() * 60000; return new Date(d - o).toISOString().slice(0, 16); };

    v.innerHTML = `
      <div class="editor">
        <div class="editor__main">
          <div>
            <textarea class="title-inp" id="title" rows="1" placeholder="Título do artigo" maxlength="200">${esc(post.title || '')}</textarea>
            <div class="slug-line">/blog/<input id="slug" value="${esc(post.slug || '')}" placeholder="endereco-do-artigo" aria-label="Endereço do artigo"></div>
          </div>
          <div class="card"><div id="quill"></div></div>
          <div class="card"><div class="card__head"><h3>Resumo</h3><span class="counter" id="exCount"></span></div>
            <div class="card__body"><textarea class="txt" id="excerpt" maxlength="400" placeholder="Um parágrafo curto que aparece nos cards e no Google. Se vazio, é gerado do conteúdo.">${esc(post.excerpt || '')}</textarea></div></div>
          <div class="card"><div class="card__head"><h3>SEO — como aparece no Google</h3></div>
            <div class="card__body" style="display:grid;gap:14px">
              <label class="fld"><span>Título SEO</span><input class="inp" id="seoTitle" maxlength="70" value="${esc(post.seo_title || '')}" placeholder="Se vazio, usa o título do artigo"><span class="counter" id="stCount"></span></label>
              <label class="fld"><span>Descrição SEO</span><textarea class="txt" id="seoDesc" maxlength="170" style="min-height:70px" placeholder="Se vazio, usa o resumo">${esc(post.seo_description || '')}</textarea><span class="counter" id="sdCount"></span></label>
              <div class="seo-preview"><span class="u" id="spU"></span><span class="t" id="spT"></span><span class="d" id="spD"></span></div>
            </div></div>
        </div>
        <aside class="editor__side">
          <div class="card"><div class="card__head"><h3>Publicação</h3></div>
            <div class="card__body">
              <label class="fld"><span>Status</span><select class="sel" id="status">
                <option value="draft" ${post.status !== 'published' ? 'selected' : ''}>Rascunho</option>
                <option value="published" ${post.status === 'published' ? 'selected' : ''}>Publicado</option></select></label>
              <label class="fld"><span>Data de publicação</span><input class="inp" type="datetime-local" id="pubAt" value="${localDate(post.published_at)}"><small>Escolha uma data futura para agendar.</small></label>
              <label class="check"><input type="checkbox" id="featured" ${post.featured ? 'checked' : ''}>Artigo em destaque</label>
            </div></div>
          <div class="card"><div class="card__head"><h3>Imagem de capa</h3></div>
            <div class="card__body">
              <div class="cover-drop" id="coverDrop" tabindex="0" role="button" aria-label="Enviar imagem de capa">
                <div>${I.upload}Clique ou arraste uma imagem<br><small class="muted">JPG, PNG ou WEBP · até 5 MB · ideal 1600×900</small></div>
              </div>
              <input type="file" id="coverFile" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
              <div class="cover-actions"><button class="btn btn--sm" id="pickMedia">${I.image}Da biblioteca</button><button class="btn btn--sm btn--danger" id="rmCover" hidden>${I.trash}Remover</button></div>
            </div></div>
          <div class="card"><div class="card__head"><h3>Organização</h3></div>
            <div class="card__body">
              <div class="fld"><span>Categoria</span>
                <div class="sel-add">
                  <select class="sel" id="category" aria-label="Categoria"><option value="">Sem categoria</option>${cats.map((c) => `<option value="${c.id}" ${c.id === post.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
                  <button type="button" class="btn btn--icon" id="addCat" title="Criar nova categoria" aria-label="Criar nova categoria">${I.plus}</button>
                </div>
                <div class="sel-add__new" id="newCatBox" hidden>
                  <input class="inp" id="newCatName" maxlength="80" placeholder="Nome da nova categoria">
                  <button type="button" class="btn btn--primary btn--sm" id="saveCat">Criar</button>
                </div>
              </div>
              <label class="fld"><span>Tags</span><input class="inp" id="tags" value="${esc(post.tags || '')}" placeholder="kpi, gestão, churn"><small>Separe por vírgula.</small></label>
            </div></div>
          ${!isNew ? `<button class="btn btn--danger" id="delPost">${I.trash}Excluir artigo</button>` : ''}
        </aside>
      </div>`;

    // Quill
    await quillReady();
    const quill = new Quill('#quill', {
      theme: 'snow',
      placeholder: 'Comece a escrever seu artigo...',
      modules: {
        toolbar: {
          container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'], [{ align: [] }], ['link', 'image', 'video'], ['clean']],
          handlers: { image: () => pickImage((url) => { const r = quill.getSelection(true); quill.insertEmbed(r.index, 'image', url, 'user'); quill.setSelection(r.index + 1); }) },
        },
      },
    });
    if (post.content) quill.clipboard.dangerouslyPasteHTML(post.content);
    // colar/arrastar imagens direto no editor → faz upload
    quill.root.addEventListener('drop', async (e) => {
      const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith('image/'));
      if (!f) return; e.preventDefault();
      try { const { url } = await uploadFile(f); const r = quill.getSelection(true); quill.insertEmbed(r.index, 'image', url, 'user'); } catch (ex) { toast(ex.message, 'err'); }
    });
    quill.root.addEventListener('paste', async (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (!f) return; e.preventDefault(); e.stopPropagation();
      try { const { url } = await uploadFile(f); const r = quill.getSelection(true); quill.insertEmbed(r.index, 'image', url, 'user'); } catch (ex) { toast(ex.message, 'err'); }
    }, true);

    let cover = post.cover || '';
    let slugTouched = !isNew;
    const state = $('#saveState');
    const markDirty = () => { dirty = true; state.textContent = 'Alterações não salvas'; state.classList.add('is-dirty'); };
    quill.on('text-change', (d, o, src) => { if (src === 'user') markDirty(); });
    $$('.editor input, .editor textarea, .editor select').forEach((el) => el.addEventListener('input', markDirty));

    // criar categoria sem sair do editor
    const catBox = $('#newCatBox'), catName = $('#newCatName');
    $('#addCat').onclick = () => { catBox.hidden = !catBox.hidden; if (!catBox.hidden) catName.focus(); };
    const createCat = async () => {
      const name = catName.value.trim();
      if (name.length < 2) { toast('Digite o nome da categoria.', 'err'); return; }
      try {
        const c = await api('/admin/categories', { method: 'POST', body: { name } });
        const sel = $('#category');
        sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.name)}</option>`);
        sel.value = String(c.id);
        catName.value = ''; catBox.hidden = true; markDirty();
        toast(`Categoria “${c.name}” criada.`);
      } catch (ex) { toast(ex.message, 'err'); }
    };
    $('#saveCat').onclick = createCat;
    catName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); createCat(); } });

    const title = $('#title'), slug = $('#slug');
    // título em várias linhas: cresce conforme o texto e não aceita Enter
    const fit = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
    title.addEventListener('input', fit);
    title.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    fit();
    title.addEventListener('input', () => { if (!slugTouched) slug.value = slugify(title.value); updSeo(); });
    slug.addEventListener('input', () => { slugTouched = true; });
    slug.addEventListener('blur', () => { slug.value = slugify(slug.value); });

    function counter(el, out, max) { const n = el.value.length; out.textContent = `${n}/${max}`; out.classList.toggle('is-over', n > max * 0.95); }
    function updSeo() {
      counter($('#excerpt'), $('#exCount'), 400); counter($('#seoTitle'), $('#stCount'), 70); counter($('#seoDesc'), $('#sdCount'), 170);
      $('#spU').textContent = `${location.host} › blog › ${slug.value || 'artigo'}`;
      $('#spT').textContent = ($('#seoTitle').value || title.value || 'Título do artigo') + ' | SD Vendas';
      $('#spD').textContent = $('#seoDesc').value || $('#excerpt').value || quill.getText().slice(0, 160) || 'Descrição do artigo...';
    }
    ['#excerpt', '#seoTitle', '#seoDesc', '#slug'].forEach((s) => $(s).addEventListener('input', updSeo));
    updSeo();

    // Capa
    const drop = $('#coverDrop'), file = $('#coverFile');
    function paintCover() {
      const img = $('img', drop); img?.remove();
      if (cover) { const i = document.createElement('img'); i.src = cover; i.alt = ''; drop.appendChild(i); }
      $('#rmCover').hidden = !cover;
    }
    async function setCoverFile(f) {
      drop.style.opacity = '.6';
      try { cover = (await uploadFile(f)).url; paintCover(); markDirty(); } catch (ex) { toast(ex.message, 'err'); }
      drop.style.opacity = '';
    }
    drop.onclick = () => file.click();
    drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } };
    file.onchange = () => file.files[0] && setCoverFile(file.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('is-over'); };
    drop.ondragleave = () => drop.classList.remove('is-over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('is-over'); const f = e.dataTransfer.files[0]; if (f) setCoverFile(f); };
    $('#rmCover').onclick = () => { cover = ''; paintCover(); markDirty(); };
    $('#pickMedia').onclick = () => pickImage((url) => { cover = url; paintCover(); markDirty(); });
    paintCover();

    let currentId = id;
    const setPreview = () => { const a = $('#previewBtn'); if (currentId) { a.hidden = false; a.href = `/blog/preview/${currentId}`; } };
    setPreview();

    async function save() {
      const btn = $('#saveBtn');
      const pub = $('#pubAt').value;
      const body = {
        title: title.value, slug: slug.value, content: quill.getLength() > 1 ? quill.root.innerHTML : '',
        excerpt: $('#excerpt').value, cover, category_id: $('#category').value, tags: $('#tags').value,
        status: $('#status').value, featured: $('#featured').checked, seo_title: $('#seoTitle').value,
        seo_description: $('#seoDesc').value, published_at: pub ? new Date(pub).toISOString() : '',
      };
      busy(btn, true);
      try {
        const saved = await api(currentId ? '/admin/posts/' + currentId : '/admin/posts', { method: currentId ? 'PUT' : 'POST', body });
        dirty = false; state.textContent = 'Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); state.classList.remove('is-dirty');
        slug.value = saved.slug; slugTouched = true;
        $('#pubAt').value = localDate(saved.published_at);
        const scheduled = saved.status === 'published' && toDate(saved.published_at) > new Date();
        toast(saved.status === 'draft' ? 'Rascunho salvo.' : scheduled ? `Agendado para ${fdate(saved.published_at, true)}.` : 'Artigo publicado! 🎉');
        if (!currentId) { currentId = saved.id; history.replaceState(null, '', '#/posts/' + saved.id); lastHash = location.hash; $('.topbar h1').textContent = 'Editar artigo'; }
        setPreview();
      } catch (ex) { toast(ex.message, 'err'); }
      busy(btn, false);
    }
    $('#saveBtn').onclick = save;
    // Ctrl+S salva
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    addEventListener('keydown', onKey);
    cleanup = () => removeEventListener('keydown', onKey);

    $('#delPost')?.addEventListener('click', async () => {
      if (!(await confirmBox('Excluir este artigo definitivamente?'))) return;
      try { await api('/admin/posts/' + currentId, { method: 'DELETE' }); dirty = false; toast('Artigo excluído.'); location.hash = '#/posts'; } catch (ex) { toast(ex.message, 'err'); }
    });
    if (isNew) title.focus();
  }

  function quillReady() {
    return new Promise((res, rej) => {
      if (window.Quill) return res();
      let n = 0; const t = setInterval(() => {
        if (window.Quill) { clearInterval(t); res(); } else if (++n > 100) { clearInterval(t); toast('Não foi possível carregar o editor. Verifique a internet.', 'err'); rej(new Error('Quill')); }
      }, 100);
    });
  }

  // Seletor de imagem (biblioteca + upload)
  async function pickImage(onPick) {
    const { el, close } = modal({
      title: 'Inserir imagem', wide: true,
      body: `<label class="dropzone" id="pDrop">${I.upload.replace('<svg', '<svg width="30" height="30" style="fill:none;stroke:currentColor;stroke-width:1.8"')}Clique ou arraste para enviar<small>JPG, PNG, WEBP ou GIF · até 5 MB</small><input type="file" accept="image/*" hidden></label>
             <div class="media-grid" id="pGrid"><p class="muted">Carregando...</p></div>`,
    });
    const input = $('input[type=file]', el), dz = $('#pDrop', el);
    const up = async (f) => { try { const { url } = await uploadFile(f); close(); onPick(url); } catch (ex) { toast(ex.message, 'err'); } };
    input.onchange = () => input.files[0] && up(input.files[0]);
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('is-over'); };
    dz.ondragleave = () => dz.classList.remove('is-over');
    dz.ondrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) up(f); };
    const files = await api('/admin/media');
    $('#pGrid', el).innerHTML = files.length ? files.map((f) => `<button type="button" class="media-item is-pick" data-url="${esc(f.url)}" style="border:0;padding:0"><img src="${esc(f.url)}" alt="" loading="lazy"></button>`).join('') : '<p class="muted">Nenhuma imagem na biblioteca ainda.</p>';
    $$('[data-url]', el).forEach((b) => b.onclick = () => { close(); onPick(b.dataset.url); });
  }

  /* ---------- Categorias ---------- */
  async function renderCategories() {
    const v = shell('Categorias', `<button class="btn btn--primary" id="newCat">${I.plus}<span class="hide-sm">Nova categoria</span></button>`);
    const load = async () => {
      const cats = await api('/admin/categories');
      v.innerHTML = `<div class="card">${cats.length ? `<table class="tbl"><thead><tr><th>Nome</th><th>Endereço</th><th>Artigos</th><th></th></tr></thead><tbody>
        ${cats.map((c) => `<tr><td><strong>${esc(c.name)}</strong><br><small class="muted">${esc(c.description || '')}</small></td><td data-hide-sm class="muted">/blog/categoria/${esc(c.slug)}</td><td>${c.total}</td>
        <td><div class="actions"><button class="btn btn--sm btn--icon" data-edit='${esc(JSON.stringify(c))}' title="Editar">${I.edit}</button><button class="btn btn--sm btn--icon btn--danger" data-del="${c.id}" data-n="${c.total}" title="Excluir">${I.trash}</button></div></td></tr>`).join('')}
        </tbody></table>` : `<div class="empty">${I.tag}<p>Nenhuma categoria.</p></div>`}</div>`;
      $$('[data-edit]', v).forEach((b) => b.onclick = () => form(JSON.parse(b.dataset.edit)));
      $$('[data-del]', v).forEach((b) => b.onclick = async () => {
        if (!(await confirmBox(+b.dataset.n ? `Esta categoria tem ${b.dataset.n} artigo(s). Eles ficarão sem categoria. Excluir?` : 'Excluir esta categoria?'))) return;
        await api('/admin/categories/' + b.dataset.del, { method: 'DELETE' }); toast('Categoria excluída.'); load();
      });
    };
    function form(c = {}) {
      const { el, close } = modal({
        title: c.id ? 'Editar categoria' : 'Nova categoria',
        body: `<label class="fld"><span>Nome</span><input class="inp" name="name" value="${esc(c.name || '')}" maxlength="80"></label>
               <label class="fld"><span>Endereço (slug)</span><input class="inp" name="slug" value="${esc(c.slug || '')}" placeholder="gerado automaticamente"></label>
               <label class="fld"><span>Descrição</span><textarea class="txt" name="description" maxlength="300">${esc(c.description || '')}</textarea></label>`,
        foot: `<button class="btn" data-x>Cancelar</button><button class="btn btn--primary" data-ok>Salvar</button>`,
      });
      $('[data-x]', el).onclick = close;
      $('[data-ok]', el).onclick = async (e) => {
        busy(e.target, true);
        try {
          await api(c.id ? '/admin/categories/' + c.id : '/admin/categories', { method: c.id ? 'PUT' : 'POST', body: { name: $('[name=name]', el).value, slug: $('[name=slug]', el).value, description: $('[name=description]', el).value } });
          close(); toast('Categoria salva.'); load();
        } catch (ex) { toast(ex.message, 'err'); busy(e.target, false); }
      };
    }
    $('#newCat').onclick = () => form();
    load();
  }

  /* ---------- Mídia ---------- */
  async function renderMedia() {
    const v = shell('Biblioteca de mídia');
    v.innerHTML = `<label class="dropzone" id="dz">${I.upload.replace('<svg', '<svg width="34" height="34" style="fill:none;stroke:currentColor;stroke-width:1.8"')}Clique ou arraste imagens para enviar<small>JPG, PNG, WEBP ou GIF · até 5 MB cada</small><input type="file" accept="image/*" multiple hidden></label><div class="media-grid" id="grid"></div>`;
    const load = async () => {
      const files = await api('/admin/media');
      $('#grid').innerHTML = files.length ? files.map((f) => `
        <div class="media-item"><img src="${esc(f.url)}" alt="" loading="lazy">
          <footer><button data-copy="${esc(f.url)}">Copiar URL</button><button class="del" data-del="${esc(f.name)}">Excluir</button></footer></div>`).join('')
        : `<div class="empty" style="grid-column:1/-1">${I.image}<p>Nenhuma imagem enviada ainda.</p></div>`;
      $$('[data-copy]').forEach((b) => b.onclick = () => { navigator.clipboard?.writeText(location.origin + b.dataset.copy); toast('URL copiada.'); });
      $$('[data-del]').forEach((b) => b.onclick = async () => {
        if (!(await confirmBox('Excluir esta imagem? Artigos que a usam ficarão sem ela.'))) return;
        await api('/admin/media/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' }); toast('Imagem excluída.'); load();
      });
    };
    const dz = $('#dz'), input = $('input', dz);
    const upAll = async (files) => {
      let ok = 0;
      for (const f of files) { try { await uploadFile(f); ok++; } catch (ex) { toast(`${f.name}: ${ex.message}`, 'err'); } }
      if (ok) toast(`${ok} imagem(ns) enviada(s).`);
      load();
    };
    input.onchange = () => upAll([...input.files]);
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('is-over'); };
    dz.ondragleave = () => dz.classList.remove('is-over');
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('is-over'); upAll([...e.dataTransfer.files]); };
    load();
  }

  /* ---------- Contatos (leads) ---------- */
  async function renderLeads() {
    const v = shell('Contatos recebidos', `<button class="btn" id="csv">${I.upload.replace('M12 15V3M7 8l5-5 5 5', 'M12 3v12M7 10l5 5 5-5')}<span class="hide-sm">Exportar CSV</span></button>`);
    const load = async () => {
      const leads = await api('/admin/leads');
      unread = leads.filter((l) => !l.read).length;
      v.innerHTML = `<div class="card">${leads.length ? leads.map((l) => `
        <div class="lead ${l.read ? '' : 'is-new'}">
          <div class="lead__top"><strong>${esc(l.name)}</strong>${l.company ? `<span class="muted">· ${esc(l.company)}</span>` : ''}${l.read ? '' : '<span class="st st--pub">Novo</span>'}
            <span style="flex:1"></span>
            ${l.read ? '' : `<button class="btn btn--sm" data-read="${l.id}">${I.check}Marcar como lido</button>`}
            <button class="btn btn--sm btn--icon btn--danger" data-del="${l.id}" title="Excluir">${I.trash}</button></div>
          ${l.message ? `<p class="lead__msg">${esc(l.message)}</p>` : ''}
          <div class="lead__meta"><a href="mailto:${esc(l.email)}">${esc(l.email)}</a>${l.phone ? `<a href="https://wa.me/55${esc(l.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp: ${esc(l.phone)}</a>` : ''}<span>${fdate(l.created_at, true)}</span></div>
        </div>`).join('') : `<div class="empty">${I.mail}<p>Nenhum contato recebido ainda. Eles chegam pelo formulário do site.</p></div>`}</div>`;
      $$('[data-read]', v).forEach((b) => b.onclick = async () => { await api(`/admin/leads/${b.dataset.read}/read`, { method: 'PUT' }); load(); });
      $$('[data-del]', v).forEach((b) => b.onclick = async () => {
        if (!(await confirmBox('Excluir este contato?'))) return;
        await api('/admin/leads/' + b.dataset.del, { method: 'DELETE' }); toast('Contato excluído.'); load();
      });
      $('#csv').onclick = () => {
        const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
        const csv = '﻿' + ['Nome;E-mail;Telefone;Laboratório;Mensagem;Data', ...leads.map((l) => [l.name, l.email, l.phone, l.company, l.message, fdate(l.created_at, true)].map(q).join(';'))].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `contatos-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      };
    };
    load();
  }

  /* ---------- Depoimentos (moderação) ---------- */
  let tStatus = 'pending';
  async function renderTestimonials() {
    const v = shell('Depoimentos', `<a href="/#reviews" target="_blank" rel="noopener" class="btn">${I.ext}<span class="hide-sm">Ver no site</span></a>`);
    const stars = (n) => `<span class="t-stars" aria-label="${n} de 5">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;

    async function load() {
      const { items, counts } = await api('/admin/testimonials?status=' + tStatus);
      const c = (k) => counts[k] || 0;
      v.innerHTML = `
        <div class="toolbar">
          <div class="seg" id="tSeg">
            ${[['pending', 'Pendentes'], ['approved', 'Publicados'], ['rejected', 'Recusados']].map(([k, l]) =>
              `<button data-s="${k}" class="${tStatus === k ? 'is-active' : ''}">${l} <b class="seg__n">${c(k)}</b></button>`).join('')}
          </div>
          <span class="spacer"></span>
          <span class="muted" style="font-size:13px">Só os <strong>publicados</strong> aparecem no site. Os 6 mais recentes (destaques primeiro) são exibidos.</span>
        </div>
        ${items.length ? `<div class="t-grid">${items.map((t) => `
          <article class="card t-card ${t.featured ? 'is-featured' : ''}">
            <header class="t-card__head">
              <span class="av">${esc(initials(t.name))}</span>
              <div class="t-card__who"><strong>${esc(t.name)}</strong><small>${esc([t.role, t.company].filter(Boolean).join(' · ') || '—')}</small></div>
              ${stars(t.rating)}
            </header>
            <p class="t-card__text">“${esc(t.text)}”</p>
            <footer class="t-card__meta">
              <span>${fdate(t.created_at, true)}</span>
              ${t.email ? `<a href="mailto:${esc(t.email)}">${esc(t.email)}</a>` : ''}
              ${t.featured ? '<span class="st st--pub">★ Destaque</span>' : ''}
            </footer>
            <div class="t-card__actions">
              ${t.status !== 'approved' ? `<button class="btn btn--sm btn--primary" data-act="approved" data-id="${t.id}">${I.check}Aprovar e publicar</button>` : ''}
              ${t.status === 'approved' ? `<button class="btn btn--sm" data-feat="${t.id}" data-v="${t.featured ? 0 : 1}">${I.star}${t.featured ? 'Tirar destaque' : 'Destacar'}</button>` : ''}
              ${t.status !== 'rejected' ? `<button class="btn btn--sm" data-act="rejected" data-id="${t.id}">${I.x}${t.status === 'approved' ? 'Despublicar' : 'Recusar'}</button>` : ''}
              <span class="spacer"></span>
              <button class="btn btn--sm btn--icon" data-edit="${t.id}" title="Editar">${I.edit}</button>
              <button class="btn btn--sm btn--icon btn--danger" data-del="${t.id}" title="Excluir">${I.trash}</button>
            </div>
          </article>`).join('')}</div>`
        : `<div class="card"><div class="empty">${I.star}<p>${tStatus === 'pending' ? 'Nenhum depoimento aguardando aprovação. 🎉' : 'Nada por aqui ainda.'}</p></div></div>`}`;

      $$('#tSeg button', v).forEach((b) => b.onclick = () => { tStatus = b.dataset.s; load(); });
      const put = async (id, body, msg) => {
        try { await api('/admin/testimonials/' + id, { method: 'PUT', body }); toast(msg); load(); refreshBadges(); } catch (ex) { toast(ex.message, 'err'); }
      };
      $$('[data-act]', v).forEach((b) => b.onclick = () => put(b.dataset.id, { status: b.dataset.act },
        b.dataset.act === 'approved' ? 'Depoimento publicado no site!' : 'Depoimento removido do site.'));
      $$('[data-feat]', v).forEach((b) => b.onclick = () => put(b.dataset.feat, { featured: b.dataset.v === '1' },
        b.dataset.v === '1' ? 'Marcado como destaque.' : 'Destaque removido.'));
      $$('[data-del]', v).forEach((b) => b.onclick = async () => {
        if (!(await confirmBox('Excluir este depoimento definitivamente?'))) return;
        try { await api('/admin/testimonials/' + b.dataset.del, { method: 'DELETE' }); toast('Depoimento excluído.'); load(); refreshBadges(); } catch (ex) { toast(ex.message, 'err'); }
      });
      $$('[data-edit]', v).forEach((b) => b.onclick = () => edit(items.find((t) => String(t.id) === b.dataset.edit)));
    }

    function edit(t) {
      const { el, close } = modal({
        title: 'Editar depoimento',
        body: `<div class="rfield-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <label class="fld"><span>Nome</span><input class="inp" name="name" maxlength="80" value="${esc(t.name)}"></label>
            <label class="fld"><span>Nota</span><select class="sel" name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${n === t.rating ? 'selected' : ''}>${'★'.repeat(n)} (${n})</option>`).join('')}</select></label>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <label class="fld"><span>Cargo</span><input class="inp" name="role" maxlength="80" value="${esc(t.role)}"></label>
            <label class="fld"><span>Laboratório</span><input class="inp" name="company" maxlength="100" value="${esc(t.company)}"></label>
          </div>
          <label class="fld"><span>Depoimento</span><textarea class="txt" name="text" maxlength="600" style="min-height:130px">${esc(t.text)}</textarea><small>Corrija apenas erros de digitação — mantenha o sentido original do cliente.</small></label>`,
        foot: `<button class="btn" data-x>Cancelar</button><button class="btn btn--primary" data-ok>Salvar</button>`,
      });
      $('[data-x]', el).onclick = close;
      $('[data-ok]', el).onclick = async (e) => {
        const g = (n) => $(`[name=${n}]`, el).value;
        busy(e.target, true);
        try {
          await api('/admin/testimonials/' + t.id, { method: 'PUT', body: { name: g('name'), rating: g('rating'), role: g('role'), company: g('company'), text: g('text') } });
          close(); toast('Depoimento atualizado.'); load();
        } catch (ex) { toast(ex.message, 'err'); busy(e.target, false); }
      };
    }
    load();
  }

  /* ---------- Cookies (registro de consentimentos — LGPD) ---------- */
  const cState = { choice: '', q: '', page: 1 };
  async function renderConsents() {
    const v = shell('Cookies (LGPD)', `<a class="btn" href="/api/admin/consents/export">${I.download}<span class="hide-sm">Exportar CSV</span></a>`);
    const LABEL = { accept_all: ['Aceitou todos', 'st--pub'], reject_all: ['Recusou', 'st--draft'], custom: ['Personalizou', 'st--sch'] };
    const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
    const browser = (ua = '') => {
      const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Outro';
      const d = /Mobile|Android|iPhone/.test(ua) ? 'celular' : 'computador';
      return `${b} · ${d}`;
    };

    async function load() {
      const qs = new URLSearchParams({ choice: cState.choice, q: cState.q, page: cState.page });
      const d = await api('/admin/consents?' + qs);
      const s = d.stats, t = s.visitors || 0;
      // últimos 30 dias (preenche dias sem registro)
      const map = Object.fromEntries(d.days.map((x) => [x.d, x]));
      const days = [...Array(30)].map((_, i) => { const dt = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10); return { d: dt, n: map[dt]?.n || 0, a: map[dt]?.a || 0 }; });
      const max = Math.max(1, ...days.map((x) => x.n));

      v.innerHTML = `
        <div class="kpis">
          <div class="card kpi kpi--hl"><small>Visitantes que responderam</small><strong>${nf.format(t)}</strong><i>${I.cookie}</i></div>
          <div class="card kpi"><small>Aceitaram todos</small><strong>${pct(s.accept_all || 0, t)}%</strong><em class="kpi__sub">${nf.format(s.accept_all || 0)} visitantes</em></div>
          <div class="card kpi"><small>Recusaram</small><strong>${pct(s.reject_all || 0, t)}%</strong><em class="kpi__sub">${nf.format(s.reject_all || 0)} visitantes</em></div>
          <div class="card kpi"><small>Personalizaram</small><strong>${pct(s.custom || 0, t)}%</strong><em class="kpi__sub">${nf.format(s.custom || 0)} visitantes</em></div>
        </div>
        <div class="grid-2" style="margin-bottom:22px">
          <div class="card"><div class="card__head"><h3>Respostas nos últimos 30 dias</h3><span class="muted" style="font-size:12.5px"><i class="lg lg--a"></i>Aceitou todos <i class="lg lg--b"></i>Outras</span></div>
            <div class="card__body"><div class="c-chart">${days.map((x) => `
              <div class="c-bar" title="${x.d.split('-').reverse().join('/')}: ${x.n} resposta(s), ${x.a} aceitaram todos">
                <span style="height:${(x.n / max) * 100}%"><i style="height:${x.n ? (x.a / x.n) * 100 : 0}%"></i></span>
              </div>`).join('')}</div>
              <div class="c-axis"><span>${days[0].d.split('-').reverse().slice(0, 2).join('/')}</span><span>hoje</span></div>
            </div></div>
          <div class="card"><div class="card__head"><h3>Taxa de permissão por categoria</h3></div>
            <div class="card__body" style="display:grid;gap:18px">
              ${[['Essenciais', 100, 'Sempre ativos'], ['Desempenho', pct(s.analytics || 0, t), `${nf.format(s.analytics || 0)} permitiram`], ['Marketing', pct(s.marketing || 0, t), `${nf.format(s.marketing || 0)} permitiram`]].map(([n, p, sub]) => `
                <div class="c-rate"><div><strong>${n}</strong><small>${sub}</small></div><b>${p}%</b><div class="c-rate__bar"><i style="width:${p}%"></i></div></div>`).join('')}
            </div></div>
        </div>
        <div class="toolbar">
          <input class="inp" id="cq" type="search" placeholder="Buscar pelo código de consentimento..." value="${esc(cState.q)}">
          <span class="spacer"></span>
          <div class="seg" id="cSeg">${[['', 'Todos'], ['accept_all', 'Aceitaram'], ['reject_all', 'Recusaram'], ['custom', 'Personalizaram']].map(([k, l]) => `<button data-c="${k}" class="${cState.choice === k ? 'is-active' : ''}">${l}</button>`).join('')}</div>
        </div>
        <div class="card">
          ${d.items.length ? `<table class="tbl"><thead><tr><th>Código</th><th>Escolha</th><th>Desempenho</th><th>Marketing</th><th>Página</th><th>Navegador</th><th>Data</th></tr></thead><tbody>
            ${d.items.map((r) => `<tr>
              <td><code class="cid" title="${esc(r.consent_id)}">${esc(r.consent_id.slice(0, 8))}</code></td>
              <td><span class="st ${LABEL[r.choice][1]}">${LABEL[r.choice][0]}</span></td>
              <td>${r.analytics ? '✓' : '—'}</td><td>${r.marketing ? '✓' : '—'}</td>
              <td data-hide-sm class="muted">${esc(r.page || '/')}</td>
              <td data-hide-sm class="muted">${esc(browser(r.user_agent))}</td>
              <td class="muted">${fdate(r.created_at, true)}</td></tr>`).join('')}
            </tbody></table>
            ${d.pages > 1 ? `<div class="pager"><button class="btn btn--sm" id="cPrev" ${d.page <= 1 ? 'disabled' : ''}>← Anterior</button><span>Página ${d.page} de ${d.pages} · ${nf.format(d.total)} registros</span><button class="btn btn--sm" id="cNext" ${d.page >= d.pages ? 'disabled' : ''}>Próxima →</button></div>` : ''}`
          : `<div class="empty">${I.cookie}<p>Nenhum consentimento registrado ${cState.q || cState.choice ? 'com esse filtro' : 'ainda. Eles aparecem aqui quando os visitantes respondem ao aviso de cookies'}.</p></div>`}
        </div>
        <p class="muted" style="margin-top:14px;font-size:13px">Cada linha é um comprovante de consentimento. Os percentuais consideram a escolha mais recente de cada visitante. O IP é guardado de forma anonimizada. O visitante vê o próprio código ao clicar em <strong>Cookies</strong> no rodapé do site.</p>`;

      let tm;
      $('#cq', v).oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { cState.q = e.target.value.trim(); cState.page = 1; load().then(() => { const i = $('#cq', v); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350); };
      $$('#cSeg button', v).forEach((b) => b.onclick = () => { cState.choice = b.dataset.c; cState.page = 1; load(); });
      $('#cPrev', v)?.addEventListener('click', () => { cState.page--; load(); });
      $('#cNext', v)?.addEventListener('click', () => { cState.page++; load(); });
    }
    load();
  }

  /* ---------- Páginas legais ---------- */
  async function renderPages() {
    const v = shell('Páginas legais');
    const pages = await api('/admin/pages');
    v.innerHTML = `
      <div class="pages-grid">${pages.map((p) => `
        <a class="card page-card" href="#/paginas/${esc(p.slug)}">
          <span class="page-card__ico">${I.shield}</span>
          <div><strong>${esc(p.title)}</strong><p class="muted">${esc(p.description)}</p>
          <small class="muted">/${esc(p.slug)} · atualizada em ${fdate(p.updated_at)}</small></div>
          <span class="btn btn--sm">${I.edit}Editar</span>
        </a>`).join('')}</div>
      <p class="muted" style="margin-top:16px;font-size:13px">Estes textos são um modelo baseado na LGPD. Recomendamos que um advogado revise antes da publicação oficial.</p>`;
  }

  async function renderPageEditor(slug) {
    const v = shell('Editar página', `
      <span class="save-state" id="saveState">Salvo</span>
      <a class="btn" href="/${esc(slug)}" target="_blank" rel="noopener">${I.eye}<span class="hide-sm">Ver no site</span></a>
      <button class="btn btn--primary" id="saveBtn">${I.check}<span class="hide-sm">Salvar</span></button>`);
    const page = await api('/admin/pages/' + encodeURIComponent(slug));
    v.innerHTML = `
      <div class="editor">
        <div class="editor__main">
          <input class="title-inp" id="title" maxlength="120" value="${esc(page.title)}" placeholder="Título da página">
          <div class="card"><div id="quill"></div></div>
        </div>
        <aside class="editor__side">
          <div class="card"><div class="card__head"><h3>Detalhes</h3></div>
            <div class="card__body">
              <label class="fld"><span>Descrição (topo da página e Google)</span><textarea class="txt" id="desc" maxlength="200">${esc(page.description)}</textarea></label>
              <p class="muted" style="font-size:13px">Endereço: <strong>/${esc(slug)}</strong><br>Última atualização: <strong id="upd">${fdate(page.updated_at, true)}</strong></p>
              <p class="muted" style="font-size:13px">Dica: use <strong>Título 2</strong> para cada seção. Elas aparecem automaticamente no índice lateral da página.</p>
            </div></div>
          <a href="#/paginas" class="btn">← Voltar para páginas</a>
        </aside>
      </div>`;
    await quillReady();
    const quill = new Quill('#quill', {
      theme: 'snow',
      modules: { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link'], ['clean']] },
    });
    quill.clipboard.dangerouslyPasteHTML(page.content);
    const state = $('#saveState');
    const markDirty = () => { dirty = true; state.textContent = 'Alterações não salvas'; state.classList.add('is-dirty'); };
    quill.on('text-change', (d, o, src) => { if (src === 'user') markDirty(); });
    $('#title').addEventListener('input', markDirty);
    $('#desc').addEventListener('input', markDirty);

    async function save() {
      const btn = $('#saveBtn'); busy(btn, true);
      try {
        const saved = await api('/admin/pages/' + encodeURIComponent(slug), { method: 'PUT', body: { title: $('#title').value, description: $('#desc').value, content: quill.root.innerHTML } });
        dirty = false; state.textContent = 'Salvo'; state.classList.remove('is-dirty');
        $('#upd').textContent = fdate(saved.updated_at, true);
        toast('Página atualizada no site.');
      } catch (ex) { toast(ex.message, 'err'); }
      busy(btn, false);
    }
    $('#saveBtn').onclick = save;
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    addEventListener('keydown', onKey);
    cleanup = () => removeEventListener('keydown', onKey);
  }

  /* ---------- Usuários ---------- */
  // Tela única: "Minha conta" (todos) + "Equipe" (só administrador)
  async function renderUsers() {
    const isAdmin = me.role === 'admin';
    const page = shell(isAdmin ? 'Usuários' : 'Minha conta',
      isAdmin ? `<button class="btn btn--primary" id="newUser">${I.plus}<span class="hide-sm">Novo usuário</span></button>` : '');
    page.innerHTML = `
      <h2 class="sec-title">Minha conta</h2>
      <div id="accBox"></div>
      ${isAdmin ? '<h2 class="sec-title">Equipe <small>Quem pode acessar a área restrita</small></h2><div id="teamBox"></div>' : ''}`;
    renderProfile($('#accBox'));
    if (!isAdmin) return;
    const v = $('#teamBox');
    const load = async () => {
      const users = await api('/admin/users');
      v.innerHTML = `<div class="card"><table class="tbl"><thead><tr><th>Usuário</th><th>Perfil</th><th>Último acesso</th><th></th></tr></thead><tbody>
        ${users.map((u) => `<tr><td><div class="post-cell"><span class="av">${esc(initials(u.name))}</span><div><strong>${esc(u.name)}${u.id === me.id ? ' <small class="muted">(você)</small>' : ''}</strong><small>${esc(u.email)}</small></div></div></td>
        <td><span class="st ${u.role === 'admin' ? 'st--pub' : 'st--draft'}">${u.role === 'admin' ? 'Administrador' : 'Editor'}</span></td>
        <td data-hide-sm class="muted">${u.last_login ? fdate(u.last_login, true) : 'Nunca'}</td>
        <td><div class="actions"><button class="btn btn--sm btn--icon" data-edit='${esc(JSON.stringify(u))}' title="Editar">${I.edit}</button>${u.id !== me.id ? `<button class="btn btn--sm btn--icon btn--danger" data-del="${u.id}" title="Remover">${I.trash}</button>` : ''}</div></td></tr>`).join('')}
        </tbody></table></div>
        <p class="muted" style="margin-top:14px;font-size:13px"><strong>Administrador</strong>: acesso total, inclusive usuários. <strong>Editor</strong>: gerencia artigos, categorias, mídia e contatos.</p>`;
      $$('[data-edit]', v).forEach((b) => b.onclick = () => form(JSON.parse(b.dataset.edit)));
      $$('[data-del]', v).forEach((b) => b.onclick = async () => {
        if (!(await confirmBox('Remover este usuário? Os artigos dele serão mantidos.', 'Remover'))) return;
        try { await api('/admin/users/' + b.dataset.del, { method: 'DELETE' }); toast('Usuário removido.'); load(); } catch (ex) { toast(ex.message, 'err'); }
      });
    };
    function form(u = {}) {
      const { el, close } = modal({
        title: u.id ? 'Editar usuário' : 'Novo usuário',
        body: `<label class="fld"><span>Nome completo</span><input class="inp" name="name" value="${esc(u.name || '')}"></label>
          ${u.id ? '' : `<label class="fld"><span>Login</span><input class="inp" name="email" type="text" autocapitalize="none" spellcheck="false" placeholder="ex.: maria ou maria@empresa.com"><small>É o que a pessoa vai digitar para entrar.</small></label>`}
          <label class="fld"><span>Perfil de acesso</span><select class="sel" name="role"><option value="editor">Editor — gerencia o blog</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador — acesso total</option></select></label>
          <label class="fld"><span>${u.id ? 'Nova senha (opcional)' : 'Senha provisória'}</span><input class="inp" name="password" type="text" autocomplete="new-password" placeholder="mínimo 8 caracteres"><small>O usuário deverá trocá-la no primeiro acesso.</small></label>`,
        foot: `<button class="btn" data-x>Cancelar</button><button class="btn btn--primary" data-ok>Salvar</button>`,
      });
      $('[data-x]', el).onclick = close;
      $('[data-ok]', el).onclick = async (e) => {
        const body = { name: $('[name=name]', el).value, role: $('[name=role]', el).value, password: $('[name=password]', el).value };
        if (!u.id) body.email = $('[name=email]', el).value;
        busy(e.target, true);
        try { await api(u.id ? '/admin/users/' + u.id : '/admin/users', { method: u.id ? 'PUT' : 'POST', body }); close(); toast('Usuário salvo.'); load(); }
        catch (ex) { toast(ex.message, 'err'); busy(e.target, false); }
      };
    }
    $('#newUser').onclick = () => form();
    load();
  }

  /* ---------- Minha conta (dados + senha) ---------- */
  function renderProfile(v) {
    v.innerHTML = `
      <div class="grid-2">
        <div class="card"><div class="card__head"><h3>Dados pessoais</h3></div>
          <form class="card__body" id="pf" style="display:grid;gap:14px">
            <label class="fld"><span>Nome</span><input class="inp" name="name" value="${esc(me.name)}"></label>
            <label class="fld"><span>Login</span><input class="inp" value="${esc(me.email)}" disabled></label>
            <button class="btn btn--primary">Salvar dados</button>
          </form></div>
        <div class="card"><div class="card__head"><h3>Trocar senha</h3></div>
          <form class="card__body" id="pw" style="display:grid;gap:14px">
            ${me.must_change ? '<div class="alert alert--warn">Você está usando uma senha provisória. Defina uma nova senha.</div>' : ''}
            <label class="fld"><span>Senha atual</span><input class="inp" name="current" type="password" autocomplete="current-password"></label>
            <label class="fld"><span>Nova senha</span><input class="inp" name="next" type="password" autocomplete="new-password" minlength="8"><small>Mínimo 8 caracteres. Use letras, números e símbolos.</small></label>
            <label class="fld"><span>Confirmar nova senha</span><input class="inp" name="confirm" type="password" autocomplete="new-password"></label>
            <button class="btn btn--primary">Alterar senha</button>
          </form></div>
      </div>`;
    $('#pf').onsubmit = async (e) => {
      e.preventDefault(); const b = $('button', e.target); busy(b, true);
      try { await api('/auth/profile', { method: 'POST', body: { name: e.target.name.value } }); me.name = e.target.name.value; toast('Dados atualizados.'); renderUsers(); }
      catch (ex) { toast(ex.message, 'err'); busy(b, false); }
    };
    $('#pw').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, b = $('button', f);
      if (f.next.value !== f.confirm.value) return toast('As senhas não coincidem.', 'err');
      busy(b, true);
      try { await api('/auth/password', { method: 'POST', body: { current: f.current.value, next: f.next.value } }); me.must_change = 0; toast('Senha alterada com sucesso!'); location.hash = '#/'; }
      catch (ex) { toast(ex.message, 'err'); busy(b, false); }
    };
  }

  /* ---------- Roteador ---------- */
  let cleanup = null;
  async function route() {
    cleanup?.(); cleanup = null;
    const path = location.hash.replace(/^#/, '') || '/';
    if (!me) {
      try { me = (await api('/auth/me')).user; } catch { me = null; }
    }
    $('#boot').classList.add('is-hide');
    if (!me) { if (path !== '/login') history.replaceState(null, '', '#/login'); return renderLogin(); }
    if (path === '/login') { location.hash = '#/'; return; }
    scrollTo(0, 0);
    try {
      let m;
      if (path === '/') await renderDashboard();
      else if (path === '/posts') await renderPosts();
      else if (path === '/posts/novo') await renderEditor(null);
      else if ((m = path.match(/^\/posts\/(\d+)$/))) await renderEditor(m[1]);
      else if (path === '/categorias') await renderCategories();
      else if (path === '/midia') await renderMedia();
      else if (path === '/contatos') await renderLeads();
      else if (path === '/depoimentos') await renderTestimonials();
      else if (path === '/paginas') await renderPages();
      else if (path === '/cookies') await renderConsents();
      else if ((m = path.match(/^\/paginas\/([a-z0-9-]+)$/))) await renderPageEditor(m[1]);
      else if (path === '/usuarios') await renderUsers();
      else if (path === '/perfil') await renderUsers();
      else location.hash = '#/';
    } catch (ex) { if (me) toast(ex.message, 'err'); }
  }

  let lastHash = location.hash;
  addEventListener('hashchange', () => {
    if (dirty && !confirm('Há alterações não salvas. Deseja sair mesmo assim?')) {
      history.replaceState(null, '', lastHash); return;
    }
    dirty = false; lastHash = location.hash; route();
  });
  route();
})();
