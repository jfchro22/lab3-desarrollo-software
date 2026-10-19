/**
 * Utilidades asíncronas. Interfaz pública: esperar(ms), debounce(funcion, ms).
 */

/** Promesa que se resuelve después de `ms` milisegundos. */
export const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retraso de entrada (debounce) basado en promesas: solo ejecuta la última llamada
 * si pasan `ms` milisegundos sin que llegue otra.
 */
export function debounce(funcion, ms) {
  let ultimaLlamada = 0;

  return async (...argumentos) => {
    const identificador = ++ultimaLlamada;
    await esperar(ms);
    if (identificador !== ultimaLlamada) return undefined;
    return funcion(...argumentos);
  };
}