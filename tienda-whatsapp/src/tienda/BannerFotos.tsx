// Banner de solo fotos (D-29): pasan solas con un fundido, sin texto ni controles.
// Accesibilidad (WCAG 2.2.2): da 3 vueltas y queda fijo en la primera foto, se frena con el mouse encima
// y con "reducir movimiento" activado en el teléfono o la computadora no se mueve nunca.

import { useEffect, useState } from 'preact/hooks';
import { config } from '../lib/contexto';

const CADA = 5000; // milisegundos entre fotos
const VUELTAS = 3;

export function BannerFotos() {
  const b = config.inicio.banner;
  const fotos = b.fotos;
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [pasos, setPasos] = useState(0);
  const [quieto] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const terminado = pasos >= fotos.length * VUELTAS;

  useEffect(() => {
    if (fotos.length < 2 || quieto || pausado || terminado) return;
    const reloj = setInterval(() => {
      // Con la pestaña oculta no avanza: así no se gastan las vueltas sin que nadie las vea.
      if (document.visibilityState === 'hidden') return;
      setActual((i) => (i + 1) % fotos.length);
      setPasos((n) => n + 1);
    }, CADA);
    return () => clearInterval(reloj);
  }, [pausado, terminado, quieto, fotos.length]);

  return (
    <section
      class="banner-fotos"
      aria-labelledby="titulo-banner"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <h1 id="titulo-banner" class="sr">
        {b.titulo || config.nombre}
      </h1>
      {fotos.map((f, i) => (
        // Las fotos que no se ven quedan ocultas también para los lectores de pantalla.
        <picture key={f.escritorio} class={i === actual ? 'activa' : undefined} aria-hidden={i !== actual}>
          <source media="(max-width: 799px)" srcset={f.celular} />
          <img src={f.escritorio} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
        </picture>
      ))}
    </section>
  );
}
