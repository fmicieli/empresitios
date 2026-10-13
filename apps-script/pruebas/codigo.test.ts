// Pruebas de Codigo.gs contra la "Google de mentira".

import { beforeEach, describe, expect, it } from 'vitest';
import { crearGoogleFalso, type GoogleFalso } from './google-falso';

const DUENA = 'duena@ejemplo.com';
let g: GoogleFalso;

function llamar(accion: string, datos: unknown = {}, usuario = '') {
  return g.doPost({ secreto: g.secreto, accion, datos, usuario });
}
function admin(accion: string, datos: unknown = {}) {
  const r = llamar('admin.' + accion, datos, DUENA);
  if (!r.ok) throw new Error(`${accion}: ${r.error?.tipo} ${r.error?.mensaje}`);
  return r.resultado;
}

const comprador = (n = '1144440000') => ({
  nombre: 'Ana Prueba',
  whatsapp: n,
  whatsappNormalizado: n,
  entrega: 'retiro',
  direccion: '',
  localidad: '',
  pago: 'transferencia',
  nota: '',
});

beforeEach(() => {
  g = crearGoogleFalso(DUENA);
  // Categorías: las define quien mantiene el sitio, a mano en la planilla.
  const cat = g.hojas.get('Categorias')!;
  cat.appendRow(['c1', 1, 'Mujer', 'Remeras', true]);
  cat.appendRow(['c2', 2, 'Accesorios', '', true]);
  admin('guardarProducto', {
    producto: {
      id: null,
      nombre: 'Remera',
      categoriaId: 'c1',
      precio: 15000,
      descripcion: '',
      codigo: 'RB-01',
      visible: true,
      colores: ['Negro'],
      talles: ['S', 'M'],
      fotos: ['f1'],
      stock: [
        { color: 'Negro', talle: 'S', cantidad: 1 },
        { color: 'Negro', talle: 'M', cantidad: 5 },
      ],
    },
  });
  admin('guardarProducto', {
    producto: {
      id: null,
      nombre: 'Pañuelo',
      categoriaId: 'c2',
      precio: 9000,
      descripcion: '',
      codigo: '',
      visible: false,
      colores: [],
      talles: [],
      fotos: ['f2'],
      stock: [{ color: '', talle: '', cantidad: 3 }],
    },
  });
});

const remera = () => (llamar('catalogo').resultado.productos as any[]).find((p) => p.nombre === 'Remera');
const libre = (talle: string) => remera().variantes.find((v: any) => v.talle === talle).libre;

describe('entrada y seguridad', () => {
  it('rechaza pedidos sin la clave secreta', () => {
    expect(g.doPost({ secreto: 'otra', accion: 'catalogo' })).toMatchObject({ ok: false, error: { tipo: 'noAutorizado' } });
  });
  it('el admin solo acepta los correos de la lista', () => {
    expect(llamar('admin.pedidos', {}, 'intruso@ejemplo.com')).toMatchObject({ ok: false, error: { tipo: 'noAutorizado' } });
    expect(llamar('admin.pedidos', {}, '')).toMatchObject({ ok: false });
    expect(llamar('admin.quienSoy', {}, DUENA.toUpperCase())).toMatchObject({ ok: true });
  });
  it('configurarPlanilla anota a la dueña como admin y se puede repetir sin perder datos', () => {
    g.ejecutar('configurarPlanilla');
    expect(llamar('catalogo').resultado.productos).toHaveLength(1);
    const config = g.hojas.get('Config')!.datos.find((f) => f[0] === 'correosAdmin');
    expect(config?.[1]).toBe(DUENA);
  });
});

describe('catálogo', () => {
  it('la tienda no ve productos ocultos, ni códigos, ni stock total', () => {
    const r = llamar('catalogo').resultado;
    expect(r.productos.map((p: any) => p.nombre)).toEqual(['Remera']);
    expect(r.productos[0].codigo).toBe('');
    expect(r.config.proximoNumero).toBe(0);
  });
  it('el admin ve todo', () => {
    const r = admin('catalogo');
    expect(r.productos).toHaveLength(2);
    expect(r.config.proximoNumero).toBe(1001);
  });
});

describe('pedidos', () => {
  const item = (talle: string, cantidad = 1) => ({ productoId: remera().id, color: 'Negro', talle, cantidad });

  it('numera desde 1001 y reserva stock', () => {
    const r = llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() }).resultado;
    expect(r.ok).toBe(true);
    expect(r.pedido.numero).toBe(1001);
    expect(r.pedido.items[0].codigo).toBe('RB-01');
    expect(libre('M')).toBe(3);
  });

  it('solo uno se lleva la última unidad', () => {
    expect(llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440001') }).resultado.ok).toBe(true);
    const r = llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440002') }).resultado;
    expect(r).toMatchObject({ ok: false, lineas: [{ motivo: 'sinStock', libre: 0 }] });
  });

  it('tope de pedidos pendientes por número de WhatsApp (D-16)', () => {
    llamar('crearPedido', { items: [item('M')], comprador: comprador() });
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    expect(llamar('crearPedido', { items: [item('S')], comprador: comprador() })).toMatchObject({
      ok: false,
      error: { tipo: 'limitePedidos' },
    });
  });

  it('el mismo pedido exacto, dos veces, no se registra de nuevo', () => {
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() }).resultado.ok).toBe(true);
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() })).toMatchObject({
      ok: false,
      error: { tipo: 'pedidoRepetido' },
    });
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador('1144440001') }).resultado.ok).toBe(true);
    // Si el comercio lo desactiva en Config, se registra igual.
    g.hojas.get('Config')!.datos.find((f) => f[0] === 'bloquearPedidosRepetidos')![1] = false;
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() }).resultado.ok).toBe(true);
  });

  it('máximo de unidades por producto y por pedido (D-16)', () => {
    expect(llamar('crearPedido', { items: [item('M', 11)], comprador: comprador() })).toMatchObject({
      error: { tipo: 'limiteUnidades' },
    });
  });

  it('valida los datos del comprador del lado del servidor', () => {
    expect(
      llamar('crearPedido', { items: [item('M')], comprador: { ...comprador(), whatsappNormalizado: '123' } }),
    ).toMatchObject({ ok: false });
    expect(llamar('crearPedido', { items: [item('M')], comprador: { ...comprador(), entrega: 'envio' } })).toMatchObject({
      ok: false,
    });
  });

  it('confirmar descuenta, cancelar devuelve y deshacer vuelve atrás', () => {
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    const c = admin('confirmar', { numero: 1001 });
    expect(c.ok).toBe(true);
    expect(remera().variantes.find((v: any) => v.talle === 'M').cantidad).toBe(3);
    admin('deshacer', { accionId: c.accionId });
    expect(admin('pedidos', { estado: 'pendiente' })).toHaveLength(1);
    expect(libre('M')).toBe(3);
    admin('confirmar', { numero: 1001 });
    admin('cancelar', { numero: 1001 });
    expect(libre('M')).toBe(5);
  });

  it('las reservas vencen solas y un vencido sin stock se puede confirmar igual', () => {
    llamar('crearPedido', { items: [item('S')], comprador: comprador() });
    // Adelantamos el vencimiento en la planilla.
    const filaPedido = g.hojas.get('Pedidos')!.datos[1];
    filaPedido[2] = new Date(Date.now() - 1000);
    expect(libre('S')).toBe(1);
    expect(admin('pedidos', { estado: 'vencida' })).toHaveLength(1);
    // Otra persona compra la última unidad.
    llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440009') });
    expect(admin('confirmar', { numero: 1001 })).toMatchObject({ ok: false, motivo: 'sinStock' });
    expect(admin('confirmar', { numero: 1001, forzar: true }).ok).toBe(true);
  });

  it('cancela todos los pendientes de un número (D-16)', () => {
    llamar('crearPedido', { items: [item('M')], comprador: comprador() });
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    expect(admin('cancelarPendientesDe', { whatsappNormalizado: '1144440000' }).cancelados).toEqual([1001, 1002]);
    expect(libre('M')).toBe(5);
  });
});

describe('productos y fotos', () => {
  it('ajusta stock sin dejarlo negativo', () => {
    const p = admin('ajustarStock', { productoId: remera().id, cambios: [{ color: 'Negro', talle: 'M', cantidad: -4 }] });
    expect(p.variantes.find((v: any) => v.talle === 'M').cantidad).toBe(0);
  });

  it('guardar descarta el stock de talles quitados y eliminar borra todo', () => {
    const r = remera();
    const g2 = admin('guardarProducto', {
      producto: { ...r, talles: ['M'], stock: [{ color: 'Negro', talle: 'M', cantidad: 2 }] },
    });
    expect(g2.variantes).toHaveLength(1);
    expect(g.hojas.get('Stock')!.datos.filter((f) => f[0] === r.id)).toHaveLength(1);
    admin('eliminarProducto', { id: r.id });
    expect(llamar('catalogo').resultado.productos).toHaveLength(0);
    expect(g.hojas.get('Stock')!.datos.filter((f) => f[0] === r.id)).toHaveLength(0);
  });

  it('sube fotos a la carpeta de la tienda y solo sirve esas', () => {
    const base64 = Buffer.from('foto-de-prueba').toString('base64');
    const id = admin('subirFoto', { base64, tipo: 'image/webp' });
    expect(llamar('foto', { id }).resultado).toEqual({ tipo: 'image/webp', base64 });
    g.archivos.set('archivoAjeno12345', { bytes: [1], tipo: 'image/png', carpeta: 'otra' });
    expect(llamar('foto', { id: 'archivoAjeno12345' })).toMatchObject({ ok: false, error: { tipo: 'noEncontrado' } });
    expect(llamar('admin.subirFoto', { base64, tipo: 'application/pdf' }, DUENA)).toMatchObject({ ok: false });
  });
});
