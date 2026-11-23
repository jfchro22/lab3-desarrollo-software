# syntax=docker/dockerfile:1
# Construcción en múltiples etapas: front-end (Node) -> dependencias PHP (Composer) -> imagen final mínima (Alpine).

# ---------- Etapa 1: front-end (Ionic React, construcción optimizada) ----------
FROM node:22-alpine AS front
WORKDIR /movil
COPY movil/package.json movil/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY movil/ ./
# En producción el front-end y la API comparten dominio, por eso la API se llama en la ruta relativa /api.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Etapa 2: dependencias PHP solo de producción ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts

# ---------- Etapa 3: imagen final (php-fpm + nginx sobre Alpine) ----------
FROM php:8.4-fpm-alpine AS app
RUN apk add --no-cache nginx libpq \
 && apk add --no-cache --virtual .build-deps libpq-dev $PHPIZE_DEPS \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql opcache \
 && apk del .build-deps

WORKDIR /var/www/html
COPY --from=vendor /app /var/www/html
COPY --from=front /movil/dist /var/www/spa
COPY docker/nginx.conf /etc/nginx/nginx.conf.tpl
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zzz-app.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Usuario sin privilegios: el contenedor NO se ejecuta como administrador (root).
RUN adduser -D -u 10001 app \
 && chmod +x /usr/local/bin/entrypoint.sh \
 && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && php artisan package:discover --ansi \
 && chown -R app:app storage bootstrap/cache

USER app
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-8080}/up" || exit 1
ENTRYPOINT ["entrypoint.sh"]
