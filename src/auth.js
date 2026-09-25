'use strict';
// Sessão stateless com token assinado (HMAC-SHA256) em cookie httpOnly.
// token_version no usuário permite invalidar todas as sessões (troca de senha / logout global).
const crypto = require('crypto');
const config = require('./config');
const db = require('./db');

const COOKIE = 'sd_session';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', config.secret).update(data).digest('base64url');

function createToken(user) {
  const payload = b64(JSON.stringify({ uid: user.id, v: user.token_version, exp: Date.now() + MAX_AGE }));
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    const user = db.prepare(
      'SELECT id, name, email, role, must_change, token_version FROM users WHERE id=?'
    ).get(data.uid);
    if (!user || user.token_version !== data.v) return null;
    return user;
  } catch { return null; }
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function setSession(res, user) {
  res.cookie(COOKIE, createToken(user), {
    httpOnly: true, sameSite: 'strict', secure: config.isProd, maxAge: MAX_AGE, path: '/',
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

// Middleware: exige login. Para métodos que alteram dados, exige também o header
// X-Requested-With (proteção extra contra CSRF, além do cookie SameSite=strict).
function requireAuth(req, res, next) {
  const user = verifyToken(parseCookies(req)[COOKIE]);
  if (!user) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({ error: 'Requisição inválida.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores.' });
  next();
}

function currentUser(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}

module.exports = { setSession, clearSession, requireAuth, requireAdmin, currentUser };
