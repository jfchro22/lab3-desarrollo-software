import type { CapacitorConfig } from '@capacitor/cli';

// CAP_PROD=1 -> paquete de producción: la API va por HTTPS, sin tráfico sin cifrar.
// Sin CAP_PROD (desarrollo): la API local va por HTTP (10.0.2.2), por eso se permite tráfico sin cifrar.
const produccion = process.env.CAP_PROD === '1';

const config: CapacitorConfig = {
  appId: 'cr.ac.ucr.matricula',
  appName: 'Matrícula UCR',
  webDir: 'dist',
  server: produccion ? { androidScheme: 'https' } : { androidScheme: 'http', cleartext: true },
  android: produccion ? {} : { allowMixedContent: true },
};

export default config;
