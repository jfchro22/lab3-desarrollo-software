import type { ReactNode } from 'react';
import { IonButton, IonSpinner, IonText } from '@ionic/react';

export type Estado = 'cargando' | 'vacio' | 'error' | 'datos';

interface Props {
  estado: Estado;
  mensajeVacio?: string;
  mensajeError?: string | null;
  onReintentar: () => void;
  children: ReactNode;
}

/** Estados de carga, vacío y error (con reintento) reutilizados en todas las páginas. */
const EstadoVista: React.FC<Props> = ({
  estado, mensajeVacio = 'No hay información para mostrar.', mensajeError, onReintentar, children,
}) => {
  if (estado === 'cargando') {
    return (
      <div className="centrado" role="status">
        <IonSpinner name="crescent" />
        <IonText color="medium"><p>Cargando…</p></IonText>
      </div>
    );
  }
  if (estado === 'vacio') {
    return (
      <div className="centrado">
        <IonText color="medium"><p>{mensajeVacio}</p></IonText>
        <IonButton fill="outline" onClick={onReintentar}>Actualizar</IonButton>
      </div>
    );
  }
  if (estado === 'error') {
    return (
      <div className="centrado" role="alert">
        <IonText color="danger"><p>{mensajeError ?? 'Ocurrió un error.'}</p></IonText>
        <IonButton onClick={onReintentar}>Reintentar</IonButton>
      </div>
    );
  }
  return <>{children}</>;
};

export default EstadoVista;