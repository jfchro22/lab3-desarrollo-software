// URL de la API. Se define al construir con VITE_API_URL (ver movil/.env.example).
// Por omisión (desarrollo con emulador de Android) el emulador ve la PC en la dirección 10.0.2.2.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://10.0.2.2:8000/api';

// Punto de referencia aproximado (Liberia, Guanacaste) para calcular la distancia.
export const SEDE_REFERENCIA = {
  nombre: 'Liberia, Guanacaste (referencia aproximada)',
  latitud: 10.6346,
  longitud: -85.4377,
};
