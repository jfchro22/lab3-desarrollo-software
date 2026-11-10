import { useCallback, useState } from 'react';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonPage, IonSpinner, IonText,
  IonTitle, IonToolbar, useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import EstadoVista, { type Estado } from '../components/EstadoVista';
import {
  actualizarCursoApi, crearCursoApi, describirError, obtenerCursoApi, type DatosCurso,
} from '../servicios/api';

interface Valores { nombre: string; creditos: string; profesor_id: string; categoria_ids: string }
const VACIOS: Valores = { nombre: '', creditos: '', profesor_id: '', categoria_ids: '' };

const aNumero = (texto: string): number | string | null => {
  const limpio = texto.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isNaN(numero) ? limpio : numero; // si no es número, que el back-end lo rechace por campo
};

const FormularioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const editando = id !== undefined;
  const navigate = useNavigate();
  const [presentarToast] = useIonToast();

  const [valores, setValores] = useState<Valores>(VACIOS);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('datos');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const reiniciar = useCallback(async () => {
    setErrores({});
    setErrorGeneral(null);
    if (!editando) {
      setValores(VACIOS);
      setEstado('datos');
      return;
    }
    setEstado('cargando');
    try {
      const curso = await obtenerCursoApi(Number(id));
      setValores({
        nombre: curso.nombre ?? '',
        creditos: String(curso.creditos ?? ''),
        profesor_id: String(curso.profesor_id ?? curso.profesor?.id ?? ''),
        categoria_ids: (curso.categorias ?? []).map((categoria) => categoria.id).join(', '),
      });
      setEstado('datos');
    } catch (error) {
      const detalle = describirError(error);
      if (detalle.estado !== 401) {
        setMensajeError(detalle.mensaje);
        setEstado('error');
      }
    }
  }, [editando, id]);

  useIonViewWillEnter(() => { void reiniciar(); });

  const guardar = async () => {
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);

    const cuerpo: DatosCurso = {
      nombre: valores.nombre.trim(),
      creditos: aNumero(valores.creditos),
      profesor_id: aNumero(valores.profesor_id),
      categoria_ids: valores.categoria_ids.split(',').map((texto) => texto.trim()).filter(Boolean).map(aNumero),
    };

    try {
      if (editando) await actualizarCursoApi(Number(id), cuerpo);
      else await crearCursoApi(cuerpo);
      void presentarToast({ message: editando ? 'Curso actualizado' : 'Curso creado', duration: 2000, color: 'success' });
      navigate(-1);
    } catch (error) {
      const detalle = describirError(error);
      if (detalle.estado === 422) {
        setErrores(detalle.errores); // errores de validación del back-end, por campo
        setErrorGeneral('Revise los campos marcados.');
      } else if (detalle.estado !== 401) {
        setErrorGeneral(detalle.mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  const clase = (campo: string, extra = '') =>
    `${errores[campo] ? 'ion-invalid ion-touched' : ''} ${extra}`.trim();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/cursos" /></IonButtons>
          <IonTitle>{editando ? 'Editar curso' : 'Nuevo curso'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <EstadoVista estado={estado} mensajeError={mensajeError} onReintentar={() => void reiniciar()}>
          <IonInput
            label="Nombre del curso" labelPlacement="floating" fill="outline"
            value={valores.nombre} className={clase('nombre')} errorText={errores.nombre?.join(' ')}
            onIonInput={(e) => setValores((v) => ({ ...v, nombre: String(e.detail.value ?? '') }))}
          />
          <IonInput
            label="Créditos" labelPlacement="floating" fill="outline" type="number" inputmode="numeric"
            value={valores.creditos} className={clase('creditos', 'ion-margin-top')} errorText={errores.creditos?.join(' ')}
            onIonInput={(e) => setValores((v) => ({ ...v, creditos: String(e.detail.value ?? '') }))}
          />
          <IonInput
            label="ID del profesor" labelPlacement="floating" fill="outline" type="number" inputmode="numeric"
            value={valores.profesor_id} className={clase('profesor_id', 'ion-margin-top')} errorText={errores.profesor_id?.join(' ')}
            onIonInput={(e) => setValores((v) => ({ ...v, profesor_id: String(e.detail.value ?? '') }))}
          />
          <IonInput
            label="IDs de categorías" labelPlacement="floating" fill="outline"
            helperText="Separados por coma. Ej. 1, 2"
            value={valores.categoria_ids} className={clase('categoria_ids', 'ion-margin-top')} errorText={errores.categoria_ids?.join(' ')}
            onIonInput={(e) => setValores((v) => ({ ...v, categoria_ids: String(e.detail.value ?? '') }))}
          />

          {errorGeneral && <IonText color="danger" role="alert"><p>{errorGeneral}</p></IonText>}

          <IonButton expand="block" className="ion-margin-top" disabled={enviando} onClick={() => void guardar()}>
            {enviando ? <IonSpinner name="dots" /> : (editando ? 'Guardar cambios' : 'Crear curso')}
          </IonButton>
        </EstadoVista>
      </IonContent>
    </IonPage>
  );
};

export default FormularioPage;