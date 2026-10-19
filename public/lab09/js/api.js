/**
 * Módulo de acceso a la API.
 * Interfaz pública: ApiError, ApiClient.
 * La clase encapsula la URL base, el token y el manejo uniforme de errores:
 * toda respuesta no exitosa se convierte en un ApiError.
 */

export class ApiError extends Error {
  constructor(mensaje, { estado = 0, errores = {}, codigo = null } = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;   // código HTTP (0 = sin conexión)
    this.errores = errores; // errores de validación por campo (422)
    this.codigo = codigo;   // rule_code de las reglas de negocio
  }
}

export class ApiClient {
  #baseUrl;
  #obtenerToken;
  #alExpirarSesion;

  /**
   * @param {object}   opciones
   * @param {string}   opciones.baseUrl         URL base de la API (ej. '/api')
   * @param {Function} opciones.obtenerToken    () => token | null
   * @param {Function} opciones.alExpirarSesion se invoca ante cualquier 401 de una ruta protegida
   */
  constructor({ baseUrl, obtenerToken, alExpirarSesion }) {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
    this.#obtenerToken = obtenerToken;
    this.#alExpirarSesion = alExpirarSesion;
  }

  async #solicitar(metodo, ruta, { params, cuerpo, signal, publica = false, omitirRedireccion = false } = {}) {
    const url = new URL(`${this.#baseUrl}${ruta}`, window.location.origin);
    for (const [clave, valor] of Object.entries(params ?? {})) {
      if (valor !== null && valor !== undefined && valor !== '') url.searchParams.set(clave, valor);
    }

    const cabeceras = { Accept: 'application/json' };
    const token = this.#obtenerToken?.();
    if (token && !publica) cabeceras.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

    let respuesta;
    try {
      respuesta = await fetch(url, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error; // solicitud cancelada a propósito
      throw new ApiError('No se pudo conectar con el servidor. Verifique su conexión.', { estado: 0, codigo: 'red' });
    }

    const datos = await this.#leerJson(respuesta);
    if (respuesta.ok) return datos;

    if (respuesta.status === 401 && !publica && !omitirRedireccion) {
      await this.#alExpirarSesion?.();
    }

    throw new ApiError(datos?.message ?? `Error inesperado (${respuesta.status}).`, {
      estado: respuesta.status,
      errores: datos?.errors ?? {},
      codigo: datos?.rule_code ?? null,
    });
  }

  async #leerJson(respuesta) {
    if (respuesta.status === 204) return null;
    try { return await respuesta.json(); } catch { return null; }
  }

  login(email, password) {
    return this.#solicitar('POST', '/login', { cuerpo: { email, password }, publica: true });
  }

  logout() {
    return this.#solicitar('POST', '/logout', { omitirRedireccion: true });
  }

  listarCursos(params, { signal } = {}) {
    return this.#solicitar('GET', '/cursos', { params, signal });
  }

  crearCurso(datos) {
    return this.#solicitar('POST', '/cursos', { cuerpo: datos });
  }

  actualizarCurso(id, datos) {
    return this.#solicitar('PUT', `/cursos/${id}`, { cuerpo: datos });
  }
}