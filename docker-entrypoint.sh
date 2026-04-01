#!/bin/sh
set -e

echo "Aplicando migracao MariaDB..."
node scripts/migrate-mariadb.mjs

echo "Garantindo seed inicial..."
node scripts/seed-master-user.mjs

echo "Iniciando aplicacao VEXOR..."
exec node server/index.mjs
