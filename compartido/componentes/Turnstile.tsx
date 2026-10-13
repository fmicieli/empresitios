// Turnstile: el "no soy un robot" de Cloudflare (D-16). Casi siempre es invisible:
// solo aparece una casilla si Cloudflare tiene dudas. Cada pase sirve para un solo pedido.

import { useEffect, useRef } from 'preact/hooks';

interface ApiTurnstile {
  render(el: HTMLElement, op: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

let carga: Promise<ApiTurnstile> | null = null;
function cargarTurnstile(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  carga ??= new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : mal(new Error('Sin Turnstile')));
    s.onerror = () => {
      carga = null;
      mal(new Error('No cargó Turnstile'));
    };
    document.head.appendChild(s);
  });
  return carga;
}

const ESPERA_MAXIMA = 15000;

/**
 * Prepara el pase anti-robots. Sin clave de sitio no hace nada (modo de prueba).
 * `obtener()` espera el pase si todavía no llegó; `reiniciar()` pide uno nuevo después de usarlo.
 */
export function useTurnstile(siteKey: string) {
  const refCaja = useRef<HTMLDivElement>(null);
  const pase = useRef<string | null>(null);
  const esperando = useRef<((p: string | null) => void)[]>([]);
  const widget = useRef<{ api: ApiTurnstile; id: string } | null>(null);

  const entregar = (p: string | null) => {
    pase.current = p;
    if (p) esperando.current.splice(0).forEach((f) => f(p));
  };

  useEffect(() => {
    if (!siteKey) return;
    let vivo = true;
    cargarTurnstile()
      .then((api) => {
        if (!vivo || !refCaja.current) return;
        const id = api.render(refCaja.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          language: 'es',
          callback: (p: string) => entregar(p),
          'expired-callback': () => {
            pase.current = null;
            api.reset(id);
          },
          'error-callback': () => entregar(null),
        });
        widget.current = { api, id };
      })
      .catch(() => {
        /* sin pase: el puente responde "antiRobot" y el comprador ve cómo seguir */
      });
    return () => {
      vivo = false;
      if (widget.current) widget.current.api.remove(widget.current.id);
      widget.current = null;
    };
  }, [siteKey]);

  return {
    /** Va en un <div> fijo del formulario: ahí aparece la casilla si hace falta. */
    refCaja,
    async obtener(): Promise<string | undefined> {
      if (!siteKey) return undefined;
      if (pase.current) return pase.current;
      const p = await new Promise<string | null>((ok) => {
        esperando.current.push(ok);
        setTimeout(() => ok(null), ESPERA_MAXIMA);
      });
      return p ?? '';
    },
    reiniciar() {
      pase.current = null;
      if (widget.current) widget.current.api.reset(widget.current.id);
    },
  };
}
