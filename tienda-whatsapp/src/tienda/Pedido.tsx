// Pedido enviado: confirmación mínima. El mensaje de WhatsApp ya se abrió en una pestaña nueva (D-11).

import { useState } from 'preact/hooks';
import { IconoCheck } from '@compartido/componentes/iconos';
import { esLocal } from '@compartido/datos';
import { textos } from '@compartido/textos/textos';
import { ds, ultimoPedido } from '../lib/contexto';
import { Marco } from './Marco';

const t = textos.tienda;

interface Guardado {
  numero: number;
  link: string;
  sinNumeroDePrueba: boolean;
}

export default function Pedido() {
  const [g] = useState(() => ultimoPedido.leer<Guardado>());

  return (
    <Marco>
      <div class="pila lectura centrado" style={{ paddingTop: '48px', margin: '0 auto' }}>
        {g ? (
          <>
            <span class="punto-ok" aria-hidden="true">
              <IconoCheck tam={28} />
            </span>
            <h1>{t.pedidoEnviado}</h1>
            <p class="suave num">{t.pedidoN(g.numero)}</p>
          </>
        ) : (
          <h1>{t.sinPedido}</h1>
        )}
        <a class="boton" href="/">
          {t.volverInicio}
        </a>
        {g && !g.sinNumeroDePrueba && (
          <a class="enlace chico" href={g.link} target="_blank" rel="noopener">
            {t.siNoSeAbrio}
          </a>
        )}
        {g?.sinNumeroDePrueba && (
          <p class="aviso">
            Modo de prueba: no abrimos WhatsApp porque no cargaste tu número. Cargalo en “Herramientas de prueba” para recibir el
            mensaje.
          </p>
        )}
        {g && esLocal(ds) && (
          <a class="enlace chico" href={`/admin/#/pedidos/${g.numero}`}>
            Ver el pedido en el admin (prueba)
          </a>
        )}
      </div>
    </Marco>
  );
}
