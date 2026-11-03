// Prueba de punta a punta sin internet: capa de datos → puente → Codigo.gs (con la Google de mentira).

import { beforeEach, describe, expect, it } from 'vitest';
import { crearGoogleFalso, type GoogleFalso } from '../../../apps-script/pruebas/google-falso';
import { crearPuente, type EntornoPuente } from '../../puente/puente';
import type { Comprador, DataStore } from '../tipos';
import { crearDataStoreAppsScript } from './index';

const DUENA = 'duena@ejemplo.com';
const CLIENTE = 'cliente.apps.googleusercontent.com';
const URL_GOOGLE = 'https://script.google.com/macros/s/x/exec';

let g: GoogleFalso;
let ds: DataStore;
let correoDelPase: string;
let turnstileOk: boolean;

const comprador: Comprador = {
  nombre: 'Ana Prueba',
  whatsapp: '11 4444-0000',
  whatsappNormalizado: '1144440000',
  entrega: 'retiro',
  direccion: '',
  localidad: '',
  pago: 'efectivo',
  nota: '',
};

let n = 0;
let pedirAlPuente: typeof fetch;

beforeEach(async () => {
  g = crearGoogleFalso(DUENA);
  g.hojas.get('Categorias')!.appendRow(['c1', 1, 'Mujer', 'Remeras', true]);
  correoDelPase = DUENA;
  turnstileOk = true;

  const env: EntornoPuente = {
    ASSETS: { fetch: async () => new Response('') },
    APPS_SCRIPT_URL: URL_GOOGLE,
    APPS_SCRIPT_SECRETO: g.secreto,
    TURNSTILE_SECRETO: 'x',
    GOOGLE_CLIENT_ID: CLIENTE,
  };
  const manejar = crearPuente({
    fetch: (async (url: string, init?: RequestInit) => {
      if (url === URL_GOOGLE) return new Response(JSON.stringify(g.doPost(JSON.parse(String(init!.body)))));
      if (url.includes('turnstile')) return new Response(JSON.stringify({ success: turnstileOk }));
      const exp = String(Math.floor(Date.now() / 1000) + 3600);
      return new Response(
        JSON.stringify({ aud: CLIENTE, iss: 'accounts.google.com', exp, email: correoDelPase, email_verified: true }),
      );
    }) as typeof fetch,
  });
  pedirAlPuente = (async (ruta: string, init?: RequestInit) =>
    manejar(new Request('https://tienda.com' + ruta, init), env)) as typeof fetch;
  ds = crearDataStoreAppsScript({ clave: 'prueba', fetch: pedirAlPuente });
});

async function entrar() {
  await ds.sesion!.iniciar('pase-' + ++n);
  const p = await ds.guardarProducto({
    id: null,
    nombre: 'Remera',
    categoriaId: 'c1',
    precio: 15000,
    descripcion: '',
    codigo: 'RB-01',
    visible: true,
    destacado: false,
    colores: [],
    talles: ['M'],
    fotos: ['foto1'],
    stock: [{ color: '', talle: 'M', cantidad: 3 }],
  });
  return p;
}

describe('tienda y admin conectados', () => {
  it('sin sesión, el admin pide entrar', async () => {
    await expect(ds.getPedidos()).rejects.toMatchObject({ tipo: 'sesion' });
  });

  it('una cuenta que no está en la lista no entra', async () => {
    correoDelPase = 'intruso@ejemplo.com';
    await expect(ds.sesion!.iniciar('pase-' + ++n)).rejects.toMatchObject({ tipo: 'noAutorizado' });
    expect(ds.sesion!.correo()).toBeNull();
  });

  it('pedido completo: la tienda reserva, el admin confirma y deshace', async () => {
    const p = await entrar();
    expect(ds.sesion!.correo()).toBe(DUENA);
    ds.sesion!.cerrar();

    const r = await ds.crearPedido({
      items: [{ productoId: p.id, color: '', talle: 'M', cantidad: 2 }],
      comprador,
      verificacion: 'ok',
    });
    expect(r.ok && r.pedido.numero).toBe(1001);
    expect((await ds.getProducto(p.id))!.variantes[0].libre).toBe(1);

    await ds.sesion!.iniciar('pase-' + ++n);
    expect(await ds.getPedidos({ estado: 'pendiente' })).toHaveLength(1);
    const c = await ds.confirmarPedido(1001);
    expect(c.ok).toBe(true);
    expect((await ds.getProducto(p.id))!.variantes[0].cantidad).toBe(1);
    if (c.ok) await ds.deshacer(c.accionId);
    expect((await ds.getPedido(1001))!.estado).toBe('pendiente');
  });

  it('el anti-robots y los topes llegan como errores con tipo', async () => {
    const p = await entrar();
    ds.sesion!.cerrar();
    const item = { productoId: p.id, color: '', talle: 'M', cantidad: 1 };
    turnstileOk = false;
    await expect(ds.crearPedido({ items: [item], comprador, verificacion: 'malo' })).rejects.toMatchObject({ tipo: 'antiRobot' });
    turnstileOk = true;
    await ds.crearPedido({ items: [item], comprador, verificacion: 'ok' });
    await expect(ds.crearPedido({ items: [item], comprador, verificacion: 'ok' })).rejects.toMatchObject({
      tipo: 'pedidoRepetido',
    });
    await ds.crearPedido({ items: [{ ...item, cantidad: 2 }], comprador, verificacion: 'ok' });
    await expect(ds.crearPedido({ items: [{ ...item, cantidad: 3 }], comprador, verificacion: 'ok' })).rejects.toMatchObject({
      tipo: 'limitePedidos',
    });
    expect((await ds.getConfig()).maxUnidadesPorProducto).toBe(10);
    await ds.sesion!.iniciar('pase-' + ++n);
    expect(await ds.cancelarPendientesDe('1144440000')).toEqual([1001, 1002]);
  });

  it('las fotos suben a Drive y se ven por el puente', async () => {
    await entrar();
    const id = await ds.subirFoto(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }));
    const url = await ds.urlFoto(id);
    expect(url).toBe(`/api/fotos/${id}`);
  });
});

describe('lo último conocido al instante (D-35)', () => {
  class Almacen {
    m = new Map<string, string>();
    getItem = (k: string) => this.m.get(k) ?? null;
    setItem = (k: string, v: string) => void this.m.set(k, v);
    removeItem = (k: string) => void this.m.delete(k);
  }
  const global = globalThis as unknown as { localStorage?: Almacen; sessionStorage?: Almacen };
  let local: Almacen;
  let sesionNav: Almacen;
  beforeEach(() => {
    local = new Almacen();
    sesionNav = new Almacen();
    global.localStorage = local;
    global.sessionStorage = sesionNav;
  });

  it('en otra página muestra el catálogo guardado al instante y se corrige solo si cambió', async () => {
    const p = await entrar();
    ds.sesion!.cerrar();
    expect((await ds.getProductos())[0].precio).toBe(15000);
    expect(local.getItem('prueba:catalogo-tienda')).toContain('Remera');

    // La dueña cambia el precio desde el admin (en su celular) y el comprador pasa a otra página.
    const adminDueña = crearDataStoreAppsScript({ clave: 'otra-compu', fetch: pedirAlPuente });
    await adminDueña.sesion!.iniciar('pase-' + ++n);
    await adminDueña.guardarProducto({ ...p, precio: 18000, stock: [{ color: '', talle: 'M', cantidad: 3 }] });
    const pagina2 = crearDataStoreAppsScript({ clave: 'prueba', fetch: pedirAlPuente });
    const aviso = new Promise<void>((ok) => pagina2.alCambiar(ok));
    expect((await pagina2.getProductos())[0].precio).toBe(15000); // al instante, lo guardado
    await aviso; // llegó lo nuevo y avisó a la pantalla
    expect((await pagina2.getProductos())[0].precio).toBe(18000);
  });

  it('los pedidos nunca se guardan en el navegador', async () => {
    const p = await entrar();
    await ds.crearPedido({ items: [{ productoId: p.id, color: '', talle: 'M', cantidad: 1 }], comprador, verificacion: 'ok' });
    await ds.sesion!.iniciar('pase-' + ++n);
    expect(await ds.getPedidos()).toHaveLength(1);
    const todo = [...local.m.values(), ...sesionNav.m.values()].join(' ');
    expect(todo).not.toContain('Ana Prueba');
    expect(todo).not.toContain('1144440000');
  });

  it('después de guardar un cambio no muestra lo viejo', async () => {
    const p = await entrar();
    expect((await ds.getProductos({ incluirOcultos: true }))[0].variantes[0].cantidad).toBe(3);
    await ds.ajustarStock(p.id, [{ color: '', talle: 'M', cantidad: 7 }]);
    expect((await ds.getProductos({ incluirOcultos: true }))[0].variantes[0].cantidad).toBe(7);
  });
});
