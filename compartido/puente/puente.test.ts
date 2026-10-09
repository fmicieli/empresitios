// Pruebas del puente con un Google y una caché de mentira.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearPuente, type EntornoPuente } from './puente';

const URL_GOOGLE = 'https://script.google.com/macros/s/prueba/exec';
const CLIENTE = 'cliente-123.apps.googleusercontent.com';

function cacheFalsa() {
  const guardado = new Map<string, Response>();
  return {
    guardado,
    async match(clave: string) {
      return guardado.get(clave)?.clone();
    },
    async put(clave: string, r: Response) {
      guardado.set(clave, r);
    },
    async delete(clave: string) {
      return guardado.delete(clave);
    },
  };
}

const env: EntornoPuente = {
  ASSETS: { fetch: async () => new Response('pagina') },
  APPS_SCRIPT_URL: URL_GOOGLE,
  APPS_SCRIPT_SECRETO: 'secreto',
  TURNSTILE_SECRETO: 'turnstile',
  GOOGLE_CLIENT_ID: CLIENTE,
};

const jsonR = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });

let llamadasGoogle: { accion: string; datos: any; usuario: string; secreto: string }[];
let respuestaGoogle: (accion: string) => unknown;
let turnstileOk: boolean;
let tokenInfo: Record<string, unknown> | null;
let fetchFalso: ReturnType<typeof vi.fn>;
let cache: ReturnType<typeof cacheFalsa>;
let manejar: ReturnType<typeof crearPuente>;

beforeEach(() => {
  llamadasGoogle = [];
  respuestaGoogle = (accion) => ({ ok: true, resultado: { accion } });
  turnstileOk = true;
  tokenInfo = {
    aud: CLIENTE,
    iss: 'https://accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    email: 'Duena@Ejemplo.com',
    email_verified: 'true',
  };
  fetchFalso = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === URL_GOOGLE) {
      const c = JSON.parse(String(init?.body));
      llamadasGoogle.push(c);
      return jsonR(respuestaGoogle(c.accion));
    }
    if (url.startsWith('https://challenges.cloudflare.com/')) return jsonR({ success: turnstileOk });
    if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) return tokenInfo ? jsonR(tokenInfo) : jsonR({}, 400);
    throw new Error('fetch inesperado: ' + url);
  });
  cache = cacheFalsa();
  manejar = crearPuente({ fetch: fetchFalso as unknown as typeof fetch, cache: cache as unknown as Cache });
});

const get = (ruta: string) => manejar(new Request('https://tienda.com' + ruta), env);
const post = (ruta: string, cuerpo: unknown, headers: Record<string, string> = {}) =>
  manejar(new Request('https://tienda.com' + ruta, { method: 'POST', body: JSON.stringify(cuerpo), headers }), env);

// Cada prueba usa un pase distinto: el puente recuerda los pases ya verificados.
let n = 0;
const pase = () => ({ Authorization: `Bearer pase-${++n}` });

describe('páginas y rutas', () => {
  it('lo que no es /api va a las páginas de la tienda', async () => {
    expect(await (await get('/carrito/')).text()).toBe('pagina');
  });
  it('una ruta /api desconocida da 404', async () => {
    expect((await get('/api/otra')).status).toBe(404);
  });
});

describe('catálogo', () => {
  it('manda la clave secreta a Google y guarda el catálogo en caché', async () => {
    const r1 = await get('/api/catalogo');
    expect(await r1.json()).toEqual({ ok: true, resultado: { accion: 'catalogo' } });
    expect(r1.headers.get('Cache-Control')).toContain('max-age=45');
    expect(llamadasGoogle[0]).toMatchObject({ secreto: 'secreto', accion: 'catalogo' });
    await get('/api/catalogo');
    expect(llamadasGoogle).toHaveLength(1);
  });
  it('si Google falla, avisa con un error de servidor', async () => {
    respuestaGoogle = () => ({ ok: false, error: { tipo: 'servidor', mensaje: 'x' } });
    const r = await get('/api/catalogo');
    expect(r.status).toBe(502);
    expect(await r.json()).toMatchObject({ ok: false, error: { tipo: 'servidor' } });
  });
});

describe('pedidos', () => {
  const cuerpo = { items: [{ productoId: 'p1', color: '', talle: '', cantidad: 1 }], comprador: { nombre: 'Ana' } };

  it('sin la verificación anti-robots no llega a Google', async () => {
    const r = await post('/api/pedido', cuerpo);
    expect(r.status).toBe(403);
    expect(await r.json()).toMatchObject({ error: { tipo: 'antiRobot' } });
    turnstileOk = false;
    expect((await post('/api/pedido', { ...cuerpo, verificacion: 'malo' })).status).toBe(403);
    expect(llamadasGoogle).toHaveLength(0);
  });
  it('con verificación crea el pedido y refresca el catálogo', async () => {
    await get('/api/catalogo');
    const r = await post('/api/pedido', { ...cuerpo, verificacion: 'bueno' });
    expect(await r.json()).toMatchObject({ ok: true });
    expect(llamadasGoogle[1]).toMatchObject({ accion: 'crearPedido', datos: cuerpo });
    // No se reenvía la verificación a Google.
    expect(llamadasGoogle[1].datos.verificacion).toBeUndefined();
    expect(cache.guardado.size).toBe(0);
  });
  it('los topes de Google llegan con su tipo', async () => {
    respuestaGoogle = () => ({ ok: false, error: { tipo: 'limitePedidos', mensaje: '' } });
    const r = await post('/api/pedido', { ...cuerpo, verificacion: 'bueno' });
    expect(r.status).toBe(429);
    expect(await r.json()).toMatchObject({ error: { tipo: 'limitePedidos' } });
  });
});

describe('fotos', () => {
  it('devuelve los bytes con caché larga', async () => {
    respuestaGoogle = () => ({ ok: true, resultado: { tipo: 'image/webp', base64: btoa('hola') } });
    const r = await get('/api/fotos/archivo1234567');
    expect(r.headers.get('Content-Type')).toBe('image/webp');
    expect(r.headers.get('Cache-Control')).toContain('immutable');
    expect(await r.text()).toBe('hola');
    await get('/api/fotos/archivo1234567');
    expect(llamadasGoogle).toHaveLength(1);
  });
  it('rechaza ids raros sin preguntarle a Google', async () => {
    expect((await get('/api/fotos/..%2F..%2Fsecreto')).status).toBe(404);
    expect(llamadasGoogle).toHaveLength(0);
  });
});

describe('admin', () => {
  it('sin pase de Google no entra', async () => {
    const r = await post('/api/admin', { accion: 'pedidos' });
    expect(r.status).toBe(401);
    expect(llamadasGoogle).toHaveLength(0);
  });
  it('rechaza pases de otra aplicación, vencidos o sin correo verificado', async () => {
    for (const cambio of [{ aud: 'otra' }, { exp: '1' }, { email_verified: 'false' }, { iss: 'otro' }]) {
      tokenInfo = { ...tokenInfo, ...cambio };
      expect((await post('/api/admin', { accion: 'pedidos' }, pase())).status).toBe(401);
      tokenInfo = {
        ...tokenInfo,
        aud: CLIENTE,
        exp: String(Math.floor(Date.now() / 1000) + 3600),
        email_verified: 'true',
        iss: 'accounts.google.com',
      };
    }
    tokenInfo = null;
    expect((await post('/api/admin', { accion: 'pedidos' }, pase())).status).toBe(401);
    expect(llamadasGoogle).toHaveLength(0);
  });
  it('reenvía con el correo verificado y recuerda el pase', async () => {
    const p = pase();
    const r = await post('/api/admin', { accion: 'pedidos', datos: { estado: 'pendiente' } }, p);
    expect(await r.json()).toMatchObject({ ok: true });
    expect(llamadasGoogle[0]).toMatchObject({
      accion: 'admin.pedidos',
      usuario: 'duena@ejemplo.com',
      datos: { estado: 'pendiente' },
    });
    await post('/api/admin', { accion: 'pedidos' }, p);
    const consultas = fetchFalso.mock.calls.filter(([u]) => String(u).includes('tokeninfo'));
    expect(consultas).toHaveLength(1);
  });
  it('solo acepta acciones conocidas', async () => {
    expect((await post('/api/admin', { accion: 'foto' }, pase())).status).toBe(400);
    expect(llamadasGoogle).toHaveLength(0);
  });
  it('si Google dice que el correo no está en la lista, responde 403', async () => {
    respuestaGoogle = () => ({ ok: false, error: { tipo: 'noAutorizado', mensaje: '' } });
    expect((await post('/api/admin', { accion: 'quienSoy' }, pase())).status).toBe(403);
  });
  it('después de un cambio refresca el catálogo', async () => {
    await get('/api/catalogo');
    await post('/api/admin', { accion: 'ajustarStock', datos: {} }, pase());
    expect(cache.guardado.size).toBe(0);
  });
});
