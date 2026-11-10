import { Suspense, lazy, type ReactElement } from 'react';
import { IonApp, IonContent, IonPage, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route } from 'react-router-dom';

import RutaProtegida from './components/RutaProtegida';
import { AuthProvider } from './contexto/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/app.css';

setupIonicReact();

// Carga diferida: cada página se descarga solo cuando se navega a ella.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ListadoPage = lazy(() => import('./pages/ListadoPage'));
const DetallePage = lazy(() => import('./pages/DetallePage'));
const FormularioPage = lazy(() => import('./pages/FormularioPage'));

const Cargando: React.FC = () => (
  <IonPage>
    <IonContent>
      <div className="centrado"><IonSpinner name="crescent" /></div>
    </IonContent>
  </IonPage>
);

const conCarga = (pagina: ReactElement) => <Suspense fallback={<Cargando />}>{pagina}</Suspense>;
const privada = (pagina: ReactElement) => conCarga(<RutaProtegida>{pagina}</RutaProtegida>);

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" element={conCarga(<LoginPage />)} />
          <Route path="/cursos" element={privada(<ListadoPage />)} />
          <Route path="/cursos/nuevo" element={privada(<FormularioPage />)} />
          <Route path="/cursos/:id" element={privada(<DetallePage />)} />
          <Route path="/cursos/:id/editar" element={privada(<FormularioPage />)} />
          <Route path="/" element={<Navigate to="/cursos" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;