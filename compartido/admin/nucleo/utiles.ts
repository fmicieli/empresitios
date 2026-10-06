import { useEffect, useState } from 'preact/hooks';

/** Ruta interna del admin a partir de la dirección: "#/pedidos/1004" → ["pedidos", "1004"]. */
export function leerRuta(): string[] {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRuta(): string[] {
  const [ruta, setRuta] = useState(leerRuta);
  useEffect(() => {
    const cambio = () => setRuta(leerRuta());
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return ruta;
}

export function irA(...ruta: string[]) {
  location.hash = '#/' + ruta.map(encodeURIComponent).join('/');
  window.scrollTo(0, 0);
}

export function useEsEscritorio(ancho = 1000): boolean {
  const consulta = `(min-width: ${ancho}px)`;
  const [es, setEs] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(consulta).matches);
  useEffect(() => {
    const mq = matchMedia(consulta);
    const cambio = () => setEs(mq.matches);
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);
  return es;
}

/** Se vuelve a dibujar cada `ms` (para "vence en 23 h" y "hace 5 min"). */
export function useTic(ms = 60000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
