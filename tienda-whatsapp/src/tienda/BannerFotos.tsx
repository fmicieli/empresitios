// Banner de fotos (D-29): pasan solas con un fundido, sin controles.
// Cada foto puede llevar título y texto sobre un fondo del color de la foto: en computadora el texto va
// a la izquierda y la foto se funde con el fondo; en el celular el texto va debajo de la foto.
// Accesibilidad (WCAG 2.2.2): da 3 vueltas y queda fija en la primera foto, se frena con el mouse encima
// y con "reducir movimiento" activado en el teléfono o la computadora no se mueve nunca.

import { useEffect, useState } from 'preact/hooks';
import { contraste } from '@compartido/estilos/contraste';
import { config } from '../lib/contexto';

const CADA = 5000; // milisegundos entre fotos
const VUELTAS = 3;

/** Texto blanco o del color del texto, el que más contraste tenga con el fondo de la foto. */
function colorDelTexto(fondo: string): string | undefined {
  if (!/^#[0-9a-f]{6}$/i.test(fondo)) return undefined;
  return contraste(fondo, '#ffffff') >= contraste(fondo, '#1e1e1e') ? '#ffffff' : undefined;
}

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
      {fotos.map((f, i) => {
        const conTexto = !!(f.titulo || f.texto);
        const tinta = colorDelTexto(f.fondo ?? '');
        return (
          // Las fotos que no se ven quedan ocultas también para los lectores de pantalla.
          <div
            key={f.escritorio}
            class={`banner-diapo ${conTexto ? 'con-texto' : ''} ${i === actual ? 'activa' : ''}`}
            aria-hidden={i !== actual}
            style={{ '--fondo-diapo': f.fondo || undefined, '--tinta-diapo': tinta }}
          >
            <picture>
              <source media="(max-width: 799px)" srcset={f.celular} />
              <img src={f.escritorio} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </picture>
            {conTexto && (
              <div class="banner-diapo-texto">
                {f.titulo && <p class="banner-diapo-titulo">{f.titulo}</p>}
                {f.texto && <p>{f.texto}</p>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
