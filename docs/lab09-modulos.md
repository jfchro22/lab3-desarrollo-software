# Laboratorio 9 — JavaScript moderno y consumo asíncrono de la API

Código en `public/lab09/` (se sirve con `php artisan serve`, mismo origen que la API).

## Módulos y responsabilidades
| Módulo | Responsabilidad | Interfaz pública |
|---|---|---|
| `js/api.js` | Acceso a la API: clase `ApiClient` (URL base, token, errores uniformes → `ApiError`) | `ApiClient`, `ApiError` |
| `js/session.js` | Token, usuario y borrador del formulario (`sessionStorage`) | funciones exportadas |
| `js/store.js` | Contenedor de estado observable | `crearStore` |
| `js/state.js` | Estado de la aplicación y acciones (única capa que cambia el estado) | `estadoInicial`, `crearAcciones`, `ESTADOS` |
| `js/utils.js`, `js/dom.js` | `debounce` basado en promesas; construcción segura de DOM | `debounce`, `crear` |
| `js/views/listView.js` | Vista del listado: 4 estados + paginación + búsqueda | `montarListView` |
| `js/views/formView.js` | Vista del formulario crear/editar con errores por campo | `montarFormView` |
| `js/views/sesionView.js`, `js/views/loginView.js` | Barra de sesión y pantalla de login | `montar...View` |
| `js/app.js`, `js/login.js` | Composición de módulos de cada página | — |

## Decisiones
- Solo promesas con `async/await`; sin callbacks anidados.
- El estado dirige la vista: las vistas no llaman a la API, piden acciones; solo se redibuja la parte del estado que cambió.
- Búsqueda con debounce de 400 ms y cancelación de la solicitud anterior con `AbortController`.
- Errores de validación (422) se asocian a cada campo; los demás errores se muestran como alerta general.
- Ante un 401 se guarda el borrador del formulario, se limpia la sesión y se redirige a `login.html`; al volver a iniciar sesión el formulario se restaura.

## Evidencia
Capturas / video adjuntos en la entrega de Mediación Virtual: los cuatro estados del listado, errores de validación por campo y el flujo de expiración del token.