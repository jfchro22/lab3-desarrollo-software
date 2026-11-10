import type { ReactElement } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';

/** Componente envolvente: sin sesión activa redirige al login (también tras un 401). */
const RutaProtegida: React.FC<{ children: ReactElement }> = ({ children }) => {
  const { token, listo } = useAuth();

  if (!listo) {
    return (
      <IonPage>
        <IonContent>
          <div className="centrado"><IonSpinner name="crescent" /></div>
        </IonContent>
      </IonPage>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

export default RutaProtegida;