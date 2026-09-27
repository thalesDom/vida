/* Método Prospera — interações */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Preloader */
  const pre = $('#pre'), bar = $('#preBar'), t0 = performance.now();
  let loaded = document.readyState === 'complete';
  addEventListener('load', () => { loaded = true; });
  (function tick() {
    const el = performance.now() - t0, min = reduced ? 200 : 1700;
    const pct = loaded && el > min ? 100 : Math.min(92, (el / min) * 92);
    bar.style.width = pct + '%';
    if (pct >= 100 || el > 5000) {
      setTimeout(() => {
        pre.classList.add('is-done');
        root.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        $$('.hero [data-count]').forEach(count);
        setTimeout(() => pre.remove(), 1300);
      }, 200);
      return;
    }
    requestAnimationFrame(tick);
  })();

  /* Navegação */
  const nav = $('#nav'), burger = $('#burger');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }));

  /* Voltar ao topo: aparece ao rolar e mostra o progresso da página */
  const top = $('#toTop'), prog = $('#toTopProg');
  if (top) {
    const C = 2 * Math.PI * 24;
    prog.style.strokeDasharray = C;
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const k = max > 0 ? scrollY / max : 0;
      prog.style.strokeDashoffset = C * (1 - k);
      top.classList.toggle('is-visible', scrollY > innerHeight * .6);
    };
    addEventListener('scroll', upd, { passive: true }); upd();
    top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  /* Revelar ao rolar, em cascata */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -60px 0px' });
  // imagens recortadas (clip-path) não são detectadas: observa o contêiner e revela a imagem
  const imgIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    $$('.reveal-img', e.target).forEach((im) => im.classList.add('is-in'));
    imgIO.unobserve(e.target);
  }), { threshold: .2 });
  $$('.reveal-img').forEach((im) => imgIO.observe(im.parentElement));
  $$('.rv').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('rv'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 8) * 0.08}s`);
    io.observe(el);
  });

  ['#timeline', '#stairs'].forEach((sel) => { const el = $(sel); if (el) io.observe(el); });
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* Contadores */
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = +el.dataset.count, s = performance.now(), dur = reduced ? 1 : 1800;
    (function step(n) {
      const k = Math.min(1, (n - s) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 4)))).padStart(+el.dataset.pad || 1, '0');
      if (k < 1) requestAnimationFrame(step);
    })(s);
  }

  /* Botão magnético e leve parallax na foto (só com mouse) */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    const vis = $('.hero__visual');
    $('.hero').addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      vis.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
      $$('.float-card', vis).forEach((c, i) => { c.style.transform = `translate(${x * (18 + i * 10)}px, ${y * (14 + i * 8)}px)`; });
    });
  }
})();
