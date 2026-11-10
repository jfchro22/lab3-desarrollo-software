import { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonPage, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { describirError } from '../servicios/api';

const LoginPage: React.FC = () => {
  const { token, iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Con sesión activa no se muestra el login. Al autenticarse, replace evita que el
  // botón de retroceso de Android vuelva a esta pantalla.
  if (token) return <Navigate to="/cursos" replace />;

  const enviar = async () => {
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (error) {
      const detalle = describirError(error);
      setErrores(detalle.errores);
      setErrorGeneral(detalle.estado === 422 ? 'Revise los campos marcados.' : detalle.mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Iniciar sesión</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={(evento) => { evento.preventDefault(); void enviar(); }}>
          <IonInput
            label="Correo electrónico" labelPlacement="floating" fill="outline"
            type="email" autocomplete="username" value={email}
            className={errores.email ? 'ion-invalid ion-touched' : ''}
            errorText={errores.email?.join(' ')}
            onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
          />
          <IonInput
            label="Contraseña" labelPlacement="floating" fill="outline"
            type="password" autocomplete="current-password" value={password}
            className={errores.password ? 'ion-invalid ion-touched ion-margin-top' : 'ion-margin-top'}
            errorText={errores.password?.join(' ')}
            onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
          />
          {errorGeneral && (
            <IonText color="danger" role="alert"><p>{errorGeneral}</p></IonText>
          )}
          <IonButton expand="block" type="submit" className="ion-margin-top" disabled={enviando}>
            {enviando ? <IonSpinner name="dots" /> : 'Iniciar sesión'}
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;