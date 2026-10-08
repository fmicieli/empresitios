// Armado de mensajes de WhatsApp (docs/06-textos.md).

import { etiquetaVariante, formatoPrecio } from '../datos/reglas';
import type { Pedido } from '../datos/tipos';
import { textos } from '../textos/textos';

const nombrePago = { transferencia: 'transferencia', efectivo: 'efectivo' } as const;

/** Mensaje del comprador a la tienda con el pedido completo. */
export function mensajePedido(p: Pedido): string {
  const t = textos.mensajePedido;
  const lineas = p.items.map((i) => {
    const partes = [i.nombreProducto, i.color, i.talle ? `Talle ${i.talle}` : ''].filter(Boolean).join(' · ');
    return `• ${partes} × ${i.cantidad} · ${formatoPrecio(i.precioUnitario * i.cantidad)}`;
  });
  const c = p.comprador;
  const salida = [
    t.saludo,
    '',
    t.pedido(p.numero),
    ...lineas,
    '',
    t.subtotal(formatoPrecio(p.total)),
    t.nombre(c.nombre),
    c.entrega === 'envio' ? t.envio(c.direccion, c.localidad) : t.retiro,
    t.pago(nombrePago[c.pago]),
  ];
  if (c.nota.trim()) salida.push(t.nota(c.nota.trim()));
  return salida.join('\n');
}

/** "Remera básica (Negro · Talle M)" para avisos. */
export function nombreConVariante(nombre: string, color: string, talle: string): string {
  const v = etiquetaVariante(color, talle);
  return v ? `${nombre} (${v})` : nombre;
}
