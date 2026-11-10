import { useCallback, useEffect, useState } from 'react';
import {
  IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage, IonRefresher, IonRefresherContent, IonTitle,
  IonToolbar, useIonToast, useIonViewWillEnter,
  type InfiniteScrollCustomEvent, type RefresherCustomEvent,
} from '@ionic/react';
import { add, cloudOfflineOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import EstadoVista, { type Estado } from '../components/EstadoVista';
import { useAuth } from '../contexto/AuthContext';
import { useRed } from '../hooks/useRed';
import { describirError, listarCursosApi, type Curso } from '../servicios/api';
import { formatearFecha, guardarCacheListado, leerCacheListado } from '../servicios/cache';

const ListadoPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, cerrarSesion } = useAuth();
  const conectado = useRed();
  const [presentarToast] = useIonToast();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<string | null>(null); // null = datos frescos

  const cargarPrimera = useCallback(async (mostrarCarga: boolean) => {
    if (mostrarCarga) setEstado('cargando');
    try {
      const respuesta = await listarCursosApi(1);
      setCursos(respuesta.data);
      setPagina(1);
      setHayMas(respuesta.meta.current_page < respuesta.meta.last_page);
      setActualizadoEn(null);
      setEstado(respuesta.data.length > 0 ? 'datos' : 'vacio');
      await guardarCacheListado(respuesta.data);
    } catch (error) {
      const detalle = describirError(error);
      if (detalle.sinConexion) {
        // Sin conectividad: se muestra el último listado guardado, marcado como no actualizado.
        const cache = await leerCacheListado();
        if (cache) {
          setCursos(cache.items);
          setHayMas(false);
          setActualizadoEn(cache.guardadoEn);
          setEstado(cache.items.length > 0 ? 'datos' : 'vacio');
          return;
        }
      }
      if (detalle.estado !== 401) { // el 401 lo gestiona el interceptor
        setMensajeError(detalle.mensaje);
        setEstado('error');
      }
    }
  }, []);

  const cargarMas = async () => {
    try {
      const siguiente = pagina + 1;
      const respuesta = await listarCursosApi(siguiente);
      const acumulado = [...cursos, ...respuesta.data];
      setCursos(acumulado);
      setPagina(siguiente);
      setHayMas(respuesta.meta.current_page < respuesta.meta.last_page);
      await guardarCacheListado(acumulado);
    } catch {
      setHayMas(false);
      void presentarToast({ message: 'No se pudieron cargar más cursos.', duration: 2500, color: 'danger' });
    }
  };

  useIonViewWillEnter(() => { void cargarPrimera(true); });

  // Al recuperar la conexión, se actualiza el listado automáticamente.
  useEffect(() => {
    if (conectado && actualizadoEn !== null) void cargarPrimera(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conectado]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cursos</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void cerrarSesion()}>Salir{usuario ? ` (${usuario.name})` : ''}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e: RefresherCustomEvent) => {
            await cargarPrimera(false);
            await e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        {(!conectado || actualizadoEn) && (
          <IonChip color="warning">
            <IonIcon icon={cloudOfflineOutline} />
            <IonLabel>
              {actualizadoEn
                ? `Información no actualizada · última actualización: ${formatearFecha(actualizadoEn)}`
                : 'Sin conexión'}
            </IonLabel>
          </IonChip>
        )}

        <EstadoVista
          estado={estado}
          mensajeVacio="Todavía no hay cursos registrados."
          mensajeError={mensajeError}
          onReintentar={() => void cargarPrimera(true)}
        >
          <IonList>
            {cursos.map((curso) => (
              <IonItem key={curso.id} button detail onClick={() => navigate(`/cursos/${curso.id}`)}>
                <IonLabel>
                  <h2>{curso.nombre}</h2>
                  <p>
                    {curso.creditos} créditos
                    {curso.profesor?.nombre ? ` · Prof. ${curso.profesor.nombre}` : ''}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          <IonInfiniteScroll
            disabled={!hayMas || actualizadoEn !== null}
            onIonInfinite={async (e: InfiniteScrollCustomEvent) => {
              await cargarMas();
              await e.target.complete();
            }}
          >
            <IonInfiniteScrollContent loadingText="Cargando más cursos…" />
          </IonInfiniteScroll>
        </EstadoVista>

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton aria-label="Nuevo curso" onClick={() => navigate('/cursos/nuevo')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ListadoPage;