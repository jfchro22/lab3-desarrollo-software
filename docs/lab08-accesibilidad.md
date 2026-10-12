# Laboratorio 8 — Verificación de accesibilidad y diseño responsivo

## Páginas implementadas
- `public/lab08/dashboard.html` — Listado de cursos + formulario "Crear nuevo curso"
- `public/lab08/curso.html` — Detalle de curso
- `public/lab08/matriculas.html` — Mis matrículas

## Puntos de quiebre (móvil primero)
| Punto de quiebre | Ancho | Qué cambia |
|---|---|---|
| Base (sin media query) | < 640px | Una columna, nav apilado, filtro apilado |
| 1 — `min-width: 40em` (~640px) | Tablet | Nav y filtro pasan a fila, formulario a 2 columnas |
| 2 — `min-width: 64em` (~1024px) | Escritorio | Tarjetas en grid multi-columna, detalle de curso a 2 columnas (Grid) |
| 3 — `min-width: 80em` (~1280px) | Escritorio grande | Ancho máximo de contenido y espaciado amplían |

## Lista de verificación de accesibilidad

- [x] Un único `<h1>` por página, sin saltos de nivel de encabezado.
- [x] Elementos semánticos: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- [x] Enlace "Saltar al contenido principal" visible al recibir foco por teclado.
- [x] Foco visible en todos los controles interactivos (halo de 3px, contraste 5.2:1).
- [x] Formulario con `<label for>` asociado a cada campo por `id`.
- [x] Campos relacionados agrupados con `<fieldset>`/`<legend>` (datos del curso, categorías).
- [x] Validación nativa HTML5: `required`, `minlength`, `maxlength`, `min`, `max`, `type="email"`.
- [x] Mensajes de error visibles y asociados vía `aria-describedby`.
- [x] Navegación exclusiva con teclado probada: `Tab` recorre todos los controles en orden lógico, sin trampas de foco.
- [x] Unidades relativas (`rem`, `em`) en tipografía, espaciado y puntos de quiebre — ninguna unidad fija (`px`) en fuentes.
- [x] Interfaz usable al 200% de zoom del navegador: sin texto cortado ni superposición.
- [x] Contraste de texto y de bordes/indicadores verificado según la guía del Lab 7 (WCAG 1.4.3 y 1.4.11).

## Evidencia de anchos de pantalla
Las capturas se adjuntaron directamente en la entrega de Mediación Virtual (no están en el repositorio), sobre `dashboard.html`:
- Ancho móvil — una columna, antes del primer punto de quiebre.
- Ancho tablet — filtro en fila, entre el primer y segundo punto de quiebre.
- Ancho escritorio — grid de 3 columnas, después del segundo punto de quiebre.
- Zoom del navegador al 200% — interfaz usable sin roturas.

## Justificación de Grid vs. Flexbox
- **Grid**: esqueleto general de página (`header`/`main`/`footer`), cuadrícula de tarjetas de curso (reparto bidimensional de N elementos de ancho mínimo conocido), layout de dos columnas en el detalle de curso (contenido + panel de estudiantes, regiones de distinta naturaleza).
- **Flexbox**: distribución interna de la cabecera (logo + nav), barra de filtros (elementos en línea que envuelven), contenido interno de cada tarjeta (título + meta + badge apilados), grupo de checkboxes del formulario.

Cada elección queda comentada directamente en `public/lab08/styles.css`.