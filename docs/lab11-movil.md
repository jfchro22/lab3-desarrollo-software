# Laboratorio 11 — Aplicación móvil (Ionic React + Capacitor)

Carpeta `movil/` (incluye la plataforma nativa `movil/android/`).

## Decisiones de diseño
- Ionic React con enrutamiento de React Router 6: carga diferida con `React.lazy` + `Suspense` por página, parámetros de ruta (`/cursos/:id`, `/cursos/:id/editar`) y `RutaProtegida` como componente envolvente.
- Tras autenticarse se navega con `replace`, por lo que el botón de retroceso de Android no vuelve al login.
- Servicio de API con axios: un único interceptor adjunta el token; ante un 401 cierra la sesión y la ruta protegida redirige al login.
- Estados de carga, vacío y error con reintento en un solo componente reutilizable (`EstadoVista`).
- Listado con recarga por arrastre (`IonRefresher`) y desplazamiento infinito (`IonInfiniteScroll`).
- Las páginas usan `IonPage`/`IonHeader`/`IonToolbar`, que respetan las áreas seguras del dispositivo.

## Complementos de Capacitor
| Complemento | Uso |
|---|---|
| `@aparajita/capacitor-secure-storage` | Token y usuario en almacenamiento cifrado (Android KeyStore, AES-GCM) |
| `@capacitor/network` | Detectar conectividad y avisar que los datos no están actualizados |
| `@capacitor/preferences` | Caché del último listado (no se usa para el token) |
| `@capacitor/geolocation` | Componente de hardware: distancia del usuario a la sede |

## Permisos (AndroidManifest.xml)
`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `ACCESS_NETWORK_STATE`. Se solicitan en tiempo de ejecución; si el estado es `denied` (denegación permanente) se muestra un aviso con las instrucciones para activarlo en Ajustes.

## Operación sin conectividad
Cada listado exitoso se guarda en caché. Sin red, se muestra el último listado con el aviso "Información no actualizada" y su marca de tiempo; al volver la conexión se actualiza solo.