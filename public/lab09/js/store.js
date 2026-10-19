/**
 * Contenedor de estado observable (patrón "store").
 * Interfaz pública: crearStore(estadoInicial) → { obtener, actualizar, suscribir }.
 * Cada cambio de estado notifica a los suscriptores: así el estado dirige la vista.
 */
export function crearStore(estadoInicial) {
  let estado = estadoInicial;
  const suscriptores = new Set();

  return {
    obtener: () => estado,

    /** Acepta un objeto parcial o una función (estado) => parcial. */
    actualizar(cambio) {
      const parcial = typeof cambio === 'function' ? cambio(estado) : cambio;
      estado = { ...estado, ...parcial };
      suscriptores.forEach((suscriptor) => suscriptor(estado));
    },

    /** Registra un suscriptor y lo ejecuta de inmediato con el estado actual. */
    suscribir(suscriptor) {
      suscriptores.add(suscriptor);
      suscriptor(estado);
      return () => suscriptores.delete(suscriptor);
    },
  };
}