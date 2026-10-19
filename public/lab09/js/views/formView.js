/**
 * Vista del formulario de creación / edición.
 * Interfaz pública: montarFormView({ store, acciones }).
 * El estado dirige la vista: los valores, los errores por campo y los mensajes
 * se dibujan a partir de `estado.formulario`.
 */
import { crear, vaciar } from '../dom.js';

const CAMPOS = ['nombre', 'creditos', 'profesor_id', 'categoria_ids'];

export function montarFormView({ store, acciones }) {
  const elForm = document.querySelector('#form-curso');
  const titulo = document.querySelector('#form-titulo');
  const alerta = document.querySelector('#form-alerta');
  const botonEnviar = elForm.querySelector('button[type="submit"]');
  const botonCancelar = document.querySelector('#cancelar-edicion');

  const entradas = {};
  for (const campo of CAMPOS) {
    entradas[campo] = elForm.elements[campo];
    entradas[campo].addEventListener('input', (evento) => acciones.actualizarCampo(campo, evento.target.value));
  }

  elForm.addEventListener('submit', (evento) => {
    evento.preventDefault();
    acciones.guardar();
  });
  botonCancelar.addEventListener('click', () => acciones.cancelarEdicion());

  let ultimoRenderizado = null;
  let alertaVista = null;
  let fallosVistos = 0;
  let editadoVisto = null;

  function render(f) {
    titulo.textContent = f.modo === 'editar' ? 'Editar curso' : 'Crear nuevo curso';
    botonEnviar.textContent = f.enviando ? 'Guardando…' : (f.modo === 'editar' ? 'Guardar cambios' : 'Crear curso');
    botonEnviar.disabled = f.enviando;
    botonCancelar.hidden = f.modo !== 'editar';

    // Valores y errores por campo (devueltos por el back-end)
    for (const campo of CAMPOS) {
      const entrada = entradas[campo];
      const valor = String(f.valores[campo] ?? '');
      if (entrada.value !== valor) entrada.value = valor;

      const mensajes = f.errores[campo] ?? [];
      entrada.closest('.field').classList.toggle('has-server-error', mensajes.length > 0);
      entrada.closest('.field').querySelector('.error-text').textContent = mensajes.join(' ');
      entrada.setAttribute('aria-invalid', mensajes.length > 0 ? 'true' : 'false');
    }

    // Alerta general (solo se vuelve a anunciar cuando su contenido cambia)
    const contenidoAlerta = JSON.stringify([f.errorGeneral, f.mensaje]);
    if (contenidoAlerta !== alertaVista) {
      alertaVista = contenidoAlerta;
      vaciar(alerta);
      if (f.errorGeneral) {
        alerta.append(crear('p', { class: 'alert alert--error', role: 'alert' }, f.errorGeneral));
      } else if (f.mensaje) {
        alerta.append(crear('p', { class: `alert alert--${f.mensaje.tipo}`, role: 'status' }, f.mensaje.texto));
      }
    }

    // Foco: al primer campo con error tras un envío rechazado, o al nombre al empezar a editar
    if (f.fallos !== fallosVistos) {
      fallosVistos = f.fallos;
      const primero = CAMPOS.find((campo) => (f.errores[campo] ?? []).length > 0);
      if (primero) entradas[primero].focus();
    }
    if (f.modo === 'editar' && f.cursoId !== editadoVisto) {
      editadoVisto = f.cursoId;
      elForm.scrollIntoView({ block: 'start' });
      entradas.nombre.focus();
    } else if (f.modo !== 'editar') {
      editadoVisto = null;
    }
  }

  store.suscribir(({ formulario }) => {
    if (formulario === ultimoRenderizado) return;
    ultimoRenderizado = formulario;
    render(formulario);
  });
}