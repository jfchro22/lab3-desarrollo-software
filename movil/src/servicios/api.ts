import axios, { type AxiosError } from 'axios';
import { API_URL } from '../config';

export interface Usuario { id: number; name: string; email: string; role: string }
export interface Categoria { id: number; nombre: string }
export interface Curso {
  id: number;
  nombre: string;
  creditos: number;
  profesor_id?: number;
  profesor?: { id?: number; nombre?: string } | null;
  categorias?: Categoria[];
}
export interface DatosCurso {
  nombre: string;
  creditos: number | string | null;
  profesor_id: number | string | null;
  categoria_ids: (number | string | null)[];
}
export interface Paginado {
  data: Curso[];
  meta: { current_page: number; last_page: number; total: number };
}
export interface ErrorApi {
  mensaje: string;
  estado: number;
  errores: Record<string, string[]>;
  sinConexion: boolean;
}

let tokenActual: string | null = null;
let alNoAutorizado: (() => Promise<void> | void) | null = null;

export const establecerToken = (token: string | null) => { tokenActual = token; };
export const registrarManejadorNoAutorizado = (manejador: (() => Promise<void> | void) | null) => {
  alNoAutorizado = manejador;
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// ---- PUNTO ÚNICO DE INTERCEPCIÓN ----
// Adjunta el token a TODA solicitud (ninguna llamada lo agrega a mano).
api.interceptors.request.use((config) => {
  if (tokenActual) config.headers.Authorization = `Bearer ${tokenActual}`;
  return config;
});

// Ante un 401 (fuera del login) cierra la sesión; la ruta protegida redirige al login.
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const esLogin = error.config?.url?.includes('/login') ?? false;
    if (error.response?.status === 401 && !esLogin) await alNoAutorizado?.();
    return Promise.reject(error);
  },
);

/** Convierte cualquier error en un objeto uniforme; agrupa 'categoria_ids.0' bajo 'categoria_ids'. */
export function describirError(error: unknown): ErrorApi {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return { mensaje: 'No se pudo conectar con el servidor.', estado: 0, errores: {}, sinConexion: true };
    }
    const datos = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const errores: Record<string, string[]> = {};
    for (const [clave, mensajes] of Object.entries(datos?.errors ?? {})) {
      const campo = clave.split('.')[0];
      errores[campo] = [...(errores[campo] ?? []), ...mensajes];
    }
    return {
      mensaje: datos?.message ?? `Error ${error.response.status}`,
      estado: error.response.status,
      errores,
      sinConexion: false,
    };
  }
  return { mensaje: 'Ocurrió un error inesperado.', estado: -1, errores: {}, sinConexion: false };
}

export async function iniciarSesionApi(email: string, password: string) {
  const { data } = await api.post<{ usuario: Usuario; token: string; expira_en: string }>('/login', { email, password });
  return data;
}

export async function cerrarSesionApi() {
  await api.post('/logout');
}

export async function listarCursosApi(pagina: number): Promise<Paginado> {
  const { data } = await api.get<Paginado>('/cursos', { params: { page: pagina, per_page: 10 } });
  return data;
}

export async function obtenerCursoApi(id: number): Promise<Curso> {
  const { data } = await api.get<{ data: Curso }>(`/cursos/${id}`);
  return data.data;
}

export async function crearCursoApi(datos: DatosCurso): Promise<Curso> {
  const { data } = await api.post<{ data: Curso }>('/cursos', datos);
  return data.data;
}

export async function actualizarCursoApi(id: number, datos: DatosCurso): Promise<Curso> {
  const { data } = await api.put<{ data: Curso }>(`/cursos/${id}`, datos);
  return data.data;
}