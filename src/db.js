'use strict';
// Banco SQLite nativo do Node (node:sqlite) — sem dependências nativas para compilar.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');
const { slugify } = require('./utils');

fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
const db = new DatabaseSync(config.dbFile);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor')),
    must_change   INTEGER NOT NULL DEFAULT 0,
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    last_login    TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    excerpt         TEXT DEFAULT '',
    content         TEXT DEFAULT '',
    cover           TEXT DEFAULT '',
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    author_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tags            TEXT DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    featured        INTEGER NOT NULL DEFAULT 0,
    seo_title       TEXT DEFAULT '',
    seo_description TEXT DEFAULT '',
    views           INTEGER NOT NULL DEFAULT 0,
    reading_time    INTEGER NOT NULL DEFAULT 1,
    published_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_posts_status_pub ON posts(status, published_at);
  CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);

  CREATE TABLE IF NOT EXISTS leads (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT DEFAULT '',
    company    TEXT DEFAULT '',
    message    TEXT DEFAULT '',
    read       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    role       TEXT DEFAULT '',
    company    TEXT DEFAULT '',
    email      TEXT DEFAULT '',
    rating     INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    text       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    featured   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);

  CREATE TABLE IF NOT EXISTS consents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    consent_id  TEXT NOT NULL,
    choice      TEXT NOT NULL CHECK (choice IN ('accept_all','reject_all','custom')),
    analytics   INTEGER NOT NULL DEFAULT 0,
    marketing   INTEGER NOT NULL DEFAULT 0,
    page        TEXT DEFAULT '',
    user_agent  TEXT DEFAULT '',
    ip_hash     TEXT DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_consents_cid ON consents(consent_id);
  CREATE INDEX IF NOT EXISTS idx_consents_date ON consents(created_at);

  CREATE TABLE IF NOT EXISTS pages (
    slug        TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    content     TEXT DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------- Seed inicial ----------
function seed() {
  const hasUser = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (!hasUser) {
    const hash = bcrypt.hashSync(config.adminPassword, 12);
    db.prepare(
      'INSERT INTO users (name, email, password_hash, role, must_change) VALUES (?,?,?,?,1)'
    ).run('Administrador', config.adminEmail, hash, 'admin');
    console.log(`\n  ✔ Usuário admin criado: ${config.adminEmail} / ${config.adminPassword}`);
    console.log('    (troque a senha no primeiro acesso)\n');
  }

  const hasCat = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  if (!hasCat) {
    const ins = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?,?,?)');
    [
      ['Gestão Comercial', 'Estratégia, metas e performance de equipes de campo.'],
      ['Visitação Médica', 'Boas práticas de relacionamento com prescritores.'],
      ['Dados & BI', 'Indicadores, dashboards e decisões baseadas em dados.'],
      ['Novidades', 'Atualizações da plataforma e do mercado.'],
    ].forEach(([n, d]) => ins.run(n, slugify(n), d));
  }

  const hasPost = db.prepare('SELECT COUNT(*) AS n FROM posts').get().n;
  if (!hasPost) {
    const admin = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
    const cat = (slug) => db.prepare('SELECT id FROM categories WHERE slug=?').get(slug)?.id ?? null;
    const ins = db.prepare(`INSERT INTO posts
      (title, slug, excerpt, content, category_id, author_id, tags, status, featured, reading_time, published_at)
      VALUES (?,?,?,?,?,?,?,'published',?,?,datetime('now', ?))`);
    const samples = [
      {
        t: 'Como reduzir o churn de médicos prescritores em 90 dias',
        e: 'Um plano prático para identificar sinais de queda, priorizar visitas e recuperar prescritores antes que eles migrem para a concorrência.',
        c: 'visitacao-medica', tags: 'churn,prescritores,retenção', f: 1, off: '-1 days',
        body: `<p>Perder um prescritor raramente acontece de uma vez. Os sinais aparecem semanas antes: queda no volume de exames, intervalos maiores entre pedidos e menor ticket médio.</p>
<h2>1. Monitore a curva de cada prescritor</h2>
<p>Compare o faturamento de cada médico mês a mês, considerando apenas os meses com visita realizada. Uma queda superior a 20% já merece atenção.</p>
<h2>2. Priorize por potencial, não por proximidade</h2>
<p>Use um <strong>score de oportunidade</strong> que combine categoria (A, B, C), volume de exames e receita. Assim a rota do representante passa primeiro por quem mais importa.</p>
<blockquote>O melhor momento para recuperar um prescritor é antes que ele perceba que foi embora.</blockquote>
<h2>3. Feche o ciclo com check-in</h2>
<ul><li>Registre a visita no mesmo dia;</li><li>Anote objeções e próximos passos;</li><li>Reavalie o indicador no mês seguinte.</li></ul>
<p>Com disciplina e dados, é possível reverter a maioria dos casos em até 90 dias.</p>`,
      },
      {
        t: '5 indicadores que todo gestor de laboratório deveria acompanhar',
        e: 'Ticket médio, taxa de cobertura, LTV por prescritor e mais: os KPIs que separam laboratórios que crescem dos que apenas sobrevivem.',
        c: 'dados-bi', tags: 'kpi,bi,gestão', f: 0, off: '-4 days',
        body: `<p>Dados só geram valor quando viram decisão. Estes são os cinco indicadores que recomendamos acompanhar semanalmente.</p>
<h2>1. Ticket médio por visita</h2><p>Mostra quanto cada visita realizada gera em faturamento.</p>
<h2>2. Taxa de cobertura da carteira</h2><p>Percentual de médicos da carteira visitados no período.</p>
<h2>3. LTV por prescritor</h2><p>Valor acumulado gerado por cada médico ao longo do relacionamento.</p>
<h2>4. Meta x realizado</h2><p>Comparativo entre visitas planejadas e executadas.</p>
<h2>5. Evolução de faturamento</h2><p>Tendência mensal com projeção para os próximos meses.</p>`,
      },
      {
        t: 'Rota otimizada: como sua equipe de campo pode ganhar 2 horas por dia',
        e: 'Planejamento de rota inteligente, check-in rápido e compartilhamento por WhatsApp — o tripé da produtividade no campo.',
        c: 'gestao-comercial', tags: 'rota,produtividade,equipe', f: 0, off: '-9 days',
        body: `<p>Equipes de campo gastam boa parte do dia em deslocamento e planejamento manual. Uma rota otimizada muda esse jogo.</p>
<h2>Planeje pela prioridade</h2><p>Comece pelos prescritores com alerta de churn e maior potencial.</p>
<h2>Agrupe por região</h2><p>Reduza deslocamentos agrupando visitas próximas no mesmo turno.</p>
<h2>Compartilhe e registre</h2><p>Envie a rota pelo WhatsApp e faça o check-in direto do celular.</p>`,
      },
    ];
    for (const s of samples) {
      ins.run(s.t, slugify(s.t), s.e, s.body, cat(s.c), admin.id, s.tags, s.f, 4, s.off);
    }
  }

  // Depoimentos iniciais (já aprovados)
  if (!db.prepare('SELECT COUNT(*) AS n FROM testimonials').get().n) {
    const insT = db.prepare(`INSERT INTO testimonials (name, role, company, rating, text, status, featured) VALUES (?,?,?,5,?,'approved',?)`);
    insT.run('Carlos Eduardo', 'Gestor Comercial', 'Lab. São Lucas', 'O CRM com rota otimizada reduziu o tempo de planejamento da nossa equipe de campo em 60%. Os alertas de churn salvaram contratos importantes.', 0);
    insT.run('Mariana Fontes', 'Diretora de Operações', 'Lab. Central Plus', 'O cockpit de inteligência da IA é surpreendente. Identifica padrões que levariam semanas para ver manualmente. Indispensável.', 1);
    insT.run('Roberto Meira', 'Representante Técnico', 'Lab. Vida', 'O check-in rápido e o compartilhamento de rota por WhatsApp tornaram meu dia a dia muito mais ágil. Recomendo.', 0);
  }

  // Páginas legais (só cria as que ainda não existem — não sobrescreve edições)
  const legal = require('./legal')(config);
  const insPage = db.prepare('INSERT OR IGNORE INTO pages (slug, title, description, content) VALUES (?,?,?,?)');
  for (const [slug, p] of Object.entries(legal)) insPage.run(slug, p.title, p.description, p.content.trim());
}
seed();

module.exports = db;
