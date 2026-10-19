/**
 * Punto de entrada de login.html.
 */
import { ApiClient } from './api.js';
import { guardarSesion } from './session.js';
import { crearStore } from './store.js';
import { agruparErrores } from './state.js';
import { montarLoginView } from './views/loginView.js';

const parametros = new URLSearchParams(window.location.search);
let aviso = null;
if (parametros.get('expirada')) {
  aviso = 'Su sesión expiró. Inicie sesión de nuevo: los datos del formulario que estaba llenando se conservaron.';
} else if (parametros.get('sesion') === 'cerrada') {
  aviso = 'Sesión cerrada correctamente.';
}

const store = crearStore({ enviando: false, errores: {}, errorGeneral: null, aviso });
const api = new ApiClient({ baseUrl: '/api' });

async function iniciarSesion(email, password) {
  store.actualizar({ enviando: true, errores: {}, errorGeneral: null });

  try {
    const resultado = await api.login(email, password);
    guardarSesion({ token: resultado.token, usuario: resultado.usuario });
    window.location.assign('cursos.html');
  } catch (error) {
    store.actualizar({
      enviando: false,
      errores: agruparErrores(error.errores),
      errorGeneral: error.estado === 422 ? 'Revise los campos marcados.' : error.message,
    });
  }
}

montarLoginView({ store, acciones: { iniciarSesion } });