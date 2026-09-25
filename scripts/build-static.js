'use strict';
// Gera a versão do GitHub Pages (pasta docs/) a partir do site em public/.
// Uso: npm run build:pages   (opcional: WHATSAPP=5511999999999 npm run build:pages)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'docs');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(PUB, OUT);
if (process.env.WHATSAPP) {
  const f = path.join(OUT, 'index.html');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replaceAll('5500000000000', process.env.WHATSAPP));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('✔ Site gerado em docs/ para o GitHub Pages');
