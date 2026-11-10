import { Geolocation } from '@capacitor/geolocation';
import { SEDE_REFERENCIA } from '../config';

export type ResultadoPermiso = 'concedido' | 'denegado' | 'denegado-permanente';
export interface Posicion { latitud: number; longitud: number }

export const SEDE: Posicion = { latitud: SEDE_REFERENCIA.latitud, longitud: SEDE_REFERENCIA.longitud };

/**
 * Estados de permiso de Capacitor: 'prompt' (nunca pedido), 'prompt-with-rationale'
 * (denegado una vez), 'denied' (denegado de forma permanente) y 'granted'.
 */
export async function asegurarPermisoUbicacion(): Promise<ResultadoPermiso> {
  const actual = (await Geolocation.checkPermissions()).location;
  if (actual === 'granted') return 'concedido';
  if (actual === 'denied') return 'denegado-permanente';

  const solicitado = (await Geolocation.requestPermissions({ permissions: ['location'] })).location;
  if (solicitado === 'granted') return 'concedido';
  return solicitado === 'denied' ? 'denegado-permanente' : 'denegado';
}

export async function obtenerPosicion(): Promise<Posicion> {
  const posicion = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude };
}

/** Distancia en km entre dos puntos (fórmula de haversine). */
export function distanciaKm(a: Posicion, b: Posicion): number {
  const radio = 6371;
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLng = rad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * radio * Math.asin(Math.sqrt(h));
}