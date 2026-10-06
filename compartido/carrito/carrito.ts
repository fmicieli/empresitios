// Carrito del comprador. Vive en su navegador (sobrevive a recargar la página)
// y se sincroniza entre pestañas.

import { useEffect, useState } from 'preact/hooks';
import type { ItemCarrito } from '../datos/tipos';

export interface Carrito {
  leer(): ItemCarrito[];
  agregar(item: ItemCarrito): void;
  cambiarCantidad(indice: number, cantidad: number): void;
  quitar(indice: number): void;
  vaciar(): void;
  suscribir(fn: (items: ItemCarrito[]) => void): () => void;
}

const EVENTO = 'carrito-cambio';

function guardadoSeguro(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function crearCarrito(clave: string): Carrito {
  const k = `${clave}:carrito`;
  const almacen = guardadoSeguro();
  let enMemoria: ItemCarrito[] = [];

  function leer(): ItemCarrito[] {
    if (!almacen) return enMemoria;
    try {
      const items = JSON.parse(almacen.getItem(k) ?? '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  function escribir(items: ItemCarrito[]) {
    enMemoria = items;
    try {
      almacen?.setItem(k, JSON.stringify(items));
    } catch {
      /* sin espacio: queda en memoria */
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO));
  }

  return {
    leer,
    agregar(item) {
      const items = leer();
      const existe = items.find((i) => i.productoId === item.productoId && i.color === item.color && i.talle === item.talle);
      if (existe) existe.cantidad += item.cantidad;
      else items.push({ ...item });
      escribir(items);
    },
    cambiarCantidad(indice, cantidad) {
      const items = leer();
      if (!items[indice]) return;
      items[indice].cantidad = Math.max(1, cantidad);
      escribir(items);
    },
    quitar(indice) {
      const items = leer();
      items.splice(indice, 1);
      escribir(items);
    },
    vaciar() {
      escribir([]);
    },
    suscribir(fn) {
      if (typeof window === 'undefined') return () => {};
      const local = () => fn(leer());
      const otraPestana = (e: StorageEvent) => e.key === k && fn(leer());
      window.addEventListener(EVENTO, local);
      window.addEventListener('storage', otraPestana);
      return () => {
        window.removeEventListener(EVENTO, local);
        window.removeEventListener('storage', otraPestana);
      };
    },
  };
}

/** Hook de Preact: devuelve los ítems y se actualiza solo. */
export function useCarrito(carrito: Carrito): ItemCarrito[] {
  const [items, setItems] = useState<ItemCarrito[]>(() => carrito.leer());
  useEffect(() => {
    setItems(carrito.leer());
    return carrito.suscribir(setItems);
  }, [carrito]);
  return items;
}

export function unidades(items: ItemCarrito[]): number {
  return items.reduce((a, i) => a + i.cantidad, 0);
}
