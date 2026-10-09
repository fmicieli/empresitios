// Link a WhatsApp de la tienda. En la demo no hay número por defecto: si quien prueba
// todavía no cargó uno en "Herramientas de prueba", el link avisa en vez de abrir un chat.

import type { ComponentChildren } from 'preact';
import { mostrarToast } from '@compartido/componentes/basicos';
import { linkWhatsapp } from '@compartido/datos/reglas';
import { textos } from '@compartido/textos/textos';
import { whatsappTienda } from '../lib/contexto';

/** Pide a la barra de pruebas que abra las herramientas. */
export function abrirHerramientas() {
  window.dispatchEvent(new CustomEvent('abrir-herramientas'));
}

export function EnlaceWhatsapp({
  texto,
  class: clase,
  children,
}: {
  texto?: string;
  class?: string;
  children: ComponentChildren;
}) {
  const numero = whatsappTienda();
  return (
    <a
      class={clase}
      href={numero ? linkWhatsapp(numero, texto) : '#'}
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        // El número puede haber cambiado después de dibujar el link.
        const actual = whatsappTienda();
        if (actual) {
          e.currentTarget.href = linkWhatsapp(actual, texto);
          return;
        }
        e.preventDefault();
        mostrarToast(textos.pruebas.faltaNumero, { texto: textos.pruebas.cargarNumero, fn: abrirHerramientas });
      }}
    >
      {children}
    </a>
  );
}
