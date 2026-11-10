import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cr.ac.ucr.matricula',
  appName: 'Matrícula UCR',
  webDir: 'dist',
  // La API local va por HTTP (sin certificado): se permite tráfico sin cifrar.
  server: { androidScheme: 'http', cleartext: true },
  android: { allowMixedContent: true },
};

export default config;