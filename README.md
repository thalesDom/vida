# Método Prospera — Carol Pessoa

Site institucional da consultoria **Método Prospera**: estratégia clínica e resultado para negócios da saúde.

**No ar:** https://thalesdom.github.io/vida/

## Estrutura

```
public/
  index.html            página do site
  prospera/
    prospera.css        estilos (creme, verde-sálvia, dourado, rosé)
    prospera.js         animações e interações
    img/                fotos da Carol
docs/                   cópia publicada no GitHub Pages (gerada)
server.js               servidor local para visualizar o site
```

## Ver no computador

```bash
npm install
npm start          # http://localhost:3000
```

## Atualizar o site publicado

```bash
npm run build:pages
git add -A && git commit -m "Atualiza site" && git push
```

## WhatsApp

Os botões usam o número provisório `5500000000000`. Para trocar, substitua esse número em `public/index.html`
(ou gere a versão publicada com `WHATSAPP=55DDDNUMERO npm run build:pages`).
