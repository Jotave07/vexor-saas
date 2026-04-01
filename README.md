# VEXOR Sistemas

Projeto SaaS multi-tenant da VEXOR Sistemas para operacao de e-commerce, painel master, painel da empresa e loja final do comprador.

## Dominio e subdominios

Para publicacao em producao, use subdominios com ponto:

- `vexortech.cloud`: pagina institucional principal
- `nexshop.vexortech.cloud`: loja principal
- `empresa.vexortech.cloud`: loja final de cada cliente
- `nexshop.vexortech.cloud/painel`: entrada unificada do painel

Observacao importante:

- `nexshop@vexortech.cloud` e `empresa@vexortech.cloud` nao sao URLs de site
- `@` serve para email ou sintaxe de autenticacao em URL, nao para hostname publico

## Variaveis de ambiente

Use `.env` ou `.env.mariadb` com base em `.env.mariadb.example`.

Bloco recomendado para producao:

```env
DB_HOST=187.77.54.38
DB_PORT=32768
DB_NAME=Vexor_Ecommerce
DB_USER=VITOR
DB_PASSWORD=v3x0r
API_PORT=3001
APP_DOMAIN=vexortech.cloud
VITE_APP_DOMAIN=vexortech.cloud
FRONTEND_URL=https://nexshop.vexortech.cloud
API_PUBLIC_URL=https://nexshop.vexortech.cloud/api
JWT_SECRET=COLOQUE_UM_SEGREDO_FORTE
APP_ENCRYPTION_KEY=COLOQUE_UMA_CHAVE_FORTE
MASTER_EMAIL=admin@vexor.local
MASTER_PASSWORD=Vexor@123456
```

Observacao para deploy na Hostinger Docker Manager:

- se a plataforma estiver lendo automaticamente o arquivo `.env` do repositorio, mantenha o `.env` alinhado com os mesmos valores do ambiente de producao
- se voce optar por variaveis no painel da Hostinger, elas devem repetir exatamente esse mesmo bloco

## Deploy no VPS

Arquivos prontos no projeto:

- PM2: [ecosystem.config.cjs](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/ecosystem.config.cjs)
- Nginx: [nginx.vexortech.cloud.conf](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/deploy/nginx.vexortech.cloud.conf)
- Docker: [Dockerfile](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/Dockerfile)
- Docker Compose: [docker-compose.yml](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/docker-compose.yml)

Fluxo sugerido:

1. Aponte os DNS `vexortech.cloud` e `*.vexortech.cloud` para o IP do VPS.
2. No VPS, publique o projeto em `/var/www/vexor-saas`.
3. Rode `npm install`.
4. Rode `npm run build`.
5. Configure o Nginx com o arquivo de exemplo em `deploy/nginx.vexortech.cloud.conf`.
6. Inicie a API com `pm2 start ecosystem.config.cjs`.
7. Ative HTTPS com Certbot para `vexortech.cloud` e `*.vexortech.cloud`.

## Deploy via Docker no GitHub

O projeto ja esta preparado para subir por Docker direto do repositorio, sem ajuste de codigo:

- o container compila o frontend
- aplica a migracao do banco ao iniciar
- garante seed inicial do master
- sobe a API e entrega o frontend pelo mesmo processo

Arquivos usados:

- [Dockerfile](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/Dockerfile)
- [docker-compose.yml](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/docker-compose.yml)
- [docker-entrypoint.sh](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/docker-entrypoint.sh)

No servidor, basta:

1. clonar o repositorio
2. definir as variaveis de ambiente no painel da plataforma
3. rodar `docker compose up -d --build`

Depois disso, publique via Nginx reverso apontando para `127.0.0.1:3001`.

## Banco de dados

O projeto usa MariaDB com schema em `database/mariadb/schema.sql`.
