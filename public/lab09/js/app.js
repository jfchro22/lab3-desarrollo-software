/**
 * Punto de entrada de cursos.html: compone los módulos.
 *   api.js (acceso a la API) ← state.js (estado y acciones) ← views/* (una vista por responsabilidad)
 */
import { ApiClient } from './api.js';
import {
  cerrarSesion, guardarBorrador, leerBorrador, limpiarBorrador,
  obtenerToken, obtenerUsuario, simularTokenVencido,
} from './session.js';
import { crearStore } from './store.js';
import { crearAcciones, estadoInicial } from './state.js';
import { montarListView } from './views/listView.js';
import { montarFormView } from './views/formView.js';
import { montarSesionView } from './views/sesionView.js';

const hayContenido = (valores) => Object.values(valores).some((valor) => String(valor).trim() !== '');

async function iniciar() {
  const store = crearStore(estadoInicial());
  let redirigiendo = false;

  /**
   * Expiración del token: ante un 401 se guarda el borrador del formulario,
   * se limpia la sesión y se redirige al inicio de sesión.
   */
  function alExpirarSesion() {
    if (redirigiendo) return;
    redirigiendo = true;

    const { modo, cursoId, valores } = store.obtener().formulario;
    if (modo === 'editar' || hayContenido(valores)) guardarBorrador({ modo, cursoId, valores });

    cerrarSesion();
    window.location.assign('login.html?expirada=1');
  }

  const api = new ApiClient({ baseUrl: '/api', obtenerToken, alExpirarSesion });
  const acciones = crearAcciones({ store, api });

  async function cerrarSesionActual() {
    try {
      await api.logout();
    } catch {
      /* si el token ya no era válido, igual se cierra la sesión local */
    }
    cerrarSesion();
    window.location.assign('login.html?sesion=cerrada');
  }

  function simularExpiracion() {
    simularTokenVencido();
    return acciones.cargarCursos(); // el servidor responde 401 y se activa alExpirarSesion
  }

  montarSesionView({ usuario: obtenerUsuario(), acciones: { cerrarSesion: cerrarSesionActual, simularExpiracion } });
  montarListView({ store, acciones });
  montarFormView({ store, acciones });

  const borrador = leerBorrador();
  if (borrador) {
    acciones.restaurarBorrador(borrador);
    limpiarBorrador();
  }

  await acciones.cargarCursos();
}

if (obtenerToken()) {
  iniciar();
} else {
  window.location.replace('login.html');
}