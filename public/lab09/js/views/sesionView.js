/**
 * Vista de la barra de sesión (usuario, cerrar sesión, simular token vencido).
 * Interfaz pública: montarSesionView({ usuario, acciones }).
 */
export function montarSesionView({ usuario, acciones }) {
  document.querySelector('#sesion-usuario').textContent = usuario
    ? `${usuario.name} (${usuario.role})`
    : 'Sin sesión';

  document.querySelector('#simular-expiracion').addEventListener('click', () => acciones.simularExpiracion());
  document.querySelector('#cerrar-sesion').addEventListener('click', () => acciones.cerrarSesion());
}