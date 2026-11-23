#!/bin/sh
# Falla de forma explícita si falta configuración obligatoria (no hay valores por omisión inseguros).
set -eu

faltan=""
for v in APP_KEY APP_URL DB_CONNECTION; do
  eval "valor=\${$v:-}"
  [ -n "$valor" ] || faltan="$faltan $v"
done
if [ -n "$faltan" ]; then
  echo "ERROR: faltan variables de entorno obligatorias:$faltan" >&2
  exit 1
fi
if [ "${APP_DEBUG:-false}" = "true" ]; then
  echo "ERROR: APP_DEBUG=true no está permitido en producción." >&2
  exit 1
fi

# Migraciones en el entorno de producción (se ejecutan al arrancar si RUN_MIGRATIONS=true).
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi
# Administrador inicial: solo se crea con ADMIN_EMAIL y ADMIN_PASSWORD definidas por variables de entorno.
if [ "${SEED_ADMIN:-false}" = "true" ]; then
  php artisan db:seed --class=UsuarioSeeder --force
fi

php artisan config:cache
php artisan event:cache

sed "s/__PORT__/${PORT:-8080}/g" /etc/nginx/nginx.conf.tpl > /tmp/nginx.conf
php-fpm -D
exec nginx -e /dev/stderr -c /tmp/nginx.conf -g 'daemon off;'
