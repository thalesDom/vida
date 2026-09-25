# Vida — Site premium + Blog com área restrita

Site institucional (verde e branco, responsivo e animado) com blog e painel administrativo para publicar artigos.

## Como rodar no seu computador

Requisito: **Node.js 22.5 ou mais novo**.

```bash
npm install
npm start
```

- Site: http://localhost:3000
- Blog: http://localhost:3000/blog
- **Área restrita:** http://localhost:3000/admin

Primeiro acesso: login `vida` / senha `Troque@123`. O painel pede para trocar a senha.

## Configuração (`.env`)

Copie `.env.example` para `.env` e ajuste: WhatsApp, e-mail, domínio (`SITE_URL`) e o admin inicial.
O admin do `.env` só é criado no **primeiro** start, quando o banco ainda está vazio.

## O que tem no painel (/admin)

| Área | O que faz |
|---|---|
| Visão geral | Visualizações, publicados, rascunhos, agendados, contatos e os artigos mais lidos |
| Artigos | Busca, filtro por status e categoria, duplicar, excluir, pré-visualizar |
| Editor | Editor visual (títulos, listas, citações, links, imagens, vídeos do YouTube), capa por arrastar e soltar, slug, tags, destaque, **agendamento**, SEO com prévia do Google, salvar com Ctrl+S, aviso de alterações não salvas |
| Categorias | Criar, editar e excluir |
| Biblioteca de mídia | Enviar várias imagens, copiar URL, excluir |
| Contatos | Mensagens do formulário do site, marcar como lido, exportar CSV (Excel) |
| Usuários | Perfis Administrador e Editor (só o admin acessa) |
| Meu perfil | Nome e troca de senha |

## Segurança

- Senhas com bcrypt; sessão em cookie `httpOnly` + `SameSite=strict`, assinado com HMAC
- Trocar a senha encerra as sessões antigas
- Limite de tentativas de login (10 a cada 15 min) e no formulário de contato, que também tem honeypot anti-spam
- O HTML dos artigos é sanitizado (bloqueia scripts e XSS)
- Uploads: só JPG/PNG/WEBP/GIF de até 5 MB, com checagem da assinatura real do arquivo
- Cabeçalhos de segurança (Helmet + CSP); `/admin` e `/api` ficam fora do Google

## SEO

Blog renderizado no servidor, com título, descrição, Open Graph e JSON-LD em cada artigo, além de `/sitemap.xml`, `/rss.xml` e `/robots.txt`.

## Estrutura

```
server.js           servidor Express (rotas do blog, sitemap, RSS)
src/api.js          API pública + API do painel
src/auth.js         sessão/login
src/db.js           banco SQLite (criado sozinho em data/site.db) + dados iniciais
src/views.js        páginas do blog (HTML gerado no servidor)
public/index.html   landing page
public/css, js      estilos e animações do site
public/admin/       painel administrativo
uploads/            imagens enviadas pelo painel
data/               banco de dados (FAÇA BACKUP desta pasta e da uploads/)
```

## Publicar (hospedagem)

Precisa de hospedagem com **Node.js**: VPS (Hostinger VPS, DigitalOcean, Contabo), Render, Railway ou um cPanel com "Setup Node.js App".
Hospedagem compartilhada só com PHP **não** roda este projeto.

1. Envie os arquivos (sem `node_modules`)
2. Crie o `.env` com `NODE_ENV=production` e o `SITE_URL` do seu domínio
3. `npm install --omit=dev` e depois `npm start` (em VPS, use `pm2 start npm --name site -- start`)
4. Coloque HTTPS na frente (Nginx + Let's Encrypt, ou o SSL do próprio provedor)
5. Mantenha as pastas `data/` e `uploads/` em disco persistente e faça backup delas

Falta uma imagem de compartilhamento: salve uma de 1200×630 em `public/img/og.png`.
