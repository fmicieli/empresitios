// Une la configuración de esta tienda con las piezas de compartido/.
// Todas las pantallas toman de acá la capa de datos y el carrito.

import { crearCarrito } from '@compartido/carrito/carrito';
import { crearDataStore, esLocal } from '@compartido/datos';
import type { Semilla } from '@compartido/datos/local/semilla';
import config from '../../config/tienda.config';
import semilla from '../../datos-ejemplo/tienda-modelo.json';

export { config };

export const ds = crearDataStore({
  tipo: config.datos,
  clave: config.clave,
  semilla: semilla as Semilla,
  baseFotos: '/fotos-demo/',
  url: config.appsScriptUrl,
});

export const carrito = crearCarrito(config.clave);

/** WhatsApp de la tienda. En modo de prueba se puede reemplazar desde las herramientas. */
export function whatsappTienda(): string {
  if (esLocal(ds)) {
    const propio = ds.herramientas.getAjustes().whatsappTienda;
    if (propio) return propio;
  }
  return config.whatsapp;
}

/** Último pedido enviado desde este navegador (para la pantalla "Pedido registrado"). */
const claveUltimo = `${config.clave}:ultimo-pedido`;
export const ultimoPedido = {
  guardar(datos: unknown) {
    try {
      localStorage.setItem(claveUltimo, JSON.stringify(datos));
    } catch {
      /* sin espacio */
    }
  },
  leer<T>(): T | null {
    try {
      return JSON.parse(localStorage.getItem(claveUltimo) ?? 'null');
    } catch {
      return null;
    }
  },
};

/** Datos que el comprador ya escribió (no se pierden si vuelve atrás o falla el envío). */
const claveBorrador = `${config.clave}:datos-comprador`;
export const borradorComprador = {
  guardar(datos: unknown) {
    try {
      sessionStorage.setItem(claveBorrador, JSON.stringify(datos));
    } catch {
      /* no pasa nada */
    }
  },
  leer<T>(): T | null {
    try {
      return JSON.parse(sessionStorage.getItem(claveBorrador) ?? 'null');
    } catch {
      return null;
    }
  },
  borrar() {
    try {
      sessionStorage.removeItem(claveBorrador);
    } catch {
      /* no pasa nada */
    }
  },
};
