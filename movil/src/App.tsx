import { Suspense, lazy, useEffect, type ReactElement } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
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

// Carga diferida: cada página es un fragmento (chunk) aparte que se descarga bajo demanda.
const paginas = {
  login: () => import('./pages/LoginPage'),
  listado: () => import('./pages/ListadoPage'),
  detalle: () => import('./pages/DetallePage'),
  formulario: () => import('./pages/FormularioPage'),
};
const LoginPage = lazy(paginas.login);
const ListadoPage = lazy(paginas.listado);
const DetallePage = lazy(paginas.detalle);
const FormularioPage = lazy(paginas.formulario);

// Un solo Suspense FUERA del IonRouterOutlet: si Suspense estuviera dentro de cada ruta, la página
// se montaría después de la transición de Ionic y quedaría en blanco (ion-page-invisible).
const Cargando: React.FC = () => (
  <div className="centrado"><IonSpinner name="crescent" /></div>
);

const privada = (pagina: ReactElement) => <RutaProtegida>{pagina}</RutaProtegida>;

const App: React.FC = () => {
  // Precarga los fragmentos de las páginas internas apenas arranca la app, para que ya estén
  // resueltos (sin suspender) cuando el usuario navega a ellas por primera vez.
  useEffect(() => {
    void paginas.listado().catch(() => undefined);
    void paginas.detalle().catch(() => undefined);
    void paginas.formulario().catch(() => undefined);
  }, []);

  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <Suspense fallback={<Cargando />}>
            <IonRouterOutlet>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cursos" element={privada(<ListadoPage />)} />
              <Route path="/cursos/nuevo" element={privada(<FormularioPage />)} />
              <Route path="/cursos/:id" element={privada(<DetallePage />)} />
              <Route path="/cursos/:id/editar" element={privada(<FormularioPage />)} />
              <Route path="/" element={<Navigate to="/cursos" replace />} />
            </IonRouterOutlet>
          </Suspense>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
