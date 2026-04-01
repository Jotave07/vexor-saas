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

Use `.env.mariadb` com base em `.env.mariadb.example`.

Campos importantes para producao:

- `APP_DOMAIN=vexortech.cloud`
- `VITE_APP_DOMAIN=vexortech.cloud`
- `FRONTEND_URL=https://nexshop.vexortech.cloud`
- `API_PUBLIC_URL=https://nexshop.vexortech.cloud/api`

## Deploy no VPS

Arquivos prontos no projeto:

- PM2: [ecosystem.config.cjs](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/ecosystem.config.cjs)
- Nginx: [nginx.vexortech.cloud.conf](/c:/Users/ADM/Desktop/E-commerce/vexor-saas/deploy/nginx.vexortech.cloud.conf)

Fluxo sugerido:

1. Aponte os DNS `vexortech.cloud` e `*.vexortech.cloud` para o IP do VPS.
2. No VPS, publique o projeto em `/var/www/vexor-saas`.
3. Rode `npm install`.
4. Rode `npm run build`.
5. Configure o Nginx com o arquivo de exemplo em `deploy/nginx.vexortech.cloud.conf`.
6. Inicie a API com `pm2 start ecosystem.config.cjs`.
7. Ative HTTPS com Certbot para `vexortech.cloud` e `*.vexortech.cloud`.

## Banco de dados

O projeto usa MariaDB com schema em `database/mariadb/schema.sql`.
