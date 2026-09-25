'use strict';
// Servidor local simples do site Método Prospera (Carol Pessoa).
// Uso: npm start  →  http://localhost:3000
const express = require('express');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const app = express();
app.disable('x-powered-by');

// endereços antigos levam à página inicial
app.get(['/v2', '/v2/*', '/prospera', '/prospera/index.html', '/admin', '/admin/*', '/blog', '/blog/*'], (req, res) => res.redirect(301, '/'));

app.use(express.static(PUBLIC, { extensions: ['html'] }));
app.use((req, res) => res.redirect(302, '/'));

app.listen(PORT, () => console.log(`\n  Método Prospera rodando em http://localhost:${PORT}\n`));
