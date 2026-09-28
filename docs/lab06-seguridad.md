# Laboratorio 6 — Autenticación, autorización y pruebas

## Autenticación
- Registro, login y logout con Laravel Sanctum. Tokens con expiración de 2 horas, revocados al hacer logout.
- Contraseñas derivadas con el hasher de Laravel (bcrypt) y política mínima de complejidad (8+ caracteres, mayúsculas, minúsculas y números).

## Autorización
- 3 roles: admin, profesor, estudiante.
- Protección por rol en las rutas (middleware `role:`) y políticas por recurso (`CursoPolicy`, `MatriculaPolicy`) para que cada quien solo acceda a lo que le corresponde.
- Verificación en dos capas: en el controlador (Gate::authorize) y dentro del Service (trait `AutorizaAcciones`), de modo que una invocación directa al Service sin pasar por la ruta también se rechaza.

## Protección del login
- Límite de 5 intentos fallidos por IP + email, bloqueo de 60 segundos.
- Mismo mensaje de error para usuario inexistente y contraseña incorrecta.

## Pruebas
- 51 pruebas (0 fallos): unitarias de Services con dobles, de API con Sanctum::actingAs, y las 4 reglas de negocio del Lab 4 adaptadas.
- Base de datos de pruebas aislada en SQLite `:memory:` (phpunit.xml), no toca la base de desarrollo.
- Cobertura: 93.7 % (medida con PCOV).

## Evidencia
Ver capturas adjuntas: acceso permitido (200), acceso denegado sin token (401), token revocado tras logout (401), acceso denegado por rol (403) y acceso permitido por rol (201).