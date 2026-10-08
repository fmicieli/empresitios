import { beforeEach, describe, expect, it } from 'vitest';
import semillaJson from '../../../tienda-whatsapp/datos-ejemplo/tienda-modelo.json';
import { variante } from '../reglas';
import type { Comprador } from '../tipos';
import { crearDataStoreLocal, type DataStoreLocal } from './index';
import type { Semilla } from './semilla';

const semilla = semillaJson as Semilla;

const comprador: Comprador = {
  nombre: 'Ana Prueba',
  whatsapp: '11 4444 0000',
  whatsappNormalizado: '1144440000',
  entrega: 'retiro',
  direccion: '',
  localidad: '',
  pago: 'transferencia',
  nota: '',
};

let ds: DataStoreLocal;

beforeEach(() => {
  ds = crearDataStoreLocal({ semilla, clave: 'prueba', demoraFija: 0 });
});

async function libre(pid: string, color: string, talle: string) {
  const p = await ds.getProducto(pid);
  return variante(p!, color, talle)!.libre;
}
async function cantidad(pid: string, color: string, talle: string) {
  const p = await ds.getProducto(pid);
  return variante(p!, color, talle)!.cantidad;
}

describe('stock libre', () => {
  it('descuenta lo reservado por pedidos pendientes', async () => {
    // Pedido 1003 (pendiente) reserva 2 Remeras Blanco M de 4.
    expect(await cantidad('p1', 'Blanco', 'M')).toBe(4);
    expect(await libre('p1', 'Blanco', 'M')).toBe(2);
  });

  it('ignora los productos ocultos en la tienda', async () => {
    const tienda = await ds.getProductos();
    const admin = await ds.getProductos({ incluirOcultos: true });
    expect(tienda.some((p) => p.id === 'p6')).toBe(false);
    expect(admin.some((p) => p.id === 'p6')).toBe(true);
  });
});

describe('crear pedido', () => {
  it('numera desde proximoNumero y reserva', async () => {
    const r = await ds.crearPedido({ items: [{ productoId: 'p1', color: 'Negro', talle: 'M', cantidad: 1 }], comprador });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pedido.numero).toBe(1004);
    expect(r.pedido.total).toBe(15000);
    expect(r.horasReserva).toBe(24);
    expect(await libre('p1', 'Negro', 'M')).toBe(0);
    const r2 = await ds.crearPedido({ items: [{ productoId: 'p5', color: 'Negro', talle: '', cantidad: 1 }], comprador });
    expect(r2.ok && r2.pedido.numero).toBe(1005);
  });

  it('solo uno se lleva la última unidad', async () => {
    const item = { productoId: 'p1', color: 'Negro', talle: 'M', cantidad: 1 };
    const [a, b] = await Promise.all([
      ds.crearPedido({ items: [item], comprador }),
      ds.crearPedido({ items: [item], comprador }),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const fallido = a.ok ? b : a;
    expect(!fallido.ok && fallido.lineas[0]).toMatchObject({ motivo: 'sinStock', libre: 0 });
  });

  it('suma líneas repetidas de la misma variante', async () => {
    const item = { productoId: 'p1', color: 'Negro', talle: 'S', cantidad: 2 };
    const r = await ds.crearPedido({ items: [item, { ...item, cantidad: 1 }], comprador });
    expect(r.ok).toBe(false);
  });

  it('rechaza productos ocultos o variantes inexistentes', async () => {
    const r = await ds.crearPedido({ items: [{ productoId: 'p6', color: '', talle: '', cantidad: 1 }], comprador });
    expect(!r.ok && r.lineas[0].motivo).toBe('noDisponible');
  });

  it('rechaza compradores sin datos', async () => {
    await expect(
      ds.crearPedido({
        items: [{ productoId: 'p5', color: 'Negro', talle: '', cantidad: 1 }],
        comprador: { ...comprador, whatsappNormalizado: '123' },
      }),
    ).rejects.toThrow();
  });
});

describe('estados del pedido', () => {
  it('confirmar descuenta y cancelar devuelve', async () => {
    const r = await ds.confirmarPedido(1003);
    expect(r.ok).toBe(true);
    expect(await cantidad('p1', 'Blanco', 'M')).toBe(2);
    expect(await libre('p1', 'Blanco', 'M')).toBe(2);
    await ds.cancelarPedido(1003);
    expect(await cantidad('p1', 'Blanco', 'M')).toBe(4);
  });

  it('deshacer una confirmación vuelve todo como estaba', async () => {
    const r = await ds.confirmarPedido(1003);
    if (!r.ok) throw new Error('no confirmó');
    await ds.deshacer(r.accionId);
    expect((await ds.getPedido(1003))!.estado).toBe('pendiente');
    expect(await cantidad('p1', 'Blanco', 'M')).toBe(4);
    await expect(ds.deshacer(r.accionId)).rejects.toThrow();
  });

  it('las reservas vencen solas', async () => {
    ds.herramientas.adelantarReloj(25);
    expect((await ds.getPedido(1003))!.estado).toBe('vencida');
    expect(await libre('p1', 'Blanco', 'M')).toBe(4);
  });

  it('un vencido sin stock pide confirmación y, si se fuerza, deja el stock en 0 (D-05)', async () => {
    // 1002 está vencido y pide Remera Negro XL, que tiene 0.
    const r = await ds.confirmarPedido(1002);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.lineas).toEqual([{ productoId: 'p1', color: 'Negro', talle: 'XL', pedida: 1, libre: 0, motivo: 'sinStock' }]);

    const forzado = await ds.confirmarPedido(1002, { forzar: true });
    expect(forzado.ok).toBe(true);
    expect(await cantidad('p1', 'Negro', 'XL')).toBe(0);
    expect(await cantidad('p2', '', '40')).toBe(1);

    // Cancelar devuelve solo lo que se descontó de verdad: 0 remeras y 1 jean.
    await ds.cancelarPedido(1002);
    expect(await cantidad('p1', 'Negro', 'XL')).toBe(0);
    expect(await cantidad('p2', '', '40')).toBe(2);
  });
});

describe('productos y stock', () => {
  it('el ajuste rápido nunca deja stock negativo', async () => {
    const p = await ds.ajustarStock('p5', [{ color: 'Negro', talle: '', cantidad: -3 }]);
    expect(variante(p, 'Negro', '')!.cantidad).toBe(0);
  });

  it('guardar un producto descarta el stock de colores quitados', async () => {
    const p = (await ds.getProducto('p5'))!;
    const guardado = await ds.guardarProducto({
      ...p,
      colores: ['Negro'],
      stock: p.variantes.map(({ color, talle, cantidad }) => ({ color, talle, cantidad })),
    });
    expect(guardado.variantes).toEqual([{ color: 'Negro', talle: '', cantidad: 5, reservado: 0, libre: 5 }]);
  });

  it('alta y baja', async () => {
    const nuevo = await ds.guardarProducto({
      id: null,
      nombre: 'Medias',
      categoriaId: 'c6',
      precio: 3000,
      descripcion: '',
      codigo: '',
      visible: true,
      colores: [],
      talles: [],
      fotos: ['x.svg'],
      stock: [{ color: '', talle: '', cantidad: 10 }],
    });
    expect((await ds.getProductos()).some((p) => p.id === nuevo.id)).toBe(true);
    await ds.eliminarProducto(nuevo.id);
    expect(await ds.getProducto(nuevo.id)).toBeNull();
  });
});

describe('herramientas de prueba', () => {
  it('simula fallas al guardar mientras estén activas, sin afectar las lecturas', async () => {
    ds.herramientas.setAjustes({ fallarAlGuardar: 'servidor' });
    await expect(ds.getProductos()).resolves.toBeTruthy();
    await expect(ds.confirmarPedido(1003)).rejects.toMatchObject({ tipo: 'servidor' });
    await expect(ds.ajustarStock('p5', [{ color: 'Negro', talle: '', cantidad: 1 }])).rejects.toMatchObject({ tipo: 'servidor' });
    ds.herramientas.setAjustes({ fallarAlGuardar: null });
    await expect(ds.confirmarPedido(1003)).resolves.toMatchObject({ ok: true });
  });

  it('restaurar vuelve a los datos de ejemplo', async () => {
    await ds.confirmarPedido(1003);
    await ds.herramientas.restaurar();
    expect((await ds.getPedido(1003))!.estado).toBe('pendiente');
  });
});
