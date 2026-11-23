# Laboratorio 14 — Despliegue del proyecto en un entorno operativo

**Curso:** IF0009 Desarrollo de Software IV · **Autor:** Jose Fernando Charpentier Rojas · **Repositorio:** https://github.com/jfchro22/lab3-desarrollo-software

| Dato | Valor |
|---|---|
| Dirección pública de la aplicación | ⟦COMPLETAR: https://….onrender.com⟧ |
| Endpoint de verificación de estado | ⟦COMPLETAR: https://….onrender.com/up⟧ |
| Plataforma de hospedaje | Render (servicio web con Docker + PostgreSQL administrado) |
| Integración y entrega continuas | GitHub Actions (`.github/workflows/ci-cd.yml`) |

## 1. Arquitectura de despliegue

```
Internet ──HTTPS──▶ Render (termina TLS, certificado administrado)
                      │  X-Forwarded-Proto
                      ▼
        Contenedor "matricula" (usuario sin privilegios, puerto $PORT)
        ┌──────────────────────────────────────────────┐
        │ nginx  ── /api/*, /up ──▶ php-fpm (Laravel 13) │──▶ PostgreSQL (Render, red interna)
        │        └─ /  ──▶ front-end estático (SPA)      │
        └──────────────────────────────────────────────┘
```

- **Un solo contenedor, un solo dominio:** nginx sirve el front-end estático (Ionic React compilado) y reenvía `/api/*` y `/up` a php-fpm. Así el front-end llama a la API con la ruta relativa `/api` y no se necesita CORS.
- **Base de datos:** PostgreSQL administrado por la plataforma, accesible solo por la red interna mediante la variable `DB_URL`.
- **Aplicación móvil:** el mismo código del front-end se empaqueta con Capacitor y apunta a la API pública por HTTPS.

## 2. Configuración por entornos (sin credenciales en el repositorio)

| Elemento | Desarrollo | Producción |
|---|---|---|
| Archivo de variables | `.env` local (ignorado por Git) a partir de `.env.example` | Variables definidas en el panel de la plataforma (plantilla: `.env.production.example`, sin valores) |
| `APP_ENV` / `APP_DEBUG` | `local` / `true` | `production` / `false` |
| Base de datos | SQLite local | PostgreSQL (`DB_URL`) |
| Registro (logs) | archivo | `stderr` |
| Usuarios iniciales | Usuarios de demostración (solo si el entorno no es producción) | Un administrador creado únicamente si `ADMIN_EMAIL` y `ADMIN_PASSWORD` están definidas |
| URL de la API en el front-end | `http://10.0.2.2:8000/api` (emulador) | `VITE_API_URL` al construir (`/api` en web; URL HTTPS pública en el APK) |

- `.env`, `.env.production`, `*.jks`, `*.keystore` y `keystore.properties` están en `.gitignore` y en `.dockerignore`: no entran al repositorio ni a la imagen.
- **Falla explícita ante configuración ausente:** el `entrypoint.sh` aborta con un mensaje claro si falta `APP_KEY`, `APP_URL` o `DB_CONNECTION`, o si `APP_DEBUG=true`; además `AppServiceProvider` lanza una excepción en producción si falta `APP_KEY`/`APP_URL` o `APP_DEBUG` está activo.
- El sembrador `UsuarioSeeder` ya no crea credenciales conocidas en producción (cubierto por `tests/Feature/EntornoProduccionTest.php`). Las contraseñas de demostración que quedan en el sembrador solo se ejecutan fuera de producción.

## 3. Empaquetado para producción y tamaño de los artefactos

**Back-end:** `composer install --no-dev --optimize-autoloader --classmap-authoritative` (sin dependencias de desarrollo), caché de configuración y de eventos al arrancar, OPcache activado con `validate_timestamps=0`.

**Front-end:** construcción optimizada con `npm run build` (TypeScript + Vite con minificación y paquete de compatibilidad). Medido el 22/11/2026 con `VITE_API_URL=/api`:

| Artefacto | Tamaño |
|---|---|
| Front-end (`movil/dist`), 61 archivos | 3 209 112 bytes (≈ 3,06 MB) |
| Front-end, JS + CSS comprimidos con gzip | 739 878 bytes (≈ 0,71 MB) |
| Fragmentos JS más grandes | `index` (moderno) 1 400 503 bytes; `index-legacy` 1 460 280 bytes |
| Imagen Docker final | ⟦COMPLETAR: columna SIZE del paso «Tamaño de la imagen» del trabajo `construir-imagen` en GitHub Actions⟧ |
| Paquete móvil firmado (APK) | ⟦COMPLETAR: tamaño de `app-release.apk`⟧ |

## 4. Contenedorización

`Dockerfile` en múltiples etapas:

1. **`front`** (`node:22-alpine`): `npm ci` y construcción del front-end.
2. **`vendor`** (`composer:2`): dependencias PHP solo de producción y autoloader optimizado.
3. **`app`** (`php:8.4-fpm-alpine`): imagen base mínima (Alpine) con únicamente php-fpm, nginx y las extensiones necesarias (`pdo_pgsql`, `opcache`). Solo se copian los resultados de las etapas anteriores: ni Node, ni Composer, ni herramientas de compilación llegan a la imagen final.

- **Usuario sin privilegios:** se crea el usuario `app` (UID 10001) y la instrucción `USER app` hace que nada se ejecute como administrador; nginx escucha en un puerto alto, con PID y temporales en `/tmp`.
- **`HEALTHCHECK`** contra `/up`.
- **`.dockerignore`:** excluye `.env`, `vendor`, `node_modules`, pruebas, documentación y llaves.

## 5. Despliegue

1. Crear el servicio con el *blueprint* `render.yaml` (base de datos PostgreSQL + servicio web Docker, con `autoDeploy: false`).
2. Definir en el panel los valores sensibles: `APP_KEY` (`php artisan key:generate --show`), `APP_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. Con `RUN_MIGRATIONS=true`, el contenedor ejecuta `php artisan migrate --force` al arrancar contra la base de datos de producción, y luego crea el administrador inicial.
4. Resultado de las migraciones en producción: ⟦COMPLETAR: pegar las líneas del registro de Render donde aparece `DONE` para cada migración⟧

## 6. Integración y entrega continuas

Flujo `.github/workflows/ci-cd.yml`, que se ejecuta al confirmar cambios en `main` (y en solicitudes de integración):

| Trabajo | Qué hace | Condición |
|---|---|---|
| `pruebas-backend` | PHP 8.4, `composer install`, `php artisan test` | — |
| `pruebas-frontend` | `npm ci`, verificación de tipos, pruebas unitarias y compilación | — |
| `construir-imagen` | `docker build` de la imagen de producción | necesita los dos anteriores |
| `desplegar` | dispara el despliegue en Render y comprueba `/up` | necesita los tres anteriores y solo corre en `main` |

**Una prueba fallida detiene el despliegue:** `desplegar` declara `needs` sobre los trabajos de prueba; si uno falla, GitHub Actions lo marca como omitido y no se llama al despliegue. Como `autoDeploy` está apagado en Render, esta es la única vía de despliegue.

Los secretos del flujo (`RENDER_DEPLOY_HOOK_URL`, `APP_PUBLIC_URL`) se guardan en *Settings → Secrets and variables → Actions* y no están en el repositorio.

**Evidencias:**
- Ejecución exitosa: ⟦COMPLETAR: enlace a la ejecución verde en la pestaña Actions⟧
- Ejecución detenida por prueba fallida (se confirmó un cambio con una prueba que falla deliberadamente; el trabajo `desplegar` quedó omitido): ⟦COMPLETAR: enlace a la ejecución roja⟧

## 7. Paquete de distribución móvil firmado

1. Construir el front-end con la API pública y sincronizar (en `movil/`):
   ```powershell
   $env:VITE_API_URL="https://<servicio>.onrender.com/api"; $env:CAP_PROD="1"
   npm run build
   npx cap sync android
   ```
2. En Android Studio: *Build → Generate Signed App Bundle / APK → APK*; crear un llavero nuevo (`.jks`), variante **release**.
3. El llavero y sus contraseñas **no** se confirman en el repositorio (`.gitignore`).
4. Verificación de la firma: `apksigner verify --verbose --print-certs app-release.apk` → ⟦COMPLETAR: pegar la salida⟧

En el paquete de producción (`CAP_PROD=1`) Capacitor usa el esquema `https` y no permite tráfico sin cifrar.

## 8. Verificación del despliegue

| Verificación | Comando | Resultado |
|---|---|---|
| La aplicación responde públicamente | `curl -I https://<servicio>.onrender.com/` | ⟦COMPLETAR⟧ |
| Certificado válido (TLS) | `curl -vI https://<servicio>.onrender.com/up` (sin `-k`) | ⟦COMPLETAR⟧ |
| Endpoint de estado | `curl https://<servicio>.onrender.com/up` | ⟦COMPLETAR: HTTP 200⟧ |
| API operativa | `POST /api/login` con el administrador creado por variables | ⟦COMPLETAR⟧ |
| Variables sensibles no expuestas | `curl -I https://<servicio>.onrender.com/.env` y `/api/user` sin token | ⟦COMPLETAR: 404 y 401⟧ |
| Sin versión de PHP/servidor expuesta | encabezados de respuesta | `X-Powered-By` ausente (`expose_php=Off`), `server_tokens off` |

## 9. Limitaciones y riesgos reconocidos

- La plataforma gratuita suspende el servicio tras un periodo sin tráfico (primer acceso lento) y su base de datos gratuita tiene vigencia limitada; para una entrega definitiva se debe usar un plan de pago.
- Los encabezados de seguridad del servidor (CSP, CORS restrictivo, limitación de peticiones) corresponden a los laboratorios 12 y 13 y no se reconfiguraron aquí.
- El Dockerfile, el flujo de CI y el blueprint se escribieron con asistencia de IA (Claude) y se validaron con la construcción real en GitHub Actions y en Render; los archivos de configuración fueron revisados antes de entregarse.
