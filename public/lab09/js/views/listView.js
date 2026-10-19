/**
 * Vista del listado de cursos.
 * Interfaz pública: montarListView({ store, acciones }).
 * Solo dibuja el estado `listado` y traduce eventos del DOM en acciones.
 */
import { crear, vaciar } from '../dom.js';
import { debounce } from '../utils.js';
import { ESTADOS } from '../state.js';

const RETRASO_BUSQUEDA_MS = 400;

const tarjeta = (curso) => crear(
  'article',
  { class: 'card' },
  crear('div', { class: 'card__header' }, crear('h3', {}, curso.nombre)),
  crear(
    'div',
    { class: 'card__meta' },
    crear('span', {}, `${curso.creditos} créditos`),
    crear('span', {}, curso.profesor?.nombre ? `Prof. ${curso.profesor.nombre}` : 'Sin profesor'),
  ),
  crear('div', { class: 'card__meta' }, ...(curso.categorias ?? []).map((categoria) => crear('span', { class: 'badge' }, categoria.nombre))),
  crear(
    'button',
    { type: 'button', class: 'btn btn--secondary', 'data-accion': 'editar', 'data-id': curso.id },
    'Editar',
    crear('span', { class: 'sr-only' }, ` ${curso.nombre}`),
  ),
);

export function montarListView({ store, acciones }) {
  const entrada = document.querySelector('#busqueda');
  const estado = document.querySelector('#estado-listado');
  const lista = document.querySelector('#lista-cursos');
  const paginacion = document.querySelector('#paginacion');

  // Debounce: la búsqueda se lanza 400 ms después de la última tecla;
  // la acción cancela la solicitud anterior con AbortController.
  const buscarConRetraso = debounce((texto) => acciones.buscar(texto), RETRASO_BUSQUEDA_MS);
  entrada.addEventListener('input', (evento) => buscarConRetraso(evento.target.value));
  document.querySelector('#form-busqueda').addEventListener('submit', (evento) => evento.preventDefault());

  estado.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-accion="reintentar"]')) acciones.reintentar();
  });

  lista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion="editar"]');
    if (!boton) return;
    const curso = store.obtener().listado.cursos.find((candidato) => candidato.id === Number(boton.dataset.id));
    if (curso) acciones.iniciarEdicion(curso);
  });

  paginacion.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-pagina]');
    if (boton) acciones.irAPagina(Number(boton.dataset.pagina));
  });

  function renderEstado(listado) {
    vaciar(estado);
    estado.setAttribute('aria-busy', listado.estado === ESTADOS.CARGANDO ? 'true' : 'false');

    if (listado.estado === ESTADOS.CARGANDO) {
      estado.append(crear(
        'p',
        { class: 'status', role: 'status' },
        crear('span', { class: 'spinner', 'aria-hidden': 'true' }),
        'Cargando cursos…',
      ));
    } else if (listado.estado === ESTADOS.VACIO) {
      const texto = listado.busqueda
        ? `No se encontraron cursos para «${listado.busqueda}».`
        : 'Todavía no hay cursos registrados.';
      estado.append(crear('p', { class: 'status', role: 'status' }, texto));
    } else if (listado.estado === ESTADOS.ERROR) {
      estado.append(crear(
        'div',
        { class: 'alert alert--error', role: 'alert' },
        crear('p', {}, listado.error ?? 'Ocurrió un error al cargar los cursos.'),
        crear('button', { type: 'button', class: 'btn btn--secondary', 'data-accion': 'reintentar' }, 'Reintentar'),
      ));
    }
  }

  function renderLista(listado) {
    vaciar(lista);
    if (listado.estado === ESTADOS.DATOS) lista.append(...listado.cursos.map(tarjeta));
  }

  function renderPaginacion(listado) {
    vaciar(paginacion);
    const meta = listado.meta;
    if (listado.estado !== ESTADOS.DATOS || !meta || meta.last_page <= 1) return;

    const actual = meta.current_page;
    const ultima = meta.last_page;
    const boton = (texto, pagina, { esActual = false, deshabilitado = false } = {}) => crear(
      'button',
      {
        type: 'button',
        class: `btn btn--secondary btn--small${esActual ? ' is-current' : ''}`,
        'data-pagina': pagina,
        'aria-current': esActual ? 'page' : null,
        'aria-label': /^\d+$/.test(texto) ? `Página ${texto}` : null,
        disabled: deshabilitado,
      },
      texto,
    );

    paginacion.append(
      boton('Anterior', actual - 1, { deshabilitado: actual <= 1 }),
      ...Array.from({ length: ultima }, (_, indice) => boton(String(indice + 1), indice + 1, { esActual: indice + 1 === actual })),
      boton('Siguiente', actual + 1, { deshabilitado: actual >= ultima }),
      crear('span', { class: 'pagination__info' }, `Página ${actual} de ${ultima} · ${meta.total} cursos`),
    );
  }

  // Solo se vuelve a dibujar cuando cambia la parte `listado` del estado.
  let anterior = null;
  store.suscribir(({ listado }) => {
    if (listado === anterior) return;
    anterior = listado;
    renderEstado(listado);
    renderLista(listado);
    renderPaginacion(listado);
  });
}