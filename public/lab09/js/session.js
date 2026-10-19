/**
 * Módulo de sesión: token, usuario y borrador del formulario (sessionStorage).
 * Interfaz pública: ver exports.
 */
const CLAVES = {
  token: 'lab09.token',
  usuario: 'lab09.usuario',
  borrador: 'lab09.borrador',
};

const leer = (clave) => {
  try { return window.sessionStorage.getItem(clave); } catch { return null; }
};
const escribir = (clave, valor) => {
  try { window.sessionStorage.setItem(clave, valor); } catch { /* almacenamiento no disponible */ }
};
const borrar = (clave) => {
  try { window.sessionStorage.removeItem(clave); } catch { /* almacenamiento no disponible */ }
};
const leerJson = (clave) => {
  try { return JSON.parse(leer(clave) ?? 'null'); } catch { return null; }
};

export const obtenerToken = () => leer(CLAVES.token);
export const obtenerUsuario = () => leerJson(CLAVES.usuario);

export function guardarSesion({ token, usuario }) {
  escribir(CLAVES.token, token);
  escribir(CLAVES.usuario, JSON.stringify(usuario ?? null));
}

/** Cierra la sesión local, conservando el borrador del formulario. */
export function cerrarSesion() {
  borrar(CLAVES.token);
  borrar(CLAVES.usuario);
}

/** Solo para la demostración: deja un token inválido para provocar un 401 real. */
export const simularTokenVencido = () => escribir(CLAVES.token, 'token-vencido-simulado');

export const guardarBorrador = (borrador) => escribir(CLAVES.borrador, JSON.stringify(borrador));
export const leerBorrador = () => leerJson(CLAVES.borrador);
export const limpiarBorrador = () => borrar(CLAVES.borrador);