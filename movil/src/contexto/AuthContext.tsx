import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import {
  cerrarSesionApi, establecerToken, iniciarSesionApi, registrarManejadorNoAutorizado, type Usuario,
} from '../servicios/api';
import { borrarCacheListado } from '../servicios/cache';

// El token se guarda en el almacenamiento CIFRADO del dispositivo (Android KeyStore, AES-GCM).
const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

interface Sesion {
  token: string | null;
  usuario: Usuario | null;
  listo: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<Sesion | null>(null);

export function useAuth(): Sesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);

  const limpiarLocal = useCallback(async () => {
    establecerToken(null);
    setToken(null);
    setUsuario(null);
    try {
      await SecureStorage.remove(CLAVE_TOKEN);
      await SecureStorage.remove(CLAVE_USUARIO);
    } catch { /* no había nada guardado */ }
    await borrarCacheListado();
  }, []);

  useEffect(() => {
    // Ante un 401 el interceptor llama a este manejador: se cierra la sesión
    // y RutaProtegida redirige al inicio de sesión.
    registrarManejadorNoAutorizado(limpiarLocal);
    let activo = true;

    const restaurar = async () => {
      try {
        const guardado = await SecureStorage.get(CLAVE_TOKEN, false);
        if (activo && typeof guardado === 'string' && guardado) {
          establecerToken(guardado);
          setToken(guardado);
          const crudo = await SecureStorage.get(CLAVE_USUARIO, false);
          if (typeof crudo === 'string') setUsuario(JSON.parse(crudo) as Usuario);
        }
      } catch { /* sin sesión guardada */ }
      if (activo) setListo(true);
    };
    void restaurar();

    return () => {
      activo = false;
      registrarManejadorNoAutorizado(null);
    };
  }, [limpiarLocal]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const resultado = await iniciarSesionApi(email, password);
    establecerToken(resultado.token);
    await SecureStorage.set(CLAVE_TOKEN, resultado.token);
    await SecureStorage.set(CLAVE_USUARIO, JSON.stringify(resultado.usuario));
    setToken(resultado.token);
    setUsuario(resultado.usuario);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try { await cerrarSesionApi(); } catch { /* token ya inválido o sin red */ }
    await limpiarLocal();
  }, [limpiarLocal]);

  const valor = useMemo(
    () => ({ token, usuario, listo, iniciarSesion, cerrarSesion }),
    [token, usuario, listo, iniciarSesion, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}