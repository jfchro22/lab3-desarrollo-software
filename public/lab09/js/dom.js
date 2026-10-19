/**
 * Utilidades para construir DOM sin innerHTML (evita inyección de HTML con datos de la API).
 * Interfaz pública: crear(etiqueta, atributos, ...hijos), vaciar(elemento).
 */

export function crear(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);

  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    elemento.setAttribute(clave, valor === true ? '' : valor);
  }

  elemento.append(...hijos.flat().filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false));
  return elemento;
}

export const vaciar = (elemento) => elemento.replaceChildren();