/**
 * Vista del inicio de sesión.
 * Interfaz pública: montarLoginView({ store, acciones }).
 */
import { crear, vaciar } from '../dom.js';

const CAMPOS = ['email', 'password'];

export function montarLoginView({ store, acciones }) {
  const elForm = document.querySelector('#form-login');
  const alerta = document.querySelector('#login-alerta');
  const botonEnviar = elForm.querySelector('button[type="submit"]');

  elForm.addEventListener('submit', (evento) => {
    evento.preventDefault();
    acciones.iniciarSesion(elForm.elements.email.value.trim(), elForm.elements.password.value);
  });

  let ultimo = null;

  function render(estado) {
    botonEnviar.textContent = estado.enviando ? 'Ingresando…' : 'Iniciar sesión';
    botonEnviar.disabled = estado.enviando;

    for (const campo of CAMPOS) {
      const mensajes = estado.errores[campo] ?? [];
      const contenedor = elForm.elements[campo].closest('.field');
      contenedor.classList.toggle('has-server-error', mensajes.length > 0);
      contenedor.querySelector('.error-text').textContent = mensajes.join(' ');
      elForm.elements[campo].setAttribute('aria-invalid', mensajes.length > 0 ? 'true' : 'false');
    }

    vaciar(alerta);
    if (estado.errorGeneral) {
      alerta.append(crear('p', { class: 'alert alert--error', role: 'alert' }, estado.errorGeneral));
    } else if (estado.aviso) {
      alerta.append(crear('p', { class: 'alert alert--info', role: 'status' }, estado.aviso));
    }
  }

  store.suscribir((estado) => {
    if (estado === ultimo) return;
    ultimo = estado;
    render(estado);
  });

  elForm.elements.email.focus();
}