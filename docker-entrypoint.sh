#!/bin/sh
set -e

echo "Iniciando bootstrap VEXOR..."
echo "DB_HOST=${DB_HOST:-<vazio>}"
echo "DB_PORT=${DB_PORT:-<vazio>}"
echo "DB_NAME=${DB_NAME:-<vazio>}"
echo "DB_USER=${DB_USER:-<vazio>}"

attempt=1
max_attempts=10

until node scripts/migrate-mariadb.mjs
do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Falha definitiva na migracao apos ${max_attempts} tentativas."
    exit 1
  fi

  echo "Tentativa ${attempt}/${max_attempts} falhou ao conectar no MariaDB. Aguardando 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

echo "Garantindo seed inicial..."
node scripts/seed-master-user.mjs

echo "Iniciando aplicacao VEXOR..."
exec node server/index.mjs
