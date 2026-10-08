import { describe, expect, it } from 'vitest';
import {
  agruparCategorias,
  coincide,
  evaluarCarrito,
  fechaReserva,
  formatoPrecio,
  normalizarWhatsapp,
  parsePrecio,
  resaltar,
  tiempoRestante,
} from './reglas';
import type { Producto } from './tipos';

describe('WhatsApp del comprador (D-02)', () => {
  const casos: [string, string][] = [
    ['11 5555 0000', '1155550000'],
    ['1155550000', '1155550000'],
    ['011 15 5555-0000', '1155550000'],
    ['+54 9 11 5555-0000', '1155550000'],
    ['+54 11 5555 0000', '1155550000'],
    ['5491155550000', '1155550000'],
    ['9 11 5555 0000', '1155550000'],
    ['11 15 5555 0000', '1155550000'],
    ['0351 15 123-4567', '3511234567'],
    ['351 123 4567', '3511234567'],
    ['(0294) 15 412-3456', '2944123456'],
  ];
  for (const [entrada, esperado] of casos) {
    it(`"${entrada}" → ${esperado}`, () => {
      const r = normalizarWhatsapp(entrada);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.diezDigitos).toBe(esperado);
        expect(r.internacional).toBe('549' + esperado);
      }
    });
  }

  it('muestra el número de forma legible', () => {
    const r = normalizarWhatsapp('011 15 5555 0000');
    expect(r.ok && r.paraMostrar).toBe('+54 9 11 5555-0000');
  });

  for (const malo of ['', '5555 0000', '15 5555 0000', '11 5555', 'hola', '1234567890123456']) {
    it(`rechaza "${malo}"`, () => expect(normalizarWhatsapp(malo).ok).toBe(false));
  }
});

describe('precios', () => {
  it('acepta 15000 y 15.000', () => {
    expect(parsePrecio('15000')).toBe(15000);
    expect(parsePrecio('15.000')).toBe(15000);
    expect(parsePrecio('$ 15.000')).toBe(15000);
    expect(parsePrecio('')).toBeNaN();
  });
  it('formatea con puntos', () => {
    expect(formatoPrecio(15000)).toBe('$ 15.000');
    expect(formatoPrecio(1234567)).toBe('$ 1.234.567');
    expect(formatoPrecio(900)).toBe('$ 900');
  });
});

describe('búsqueda sin mayúsculas ni tildes', () => {
  it('encuentra con o sin tilde', () => {
    expect(coincide('Pantalón Básico', 'basico')).toBe(true);
    expect(coincide('Remera basica', 'BÁSICA')).toBe(true);
    expect(coincide('Gorro', 'remera')).toBe(false);
  });
  it('resalta conservando el texto original', () => {
    expect(resaltar('Remera básica', 'basi')).toEqual([
      { texto: 'Remera ', resaltado: false },
      { texto: 'bási', resaltado: true },
      { texto: 'ca', resaltado: false },
    ]);
  });
});

describe('carrito', () => {
  const producto: Producto = {
    id: 'p1',
    nombre: 'Remera',
    categoriaId: 'c1',
    precio: 1000,
    descripcion: '',
    codigo: '',
    visible: true,
    colores: ['Negro'],
    talles: ['S', 'M'],
    fotos: [],
    creado: 0,
    actualizado: 0,
    variantes: [
      { color: 'Negro', talle: 'S', cantidad: 2, reservado: 0, libre: 2 },
      { color: 'Negro', talle: 'M', cantidad: 3, reservado: 2, libre: 1 },
    ],
  };
  it('marca líneas agotadas, parciales y no disponibles', () => {
    const r = evaluarCarrito(
      [
        { productoId: 'p1', color: 'Negro', talle: 'S', cantidad: 2 },
        { productoId: 'p1', color: 'Negro', talle: 'M', cantidad: 2 },
        { productoId: 'p1', color: 'Negro', talle: 'XL', cantidad: 1 },
        { productoId: 'p9', color: '', talle: '', cantidad: 1 },
      ],
      [producto],
    );
    expect(r.map((l) => l.estado)).toEqual(['ok', 'parcial', 'noDisponible', 'noDisponible']);
    expect(r.map((l) => l.subtotal)).toEqual([2000, 0, 0, 0]);
  });
  it('un producto oculto no se puede comprar', () => {
    const r = evaluarCarrito([{ productoId: 'p1', color: 'Negro', talle: 'S', cantidad: 1 }], [{ ...producto, visible: false }]);
    expect(r[0].estado).toBe('noDisponible');
  });
});

describe('categorías', () => {
  it('agrupa en dos niveles respetando el orden', () => {
    const r = agruparCategorias([
      { id: 'c3', orden: 3, categoria: 'Accesorios', subcategoria: '', visible: true },
      { id: 'c1', orden: 1, categoria: 'Mujer', subcategoria: 'Remeras', visible: true },
      { id: 'c2', orden: 2, categoria: 'Mujer', subcategoria: 'Vestidos', visible: true },
      { id: 'c4', orden: 4, categoria: 'Oculta', subcategoria: '', visible: false },
    ]);
    expect(r).toEqual([
      {
        nombre: 'Mujer',
        id: null,
        subcategorias: [
          { id: 'c1', nombre: 'Remeras' },
          { id: 'c2', nombre: 'Vestidos' },
        ],
      },
      { nombre: 'Accesorios', id: 'c3', subcategorias: [] },
    ]);
  });
});

describe('tiempo', () => {
  const H = 3600_000;
  it('reserva: horas restantes y urgencia', () => {
    expect(tiempoRestante(23.5 * H, 0)).toEqual({ texto: 'vence en 23 h', urgente: false, horas: 23 });
    expect(tiempoRestante(2 * H, 0).urgente).toBe(true);
    expect(tiempoRestante(30 * 60000, 0).texto).toBe('vence en 30 min');
    expect(tiempoRestante(0, 1).texto).toBe('vencida');
  });
  it('fecha de vencimiento en palabras', () => {
    const ahora = new Date(2026, 9, 6, 15, 20).getTime();
    expect(fechaReserva(ahora + 24 * H, ahora)).toBe('mañana a las 15:20');
    expect(fechaReserva(ahora + 2 * H, ahora)).toBe('hoy a las 17:20');
  });
});
