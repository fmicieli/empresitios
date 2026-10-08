// Formato de los datos de ejemplo que recibe la implementación local.
// Los datos concretos (la tienda de ropa ficticia) viven en cada plantilla,
// por ejemplo tienda-whatsapp/datos-ejemplo/tienda-modelo.json.

import type { Comprador, ConfigServidor, EstadoPedido, FilaCategoria } from '../tipos';

export interface SemillaProducto {
  id: string;
  nombre: string;
  categoriaId: string;
  precio: number;
  descripcion: string;
  codigo: string;
  visible: boolean;
  colores: string[];
  talles: string[];
  fotos: string[];
  stock: { color: string; talle: string; cantidad: number }[];
}

export interface SemillaPedido {
  numero: number;
  /** Hace cuántos minutos se creó, contado desde que se cargan los datos. */
  haceMinutos: number;
  estado: EstadoPedido;
  comprador: Comprador;
  items: { productoId: string; color: string; talle: string; cantidad: number }[];
}

export interface Semilla {
  config: ConfigServidor;
  categorias: FilaCategoria[];
  productos: SemillaProducto[];
  pedidos: SemillaPedido[];
}
