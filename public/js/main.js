/* Vida — interações do site público */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Preloader ---------- */
  function startPreloader() {
    const pre = $('#preloader');
    if (!pre) { ready(); return; }
    const bar = $('#preloaderBar'), pct = $('#preloaderPct');
    const MIN = reduced ? 200 : 1600, MAX = 5000;
    const t0 = performance.now();
    let loaded = document.readyState === 'complete', shown = 0, done = false;
    addEventListener('load', () => { loaded = true; });

    function tick(now) {
      const elapsed = now - t0;
      // avança até 90% no tempo mínimo; só chega a 100% quando a página terminou de carregar
      const target = loaded && elapsed >= MIN ? 100 : Math.min(90, (elapsed / MIN) * 90);
      shown += (target - shown) * (target === 100 ? 0.18 : 0.08);
      if (target === 100 && shown > 99.4) shown = 100;
      if (elapsed > MAX) shown = 100;
      bar.style.width = shown + '%';
      pct.textContent = Math.round(shown) + '%';
      if (shown >= 100 && !done) {
        done = true;
        setTimeout(() => {
          pre.classList.add('is-done');
          ready();
          setTimeout(() => pre.classList.add('is-gone'), 1500);
        }, 180);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function ready() {
    root.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    $$('.hero [data-count]').forEach(countUp);
  }

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger');
  function onScroll() {
    const y = scrollY;
    if (nav && !nav.classList.contains('is-solid')) nav.classList.toggle('is-scrolled', y > 20);
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = $('#progress'); if (p) p.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    const t = $('#toTop'); if (t) t.classList.toggle('is-visible', y > 900);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    nav?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', closeMenu));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('resize', () => { if (innerWidth > 900) closeMenu(); });

  // link ativo conforme a seção visível
  const sections = $$('main section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    const links = $$('#navLinks a[href^="#"]');
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }

  $('#toTop')?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Reveal ao rolar ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, .steps').forEach((el) => io.observe(el));
  } else {
    $$('.reveal, .steps').forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Contadores ---------- */
  const fmt = new Intl.NumberFormat('pt-BR');
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const dur = reduced ? 1 : 2000, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const v = Math.round(end * (1 - Math.pow(1 - k, 4)));
      el.textContent = fmt.format(v) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Efeitos de ponteiro (apenas desktop) ---------- */
  if (finePointer && !reduced) {
    const glow = $('#cursorGlow');
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      if (glow) glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`;
      requestAnimationFrame(loop);
    })();

    // spotlight nos cards
    $$('.feature').forEach((card) => card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }));

    // botões magnéticos
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    // parallax do mockup do hero
    const hv = $('#heroVisual');
    if (hv) {
      const layers = $$('[data-depth]', hv);
      $('.hero').addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        layers.forEach((l) => { l.style.translate = `${x * 18 * l.dataset.depth}px ${y * 14 * l.dataset.depth}px`; });
      });
    }
  }

  /* ---------- Abas do showcase (troca automática) ---------- */
  const tabs = $$('.tab');
  if (tabs.length) {
    const tabList = $('.tabs');
    let cur = 0, timer;
    $$('.bars > div').forEach((b, i) => b.style.setProperty('--i', i));
    const show = (i, user) => {
      cur = i;
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const pane = $('#' + t.getAttribute('aria-controls'));
        pane.hidden = !on;
        if (on) { pane.classList.add('is-active'); pane.style.animation = 'none'; pane.offsetHeight; pane.style.animation = ''; }
      });
      // reinicia a barrinha de progresso
      const bar = $('.tab__bar', tabs[i]); bar.style.animation = 'none'; bar.offsetHeight; bar.style.animation = '';
      clearTimeout(timer);
      if (!user || !reduced) timer = setTimeout(() => show((cur + 1) % tabs.length), 7000);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i, true));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % tabs.length, true); tabs[cur].focus(); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); tabs[cur].focus(); }
      });
    });
    // pausa quando o mouse está sobre a tela
    const screen = $('.showcase__screen');
    screen?.addEventListener('pointerenter', () => { clearTimeout(timer); tabList.classList.add('is-paused'); });
    screen?.addEventListener('pointerleave', () => { tabList.classList.remove('is-paused'); show(cur); });
    // só começa a girar quando a seção aparece
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { show(0); o.disconnect(); } }, { threshold: .3 }).observe($('#dashboard'));
  }

  /* ---------- Simulador ---------- */
  const range = $('#simRange');
  if (range) {
    const base = 482000, money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    const upd = () => {
      const v = +range.value;
      range.style.setProperty('--val', v + '%');
      $('#simPct').textContent = v + '%';
      $('#simBase').textContent = money.format(base);
      $('#simGain').textContent = '+' + money.format(base * v / 100 * 0.7);
    };
    range.addEventListener('input', upd); upd();
  }

  /* ---------- Blog na landing ---------- */
  const bp = $('#blogPreview');
  if (bp) {
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const date = (s) => { const d = new Date(s.replace(' ', 'T') + 'Z'); return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
    fetch('/api/posts?limit=3')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ items }) => {
        if (!items.length) { $('#blog').remove(); return; }
        bp.innerHTML = items.map((p, i) => `
          <article class="post-card reveal" style="--rd:${i * 0.1}s">
            <a href="/blog/${esc(p.slug)}" class="post-card__media" tabindex="-1" aria-hidden="true">
              ${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : `<div class="post-card__ph"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M4 32l14-14 10 8 18-20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="6" r="4" fill="#bef264"/></svg><em>${esc(p.category || 'Blog')}</em></div>`}
            </a>
            <div class="post-card__body">
              <div class="post-meta">${p.category ? `<a class="chip" href="/blog/categoria/${esc(p.category_slug)}">${esc(p.category)}</a>` : ''}<span>${date(p.published_at)}</span><span>·</span><span>${p.reading_time} min</span></div>
              <h3><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h3>
              <p>${esc(p.excerpt)}</p>
              <a href="/blog/${esc(p.slug)}" class="link-arrow">Ler artigo <span aria-hidden="true">→</span></a>
            </div>
          </article>`).join('');
        requestAnimationFrame(() => $$('.post-card', bp).forEach((c) => setTimeout(() => c.classList.add('is-in'), 50)));
      })
      .catch(() => $('#blog')?.remove());
  }

  /* ---------- Formulário de contato ---------- */
  const form = $('#contactForm');
  if (form) {
    const phone = $('[data-mask="phone"]', form);
    phone?.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      phone.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
        : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
        : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('.form__msg', form), btn = $('button[type=submit]', form);
      const data = Object.fromEntries(new FormData(form));
      let ok = true;
      $$('.field', form).forEach((f) => f.classList.remove('is-invalid'));
      if ((data.name || '').trim().length < 2) { form.name.closest('.field').classList.add('is-invalid'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) { form.email.closest('.field').classList.add('is-invalid'); ok = false; }
      if (!ok) { msg.className = 'form__msg is-err'; msg.textContent = 'Preencha nome e e-mail válidos.'; return; }
      btn.disabled = true; btn.classList.add('is-sending'); msg.textContent = '';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Não foi possível enviar.');
        form.reset();
        msg.className = 'form__msg is-ok'; msg.textContent = '✓ Recebemos sua mensagem! Entraremos em contato em breve.';
      } catch (err) {
        msg.className = 'form__msg is-err'; msg.textContent = err.message || 'Erro de conexão. Tente novamente.';
      } finally {
        btn.disabled = false; btn.classList.remove('is-sending');
      }
    });
  }

  /* ---------- Depoimentos: lista vinda do painel ---------- */
  const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const grid = $('#reviewsGrid');
  if (grid) {
    fetch('/api/testimonials').then((r) => r.ok ? r.json() : Promise.reject()).then(({ items, total, avg }) => {
      if (!items.length) return;
      const ini = (n) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
      grid.innerHTML = items.slice(0, 6).map((t, i) => `
        <figure class="review${t.featured ? ' review--hl' : ''} reveal is-in" style="--rd:${(i % 3) * 0.1}s">
          <div class="stars" aria-label="${t.rating} de 5 estrelas">${'★'.repeat(t.rating)}<span style="opacity:.25">${'★'.repeat(5 - t.rating)}</span></div>
          <blockquote>“${escH(t.text)}”</blockquote>
          <figcaption><span class="avatar">${escH(ini(t.name))}</span><div><strong>${escH(t.name)}</strong><span>${escH([t.role, t.company].filter(Boolean).join(' · '))}</span></div></figcaption>
        </figure>`).join('');
      const sum = $('#ratingSum');
      if (sum && total) {
        $('#ratingAvg').textContent = Number(avg).toFixed(1).replace('.', ',');
        $('#ratingTotal').textContent = total;
        $('#ratingFill').style.width = (avg / 5 * 100) + '%';
        sum.hidden = false;
      }
    }).catch(() => {});
  }

  /* ---------- Modal "Deixar meu depoimento" ---------- */
  const rm = $('#reviewModal');
  if (rm) {
    const form = $('#reviewForm', rm), okBox = $('.rmodal__ok', rm), err = $('.rmodal__err', rm);
    const labels = { 1: 'Ruim', 2: 'Regular', 3: 'Bom', 4: 'Muito bom', 5: 'Excelente! 🎉' };
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      form.hidden = false; okBox.hidden = true; err.hidden = true;
      rm.hidden = false; rm.classList.remove('is-closing');
      root.classList.add('modal-open');
      setTimeout(() => $('.rmodal__box', rm).focus({ preventScroll: true }), 50);
    };
    const close = () => {
      if (rm.hidden || rm.classList.contains('is-closing')) return;
      rm.classList.add('is-closing');
      setTimeout(() => { rm.hidden = true; rm.classList.remove('is-closing'); root.classList.remove('modal-open'); lastFocus?.focus?.(); }, reduced ? 0 : 280);
    };
    $('#openReview')?.addEventListener('click', open);
    $$('[data-close]', rm).forEach((b) => b.addEventListener('click', close));
    addEventListener('keydown', (e) => {
      if (rm.hidden) return;
      if (e.key === 'Escape') close();
      // mantém o foco dentro do modal
      if (e.key === 'Tab') {
        const f = $$('button, a, input:not([type=hidden]):not(.hp), textarea', rm).filter((el) => el.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $$('input[name=rating]', rm).forEach((r) => r.addEventListener('change', () => {
      $('#rateLabel').textContent = labels[r.value]; $('.rate', rm).classList.remove('is-invalid');
    }));
    const ta = form.text, cnt = $('#rCount');
    ta.addEventListener('input', () => { cnt.textContent = `${ta.value.length}/600`; });
    const clearErr = (e) => { e.target.closest('.rfield, .rcheck')?.classList.remove('is-invalid'); err.hidden = true; };
    form.addEventListener('input', clearErr);
    form.addEventListener('change', clearErr);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      d.consent = form.consent.checked;
      const bad = [];
      if (!d.rating) { $('.rate', rm).classList.add('is-invalid'); bad.push('Escolha uma nota de 1 a 5 estrelas.'); }
      if ((d.name || '').trim().length < 2) { form.name.closest('.rfield').classList.add('is-invalid'); bad.push('Informe seu nome.'); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) { form.email.closest('.rfield').classList.add('is-invalid'); bad.push('Informe um e-mail válido.'); }
      if ((d.text || '').trim().length < 20) { ta.closest('.rfield').classList.add('is-invalid'); bad.push('Escreva pelo menos 20 caracteres no depoimento.'); }
      if (!d.consent) { form.consent.closest('.rcheck').classList.add('is-invalid'); bad.push('Autorize a publicação para continuar.'); }
      if (bad.length) { err.textContent = bad[0]; err.hidden = false; return; }

      const btn = $('button[type=submit]', form);
      btn.disabled = true; btn.classList.add('is-sending'); err.hidden = true;
      try {
        const r = await fetch('/api/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Não foi possível enviar. Tente novamente.');
        form.reset(); cnt.textContent = '0/600'; $('#rateLabel').textContent = 'Toque nas estrelas';
        form.hidden = true; okBox.hidden = false;
        $('button', okBox).focus();
      } catch (ex) {
        err.textContent = ex.message || 'Erro de conexão. Tente novamente.'; err.hidden = false;
      } finally {
        btn.disabled = false; btn.classList.remove('is-sending');
      }
    });
  }

  /* ---------- Copiar link (artigo) ---------- */
  function toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('is-show'));
    setTimeout(() => { t.classList.remove('is-show'); setTimeout(() => t.remove(), 400); }, 2200);
  }
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Link copiado!'); } catch { toast(b.dataset.copy); }
  }));

  /* ---------- Índice das páginas legais: destaca a seção em leitura ---------- */
  const tocLinks = $$('.legal-toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const heads = tocLinks.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const to = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) tocLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + en.target.id));
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    heads.forEach((h) => to.observe(h));
  }

  /* ---------- Consentimento de cookies (LGPD) ---------- */
  // A escolha fica salva no navegador (localStorage + cookie "vida_consent", 180 dias).
  // Outros scripts (ex.: Google Analytics) devem checar window.vidaConsent.has('analytics')
  // ou ouvir o evento "vida:consent" antes de carregar.
  const CONSENT_KEY = 'vida_consent_v1';
  const readConsent = () => {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch { return null; }
  };
  // código anônimo do visitante — serve de comprovante de consentimento
  const consentId = () => {
    let id = readConsent()?.id;
    if (!id) id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
    return id;
  };
  const writeConsent = (prefs) => {
    const data = { ...prefs, necessary: true, id: consentId(), date: new Date().toISOString() };
    // registra no servidor (aparece na área restrita → Cookies)
    try {
      fetch('/api/consent', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_id: data.id, analytics: !!data.analytics, marketing: !!data.marketing, page: location.pathname }),
      }).catch(() => {});
    } catch { /* sem rede */ }
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch { /* modo privado */ }
    const val = ['necessary', data.analytics && 'analytics', data.marketing && 'marketing'].filter(Boolean).join('.');
    document.cookie = `vida_consent=${val}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('vida:consent', { detail: data }));
    return data;
  };
  window.vidaConsent = { get: readConsent, has: (k) => k === 'necessary' || !!readConsent()?.[k] };

  const COOKIE_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><path class="ck-body" d="M24 4a20 20 0 1019.6 16.2 5.5 5.5 0 01-6.9-5.4 5.5 5.5 0 01-6.8-6.9A20 20 0 0124 4z"/><circle class="ck-chip" cx="16" cy="18" r="2.6"/><circle class="ck-chip" cx="28" cy="27" r="3"/><circle class="ck-chip" cx="17" cy="31" r="2.2"/><circle class="ck-chip" cx="33" cy="36" r="1.8"/><circle class="ck-crumb" cx="40" cy="9" r="1.6"/><circle class="ck-crumb" cx="44" cy="14" r="1"/></svg>`;

  function cookieBanner(openPrefs = false) {
    if ($('#ckBanner')) return;
    const saved = readConsent() || {};
    const el = document.createElement('section');
    el.id = 'ckBanner';
    el.className = 'ck';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'ckTitle');
    el.setAttribute('aria-describedby', 'ckDesc');
    el.innerHTML = `
      <div class="ck__main">
        <div class="ck__icon">${COOKIE_SVG}</div>
        <div class="ck__txt">
          <strong id="ckTitle">Sua privacidade importa 🍪</strong>
          <p id="ckDesc">Usamos cookies para o site funcionar bem, entender como ele é usado e melhorar sua experiência. Você escolhe o que aceitar. <a href="/privacidade">Saiba mais</a></p>
        </div>
      </div>
      <div class="ck__prefs" id="ckPrefs" ${openPrefs ? '' : 'hidden'}>
        <label class="ck-opt">
          <span class="ck-opt__txt"><b>Essenciais</b><small>Necessários para segurança e funcionamento. Sempre ativos.</small></span>
          <span class="ck-switch is-locked"><input type="checkbox" checked disabled><i></i></span>
        </label>
        <label class="ck-opt">
          <span class="ck-opt__txt"><b>Desempenho</b><small>Estatísticas anônimas de visitas para melhorar o site.</small></span>
          <span class="ck-switch"><input type="checkbox" name="analytics" ${saved.analytics ? 'checked' : ''}><i></i></span>
        </label>
        <label class="ck-opt">
          <span class="ck-opt__txt"><b>Marketing</b><small>Conteúdos e anúncios mais relevantes para você.</small></span>
          <span class="ck-switch"><input type="checkbox" name="marketing" ${saved.marketing ? 'checked' : ''}><i></i></span>
        </label>
        ${saved.id ? `<p class="ck__id">Seu código de consentimento: <code>${saved.id.slice(0, 8)}</code></p>` : ''}
      </div>
      <div class="ck__actions">
        <button type="button" class="ck-btn ck-btn--link" data-ck="prefs">${openPrefs ? 'Salvar escolhas' : 'Personalizar'}</button>
        <span class="ck__spacer"></span>
        <button type="button" class="ck-btn ck-btn--ghost" data-ck="reject">Recusar</button>
        <button type="button" class="ck-btn ck-btn--primary" data-ck="accept">Aceitar todos</button>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('has-ck');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));

    const prefs = $('#ckPrefs', el), prefBtn = $('[data-ck=prefs]', el);
    const close = (data) => {
      writeConsent(data);
      el.classList.remove('is-in'); el.classList.add('is-out');
      document.body.classList.remove('has-ck');
      setTimeout(() => el.remove(), 500);
    };
    $('[data-ck=accept]', el).onclick = () => close({ analytics: true, marketing: true });
    $('[data-ck=reject]', el).onclick = () => close({ analytics: false, marketing: false });
    prefBtn.onclick = () => {
      if (prefs.hidden) { prefs.hidden = false; prefBtn.textContent = 'Salvar escolhas'; el.classList.add('is-open'); return; }
      close({ analytics: $('[name=analytics]', el).checked, marketing: $('[name=marketing]', el).checked });
    };
    if (openPrefs) el.classList.add('is-open');
  }

  // link "Cookies" do rodapé reabre as preferências
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cookie-prefs]');
    if (!a) return;
    e.preventDefault();
    $('#ckBanner')?.remove();
    cookieBanner(true);
  });

  if (!readConsent()) {
    // na home espera o preloader terminar; nas outras páginas aparece logo
    const delay = $('#preloader') ? 2600 : 900;
    setTimeout(() => cookieBanner(false), delay);
  }

  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  startPreloader();
})();
