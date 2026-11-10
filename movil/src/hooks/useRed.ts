import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

/** true si hay conexión; se actualiza solo cuando cambia el estado de la red. */
export function useRed(): boolean {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    let activo = true;
    const escucha = Network.addListener('networkStatusChange', (estado) => setConectado(estado.connected));
    void Network.getStatus().then((estado) => { if (activo) setConectado(estado.connected); });

    return () => {
      activo = false;
      void escucha.then((manejador) => manejador.remove());
    };
  }, []);

  return conectado;
}