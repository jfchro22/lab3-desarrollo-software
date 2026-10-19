/**
 * Módulo de estado de la aplicación.
 * Interfaz pública: ESTADOS, POR_PAGINA, estadoInicial(), agruparErrores(), crearAcciones().
 * Toda la lógica que modifica el estado vive aquí; las vistas solo leen el estado
 * y piden acciones, nunca llaman a la API directamente.
 */

export const ESTADOS = Object.freeze({
  CARGANDO: 'cargando',
  VACIO: 'vacio',
  ERROR: 'error',
  DATOS: 'datos',
});

export const POR_PAGINA = 5;

const valoresVacios = () => ({ nombre: '', creditos: '', profesor_id: '', categoria_ids: '' });

export function estadoInicial() {
  return {
    listado: { estado: ESTADOS.CARGANDO, cursos: [], meta: null, error: null, busqueda: '', pagina: 1 },
    formulario: {
      modo: 'crear',        // 'crear' | 'editar'
      cursoId: null,
      valores: valoresVacios(),
      errores: {},          // { campo: [mensajes] } devueltos por el back-end
      errorGeneral: null,
      mensaje: null,        // { tipo: 'success' | 'info', texto }
      enviando: false,
      fallos: 0,            // cuenta los envíos rechazados con 422 (para mover el foco)
    },
  };
}

/** Agrupa las claves anidadas de Laravel ('categoria_ids.0') bajo el campo base ('categoria_ids'). */
export function agruparErrores(errores = {}) {
  const agrupados = {};
  for (const [clave, mensajes] of Object.entries(errores)) {
    const campo = clave.split('.')[0];
    agrupados[campo] = [...(agrupados[campo] ?? []), ...[].concat(mensajes)];
  }
  return agrupados;
}

const aNumero = (texto) => {
  const limpio = String(texto ?? '').trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isNaN(numero) ? limpio : numero; // si no es número, que el back-end lo rechace por campo
};

function construirCuerpo({ nombre, creditos, profesor_id, categoria_ids }) {
  const ids = String(categoria_ids ?? '').split(',').map((texto) => texto.trim()).filter(Boolean).map(aNumero);
  return { nombre: String(nombre).trim(), creditos: aNumero(creditos), profesor_id: aNumero(profesor_id), categoria_ids: ids };
}

/**
 * @param {{ store: object, api: import('./api.js').ApiClient }} dependencias
 */
export function crearAcciones({ store, api }) {
  let controlador = null; // AbortController de la solicitud de listado en curso

  const parcialListado = (parcial) => store.actualizar((estado) => ({ listado: { ...estado.listado, ...parcial } }));
  const parcialFormulario = (parcial) => store.actualizar((estado) => ({ formulario: { ...estado.formulario, ...parcial } }));

  async function cargarCursos() {
    controlador?.abort(); // cancela la solicitud anterior si seguía en curso
    const propio = new AbortController();
    controlador = propio;

    const { busqueda, pagina } = store.obtener().listado;
    parcialListado({ estado: ESTADOS.CARGANDO, error: null });

    try {
      const respuesta = await api.listarCursos(
        { nombre: busqueda, page: pagina, per_page: POR_PAGINA },
        { signal: propio.signal },
      );
      const cursos = respuesta.data ?? [];

      if (cursos.length === 0 && pagina > 1) {
        parcialListado({ pagina: 1 });
        return cargarCursos();
      }

      parcialListado({
        estado: cursos.length > 0 ? ESTADOS.DATOS : ESTADOS.VACIO,
        cursos,
        meta: respuesta.meta ?? null,
      });
    } catch (error) {
      if (error.name === 'AbortError') return undefined; // reemplazada por una búsqueda más nueva
      if (error.estado === 401) return undefined;        // la sesión expiró: ya se redirige al login
      parcialListado({ estado: ESTADOS.ERROR, error: error.message });
    }
    return undefined;
  }

  function buscar(texto) {
    parcialListado({ busqueda: texto.trim(), pagina: 1 });
    return cargarCursos();
  }

  function irAPagina(pagina) {
    parcialListado({ pagina });
    return cargarCursos();
  }

  function actualizarCampo(campo, valor) {
    store.actualizar(({ formulario }) => {
      const { [campo]: _resuelto, ...errores } = formulario.errores;
      return {
        formulario: { ...formulario, valores: { ...formulario.valores, [campo]: valor }, errores, mensaje: null },
      };
    });
  }

  function iniciarEdicion(curso) {
    parcialFormulario({
      modo: 'editar',
      cursoId: curso.id,
      valores: {
        nombre: curso.nombre ?? '',
        creditos: curso.creditos ?? '',
        profesor_id: curso.profesor_id ?? curso.profesor?.id ?? '',
        categoria_ids: (curso.categorias ?? []).map((categoria) => categoria.id).join(', '),
      },
      errores: {},
      errorGeneral: null,
      mensaje: null,
    });
  }

  function cancelarEdicion() {
    parcialFormulario({ modo: 'crear', cursoId: null, valores: valoresVacios(), errores: {}, errorGeneral: null, mensaje: null });
  }

  function restaurarBorrador(borrador) {
    parcialFormulario({
      modo: borrador.modo ?? 'crear',
      cursoId: borrador.cursoId ?? null,
      valores: { ...valoresVacios(), ...borrador.valores },
      mensaje: { tipo: 'info', texto: 'Se restauraron los datos del formulario que estaba llenando.' },
    });
  }

  async function guardar() {
    const { formulario } = store.obtener();
    if (formulario.enviando) return;

    parcialFormulario({ enviando: true, errores: {}, errorGeneral: null, mensaje: null });
    const cuerpo = construirCuerpo(formulario.valores);
    const editando = formulario.modo === 'editar';

    try {
      if (editando) await api.actualizarCurso(formulario.cursoId, cuerpo);
      else await api.crearCurso(cuerpo);

      parcialFormulario({
        modo: 'crear',
        cursoId: null,
        valores: valoresVacios(),
        enviando: false,
        mensaje: { tipo: 'success', texto: editando ? 'Curso actualizado correctamente.' : 'Curso creado correctamente.' },
      });
      await cargarCursos();
    } catch (error) {
      if (error.estado === 401) return; // la sesión expiró: el borrador ya quedó guardado
      if (error.estado === 422) {
        parcialFormulario({
          enviando: false,
          errores: agruparErrores(error.errores),
          errorGeneral: 'Revise los campos marcados.',
          fallos: store.obtener().formulario.fallos + 1,
        });
      } else {
        parcialFormulario({ enviando: false, errorGeneral: error.message });
      }
    }
  }

  return {
    cargarCursos,
    reintentar: cargarCursos,
    buscar,
    irAPagina,
    actualizarCampo,
    iniciarEdicion,
    cancelarEdicion,
    restaurarBorrador,
    guardar,
  };
}