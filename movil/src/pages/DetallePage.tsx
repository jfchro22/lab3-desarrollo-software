import { useCallback, useState } from 'react';
import {
  IonAlert, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonContent, IonHeader, IonLabel, IonPage, IonSpinner, IonText, IonTitle, IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import EstadoVista, { type Estado } from '../components/EstadoVista';
import { SEDE_REFERENCIA } from '../config';
import { describirError, obtenerCursoApi, type Curso } from '../servicios/api';
import { asegurarPermisoUbicacion, distanciaKm, obtenerPosicion, SEDE } from '../servicios/ubicacion';

const DetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [distancia, setDistancia] = useState<number | null>(null);
  const [midiendo, setMidiendo] = useState(false);
  const [mensajeUbicacion, setMensajeUbicacion] = useState<string | null>(null);
  const [permisoPermanente, setPermisoPermanente] = useState(false);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      setCurso(await obtenerCursoApi(Number(id)));
      setEstado('datos');
    } catch (error) {
      const detalle = describirError(error);
      if (detalle.estado === 404) {
        setEstado('vacio');
      } else if (detalle.estado !== 401) {
        setMensajeError(detalle.mensaje);
        setEstado('error');
      }
    }
  }, [id]);

  useIonViewWillEnter(() => { void cargar(); });

  // Componente de hardware: geolocalización (permisos declarados en AndroidManifest.xml).
  const calcularDistancia = async () => {
    setMidiendo(true);
    setMensajeUbicacion(null);
    try {
      const permiso = await asegurarPermisoUbicacion();
      if (permiso === 'denegado-permanente') {
        setPermisoPermanente(true);
        setMensajeUbicacion('El permiso de ubicación está denegado de forma permanente. Actívelo en Ajustes > Aplicaciones > esta app > Permisos > Ubicación.');
        return;
      }
      if (permiso === 'denegado') {
        setMensajeUbicacion('Se necesita el permiso de ubicación para calcular la distancia.');
        return;
      }
      setDistancia(distanciaKm(await obtenerPosicion(), SEDE));
    } catch {
      setMensajeUbicacion('No se pudo obtener la ubicación. Verifique que el GPS esté activado.');
    } finally {
      setMidiendo(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/cursos" /></IonButtons>
          <IonTitle>Detalle del curso</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <EstadoVista
          estado={estado}
          mensajeVacio="El curso no existe o fue eliminado."
          mensajeError={mensajeError}
          onReintentar={() => void cargar()}
        >
          {curso && (
            <>
              <IonCard>
                <IonCardHeader><IonCardTitle>{curso.nombre}</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  <p>{curso.creditos} créditos</p>
                  <p>{curso.profesor?.nombre ? `Profesor: ${curso.profesor.nombre}` : 'Sin profesor asignado'}</p>
                  {(curso.categorias ?? []).map((categoria) => (
                    <IonChip key={categoria.id}><IonLabel>{categoria.nombre}</IonLabel></IonChip>
                  ))}
                  <IonButton expand="block" className="ion-margin-top" onClick={() => navigate(`/cursos/${curso.id}/editar`)}>
                    Editar curso
                  </IonButton>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader><IonCardTitle>Distancia a la sede</IonCardTitle></IonCardHeader>
                <IonCardContent>
                  {distancia !== null && (
                    <p>Está a {distancia.toFixed(1)} km de {SEDE_REFERENCIA.nombre}.</p>
                  )}
                  {mensajeUbicacion && <IonText color="warning"><p>{mensajeUbicacion}</p></IonText>}
                  <IonButton expand="block" disabled={midiendo} onClick={() => void calcularDistancia()}>
                    {midiendo ? <IonSpinner name="dots" /> : 'Calcular mi distancia'}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </EstadoVista>

        <IonAlert
          isOpen={permisoPermanente}
          header="Permiso de ubicación denegado"
          message="Denegó el permiso de forma permanente. Para usar esta función, actívelo en Ajustes > Aplicaciones > esta app > Permisos > Ubicación."
          buttons={['Entendido']}
          onDidDismiss={() => setPermisoPermanente(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default DetallePage;
