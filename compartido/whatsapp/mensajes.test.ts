import { describe, expect, it } from 'vitest';
import type { Pedido } from '../datos/tipos';
import { mensajePedido } from './mensajes';

const pedido: Pedido = {
  numero: 1004,
  creado: 0,
  venceEn: 0,
  estado: 'pendiente',
  actualizado: 0,
  total: 43000,
  comprador: {
    nombre: 'Ana',
    whatsapp: '1122334455',
    whatsappNormalizado: '1122334455',
    entrega: 'retiro',
    direccion: '',
    localidad: '',
    pago: 'efectivo',
    nota: '',
  },
  items: [
    {
      productoId: 'AB-05',
      nombreProducto: 'Abanico Koi',
      color: '',
      talle: '',
      cantidad: 1,
      precioUnitario: 25000,
      codigo: 'AB-05',
      descontado: 0,
    },
    {
      productoId: 'p 7',
      nombreProducto: 'Remera',
      color: 'Negro',
      talle: 'M',
      cantidad: 1,
      precioUnitario: 18000,
      codigo: '',
      descontado: 0,
    },
  ],
};

describe('Mensaje de WhatsApp del pedido (D-25)', () => {
  const m = mensajePedido(pedido, 'https://tienda.com.ar/');

  it('abajo de cada producto van el código y el link a su ficha', () => {
    expect(m).toContain('• Abanico Koi × 1 · $ 25.000\n  Código AB-05 · Ver foto: https://tienda.com.ar/producto/?id=AB-05');
  });

  it('sin código, solo el link (con el id codificado)', () => {
    expect(m).toContain('• Remera · Negro · Talle M × 1 · $ 18.000\n  Ver foto: https://tienda.com.ar/producto/?id=p%207');
  });

  it('ningún dato del comprador va dentro de un link', () => {
    for (const link of m.match(/https?:\/\/\S+/g) ?? []) expect(link).not.toMatch(/Ana|1122334455/);
  });
});
