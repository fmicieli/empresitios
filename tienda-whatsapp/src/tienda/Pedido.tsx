// Pedido registrado: número, reserva y "Último paso: mandá el mensaje".

import { useEffect, useRef, useState } from 'preact/hooks';
import { copiarTexto, mostrarToast } from '@compartido/componentes/basicos';
import { IconoChat } from '@compartido/componentes/iconos';
import { esLocal } from '@compartido/datos';
import { etiquetaVariante, fechaReserva, formatoPrecio, linkWhatsapp } from '@compartido/datos/reglas';
import type { Pedido as TPedido } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { ds, ultimoPedido } from '../lib/contexto';
import { Marco } from './Marco';

const t = textos.tienda;

interface Guardado {
  pedido: TPedido;
  horasReserva: number;
  mensaje: string;
  whatsapp: string;
  abierto: boolean;
}

export default function Pedido() {
  const [g] = useState(() => ultimoPedido.leer<Guardado>());
  const refMensaje = useRef<HTMLPreElement>(null);
  const link = g ? linkWhatsapp(g.whatsapp, g.mensaje) : '';
  // En modo de prueba, sin un WhatsApp propio cargado, el mensaje iría a un número de ejemplo.
  const sinNumeroDePrueba = esLocal(ds) && !ds.herramientas.getAjustes().whatsappTienda;

  // Intentamos abrir WhatsApp solos una única vez; el botón queda de respaldo.
  useEffect(() => {
    if (!g || g.abierto || sinNumeroDePrueba) return;
    ultimoPedido.guardar({ ...g, abierto: true });
    const temporizador = setTimeout(() => location.assign(link), 1200);
    return () => clearTimeout(temporizador);
  }, []);

  async function copiar() {
    if (!g) return;
    if (await copiarTexto(g.mensaje)) mostrarToast(t.copiado);
    else {
      // Respaldo: seleccionamos el texto para que lo copie a mano.
      const el = refMensaje.current;
      if (el) {
        const rango = document.createRange();
        rango.selectNodeContents(el);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(rango);
      }
      mostrarToast(t.copiarManual);
    }
  }

  if (!g) {
    return (
      <Marco>
        <div class="pila lectura" style={{ paddingTop: '24px' }}>
          <h1>{t.sinPedido}</h1>
          <a class="boton secundario" href="/">
            {t.volverTienda}
          </a>
        </div>
      </Marco>
    );
  }

  const p = g.pedido;
  return (
    <Marco>
      <div class="pila lectura" style={{ paddingTop: '24px' }}>
        <div class="pila-chica">
          <h1 class="suave" style={{ fontSize: 'var(--texto-base)', fontWeight: 400 }}>
            {t.tuNumero}
          </h1>
          <span class="numero-grande num">#{p.numero}</span>
        </div>
        <p>{t.reservamos(g.horasReserva, fechaReserva(p.venceEn, ds.ahora()))}</p>

        <section class="alerta" aria-labelledby="ultimo-paso">
          <h2 id="ultimo-paso" style={{ fontSize: 'var(--texto-medio)' }}>
            {t.ultimoPaso}
          </h2>
          <p>{t.ultimoPasoAyuda}</p>
          <p class="chico suave">{t.siNoSeAbrio}:</p>
          <a class="boton" href={link} target="_blank" rel="noopener">
            <IconoChat /> {t.abrirWhatsapp}
          </a>
          {sinNumeroDePrueba && (
            <p class="aviso">
              Modo de prueba: no abrimos WhatsApp solo porque no cargaste tu número. Cargalo en “Herramientas de prueba” para
              recibir el mensaje.
            </p>
          )}
          <button type="button" class="enlace" onClick={copiar}>
            {t.copiar}
          </button>
        </section>

        <section class="pila-chica" aria-labelledby="asi-llega">
          <h2 id="asi-llega" style={{ fontSize: 'var(--texto-base)' }}>
            {t.asiLlega}
          </h2>
          <pre class="mensaje" ref={refMensaje} style={{ fontFamily: 'inherit', margin: 0 }}>
            {g.mensaje}
          </pre>
        </section>

        <section class="pila-chica" aria-labelledby="que-sigue">
          <h2 id="que-sigue" style={{ fontSize: 'var(--texto-base)' }}>
            {t.queSigue}
          </h2>
          <p>{t.queSigueTexto}</p>
        </section>

        <section class="panel pila-chica" aria-label="Resumen del pedido">
          {p.items.map((i, n) => (
            <div key={n} class="fila-extremos">
              <span>
                {i.nombreProducto}
                {etiquetaVariante(i.color, i.talle) && <span class="suave"> · {etiquetaVariante(i.color, i.talle)}</span>} ×{' '}
                {i.cantidad}
              </span>
              <span class="num">{formatoPrecio(i.precioUnitario * i.cantidad)}</span>
            </div>
          ))}
          <hr class="separador" />
          <div class="fila-extremos negrita">
            <span>{t.subtotal}</span>
            <span class="num">{formatoPrecio(p.total)}</span>
          </div>
        </section>

        <div class="fila">
          <a class="boton secundario" href="/">
            {t.volverTienda}
          </a>
          {esLocal(ds) && (
            <a class="enlace" href={`/admin/#/pedidos/${p.numero}`}>
              Ver el pedido en el admin (prueba)
            </a>
          )}
        </div>
      </div>
    </Marco>
  );
}
