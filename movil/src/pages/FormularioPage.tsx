import { useCallback, useState } from 'react';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonPage, IonSelect, IonSelectOption,
  IonSpinner, IonText, IonTitle, IonToolbar, useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import EstadoVista, { type Estado } from '../components/EstadoVista';
import {
  actualizarCursoApi, crearCursoApi, describirError, listarCategoriasApi, listarProfesoresApi,
  obtenerCursoApi, type Categoria, type DatosCurso, type Profesor,
} from '../servicios/api';

interface Valores { nombre: string; creditos: string; profesor_id: number | null; categoria_ids: number[] }
const VACIOS: Valores = { nombre: '', creditos: '', profesor_id: null, categoria_ids: [] };

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
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('datos');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const reiniciar = useCallback(async () => {
    setErrores({});
    setErrorGeneral(null);
    setEstado('cargando');
    try {
      // Las listas de profesores y categorías vienen de la API: la persona elige, no escribe IDs.
      const [listaProfesores, listaCategorias] = await Promise.all([listarProfesoresApi(), listarCategoriasApi()]);
      setProfesores(listaProfesores);
      setCategorias(listaCategorias);

      if (!editando) {
        setValores(VACIOS);
      } else {
        const curso = await obtenerCursoApi(Number(id));
        setValores({
          nombre: curso.nombre ?? '',
          creditos: String(curso.creditos ?? ''),
          profesor_id: curso.profesor_id ?? curso.profesor?.id ?? null,
          categoria_ids: (curso.categorias ?? []).map((categoria) => categoria.id),
        });
      }
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
      profesor_id: valores.profesor_id,
      categoria_ids: valores.categoria_ids,
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

  const mensaje = (campo: string) =>
    errores[campo] ? <IonText color="danger" role="alert"><small>{errores[campo].join(' ')}</small></IonText> : null;

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

          <IonSelect
            label="Profesor" labelPlacement="floating" fill="outline" placeholder="Seleccione un profesor"
            value={valores.profesor_id} className={clase('profesor_id', 'ion-margin-top')}
            onIonChange={(e) => setValores((v) => ({ ...v, profesor_id: (e.detail.value as number | null) ?? null }))}
          >
            {profesores.map((profesor) => (
              <IonSelectOption key={profesor.id} value={profesor.id}>{profesor.nombre}</IonSelectOption>
            ))}
          </IonSelect>
          {mensaje('profesor_id')}

          <IonSelect
            label="Categorías" labelPlacement="floating" fill="outline" multiple placeholder="Seleccione una o más"
            value={valores.categoria_ids} className={clase('categoria_ids', 'ion-margin-top')}
            onIonChange={(e) => setValores((v) => ({ ...v, categoria_ids: (e.detail.value as number[] | undefined) ?? [] }))}
          >
            {categorias.map((categoria) => (
              <IonSelectOption key={categoria.id} value={categoria.id}>{categoria.nombre}</IonSelectOption>
            ))}
          </IonSelect>
          {mensaje('categoria_ids')}

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
