import { Preferences } from '@capacitor/preferences';
import type { Curso } from './api';

// La caché del listado no es un secreto, por eso va en Preferences.
// El TOKEN nunca se guarda aquí: usa almacenamiento cifrado (AuthContext).
const CLAVE = 'cache.listado';

export interface CacheListado { items: Curso[]; guardadoEn: string }

export async function guardarCacheListado(items: Curso[]) {
  const cache: CacheListado = { items, guardadoEn: new Date().toISOString() };
  await Preferences.set({ key: CLAVE, value: JSON.stringify(cache) });
}

export async function leerCacheListado(): Promise<CacheListado | null> {
  const { value } = await Preferences.get({ key: CLAVE });
  if (!value) return null;
  try { return JSON.parse(value) as CacheListado; } catch { return null; }
}

export async function borrarCacheListado() {
  await Preferences.remove({ key: CLAVE });
}

export const formatearFecha = (iso: string) => new Date(iso).toLocaleString('es-CR');