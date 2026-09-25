'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Carrega .env simples (sem dependência extra)
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });

// Segredo de sessão: usa SESSION_SECRET ou gera um e guarda em data/.secret
function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const f = path.join(dataDir, '.secret');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  const s = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
}

module.exports = {
  root,
  port: Number(process.env.PORT) || 3000,
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  siteName: process.env.SITE_NAME || 'SD Vendas',
  whatsapp: process.env.WHATSAPP || '5500000000000',
  contactEmail: process.env.CONTACT_EMAIL || 'contato@sdvendasbi.com.br',
  appUrl: process.env.APP_URL || 'https://app.sdvendas.com.br',
  dbFile: path.join(dataDir, 'site.db'),
  uploadsDir: path.join(root, 'uploads'),
  secret: getSecret(),
  isProd: process.env.NODE_ENV === 'production',
  adminEmail: process.env.ADMIN_EMAIL || 'vida',
  adminPassword: process.env.ADMIN_PASSWORD || 'Troque@123',
};
