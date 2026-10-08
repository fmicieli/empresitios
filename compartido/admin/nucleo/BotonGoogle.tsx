// Botón oficial "Iniciar sesión con Google" (Google Identity Services).
// Google entrega un "pase" firmado (credencial); el puente lo verifica y la planilla
// decide si ese correo puede entrar (correosAdmin).

import { useEffect, useRef, useState } from 'preact/hooks';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(op: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }): void;
          renderButton(el: HTMLElement, op: Record<string, unknown>): void;
        };
      };
    };
  }
}

let cargaScript: Promise<void> | null = null;
function cargarGoogle(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  cargaScript ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      cargaScript = null;
      mal(new Error('No cargó Google'));
    };
    document.head.appendChild(s);
  });
  return cargaScript;
}

export function BotonGoogle({
  clientId,
  alRecibir,
  alFallar,
}: {
  clientId: string;
  alRecibir: (credencial: string) => void;
  alFallar: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargarGoogle()
      .then(() => {
        if (!vivo || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => alRecibir(r.credential) });
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'es-419',
          width: Math.min(320, ref.current.clientWidth || 320),
        });
        setListo(true);
      })
      .catch(() => vivo && alFallar());
    return () => {
      vivo = false;
    };
  }, [clientId]);

  return <div ref={ref} class="boton-google" aria-busy={!listo} />;
}
