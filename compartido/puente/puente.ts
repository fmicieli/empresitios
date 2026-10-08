// "Puente" (encargado de mostrador) entre la tienda y Google (D-16).
// Corre en Cloudflare Workers. El navegador nunca habla directo con Google:
//   GET  /api/catalogo      catálogo con caché corta (no gasta cuota de Google en cada visita)
//   POST /api/pedido        Turnstile + reenvío a Google (Google pone el candado)
//   GET  /api/fotos/:id     fotos de Drive con caché larga
//   POST /api/admin         verifica "Iniciar sesión con Google" y reenvía con el correo
// Todo lo demás son las páginas y archivos de la tienda.

export interface EntornoPuente {
  /** Páginas y archivos de la tienda (los arma Astro). */
  ASSETS: { fetch(req: Request): Promise<Response> };
  /** Dirección de la aplicación web de Apps Script (/exec). Secreto. */
  APPS_SCRIPT_URL: string;
  /** Clave compartida con Apps Script (la muestra configurarPlanilla). Secreto. */
  APPS_SCRIPT_SECRETO: string;
  /** Clave secreta de Turnstile. Si falta, no se exige Turnstile. */
  TURNSTILE_SECRETO?: string;
  /** ID de cliente de Google para "Iniciar sesión con Google" (sale de config/tienda.config.ts). */
  GOOGLE_CLIENT_ID?: string;
}

export interface DependenciasPuente {
  fetch: typeof fetch;
  /** Caché de Cloudflare (caches.default). Si no hay, funciona sin caché. */
  cache?: Cache;
  ahora?: () => number;
}

const SEGUNDOS_CATALOGO = 45;
const SEGUNDOS_FOTO = 60 * 60 * 24 * 365;
const CLAVE_CATALOGO = 'https://puente.interno/catalogo';

/** Acciones del admin que cambian datos: después hay que refrescar el catálogo. */
const ESCRITURAS_ADMIN = new Set([
  'confirmar',
  'cancelar',
  'cancelarPendientesDe',
  'deshacer',
  'ajustarStock',
  'guardarProducto',
  'eliminarProducto',
]);
const ACCIONES_ADMIN = new Set([...ESCRITURAS_ADMIN, 'quienSoy', 'catalogo', 'pedidos', 'pedido', 'subirFoto']);

const ESTADO_POR_TIPO: Record<string, number> = {
  noAutorizado: 403,
  sesion: 401,
  noEncontrado: 404,
  limitePedidos: 429,
  limiteUnidades: 400,
  antiRobot: 403,
  invalido: 400,
  servidor: 502,
};

function json(cuerpo: unknown, estado = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

function error(tipo: string, mensaje = ''): Response {
  return json({ ok: false, error: { tipo, mensaje } }, ESTADO_POR_TIPO[tipo] ?? 400);
}

class ErrorPuente extends Error {
  constructor(
    public tipo: string,
    mensaje = '',
  ) {
    super(mensaje || tipo);
  }
}

// Verificaciones de "Iniciar sesión con Google" ya hechas (se reutilizan mientras el pase no venza).
const sesionesVerificadas = new Map<string, { correo: string; vence: number }>();

export function crearPuente(dep: DependenciasPuente) {
  const ahora = dep.ahora ?? (() => Date.now());

  async function google(env: EntornoPuente, accion: string, datos: unknown = {}, usuario = ''): Promise<any> {
    if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRETO) throw new ErrorPuente('servidor', 'Falta configurar el puente.');
    let r: Response;
    try {
      r = await dep.fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        // text/plain: Apps Script lo recibe tal cual y sigue la redirección de Google.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secreto: env.APPS_SCRIPT_SECRETO, accion, datos, usuario }),
        redirect: 'follow',
      });
    } catch {
      throw new ErrorPuente('servidor', 'Google no respondió.');
    }
    let cuerpo: any;
    try {
      cuerpo = await r.json();
    } catch {
      throw new ErrorPuente('servidor', 'Respuesta inválida de Google.');
    }
    if (!cuerpo?.ok) throw new ErrorPuente(cuerpo?.error?.tipo ?? 'servidor', cuerpo?.error?.mensaje);
    return cuerpo.resultado;
  }

  async function borrarCatalogo() {
    await dep.cache?.delete(CLAVE_CATALOGO).catch(() => false);
  }

  async function catalogo(env: EntornoPuente): Promise<Response> {
    const guardado = await dep.cache?.match(CLAVE_CATALOGO);
    if (guardado) return guardado;
    const datos = await google(env, 'catalogo');
    const r = json({ ok: true, resultado: datos }, 200, { 'Cache-Control': `public, max-age=${SEGUNDOS_CATALOGO}` });
    await dep.cache?.put(CLAVE_CATALOGO, r.clone()).catch(() => {});
    return r;
  }

  async function verificarTurnstile(env: EntornoPuente, token: unknown, ip: string | null) {
    if (!env.TURNSTILE_SECRETO) return;
    if (typeof token !== 'string' || !token) throw new ErrorPuente('antiRobot');
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRETO);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const r = await dep.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const res = (await r.json().catch(() => ({}))) as { success?: boolean };
    if (!res.success) throw new ErrorPuente('antiRobot');
  }

  async function pedido(req: Request, env: EntornoPuente): Promise<Response> {
    const cuerpo = (await req.json().catch(() => null)) as {
      items?: unknown;
      comprador?: unknown;
      verificacion?: unknown;
    } | null;
    if (!cuerpo) throw new ErrorPuente('invalido', 'Pedido mal formado.');
    await verificarTurnstile(env, cuerpo.verificacion, req.headers.get('CF-Connecting-IP'));
    const r = await google(env, 'crearPedido', { items: cuerpo.items, comprador: cuerpo.comprador });
    await borrarCatalogo();
    return json({ ok: true, resultado: r });
  }

  async function foto(id: string, env: EntornoPuente): Promise<Response> {
    if (!/^[\w-]{10,120}$/.test(id)) throw new ErrorPuente('noEncontrado');
    const clave = `https://puente.interno/fotos/${id}`;
    const guardada = await dep.cache?.match(clave);
    if (guardada) return guardada;
    const f = (await google(env, 'foto', { id })) as { tipo: string; base64: string };
    const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
    // El id de una foto nunca cambia: se puede guardar "para siempre".
    const r = new Response(bytes, {
      headers: { 'Content-Type': f.tipo, 'Cache-Control': `public, max-age=${SEGUNDOS_FOTO}, immutable` },
    });
    await dep.cache?.put(clave, r.clone()).catch(() => {});
    return r;
  }

  /** Verifica el pase de "Iniciar sesión con Google" (guía oficial: emisor, destinatario, vencimiento). */
  async function correoDeSesion(req: Request, env: EntornoPuente): Promise<string> {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token || !env.GOOGLE_CLIENT_ID) throw new ErrorPuente('sesion');
    const ya = sesionesVerificadas.get(token);
    if (ya && ya.vence > ahora()) return ya.correo;
    const r = await dep.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
    if (!r.ok) throw new ErrorPuente('sesion');
    const info = (await r.json()) as {
      aud?: string;
      iss?: string;
      exp?: string;
      email?: string;
      email_verified?: string | boolean;
    };
    const vence = Number(info.exp) * 1000;
    const emisorOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
    if (
      info.aud !== env.GOOGLE_CLIENT_ID ||
      !emisorOk ||
      !(vence > ahora()) ||
      String(info.email_verified) !== 'true' ||
      !info.email
    ) {
      throw new ErrorPuente('sesion');
    }
    if (sesionesVerificadas.size > 500) sesionesVerificadas.clear();
    sesionesVerificadas.set(token, { correo: info.email.toLowerCase(), vence });
    return info.email.toLowerCase();
  }

  async function admin(req: Request, env: EntornoPuente): Promise<Response> {
    const correo = await correoDeSesion(req, env);
    const cuerpo = (await req.json().catch(() => null)) as { accion?: string; datos?: unknown } | null;
    if (!cuerpo?.accion || !ACCIONES_ADMIN.has(cuerpo.accion)) throw new ErrorPuente('invalido', 'Acción desconocida.');
    // Google vuelve a verificar que el correo esté en la lista de la planilla (correosAdmin).
    const r = await google(env, 'admin.' + cuerpo.accion, cuerpo.datos ?? {}, correo);
    if (ESCRITURAS_ADMIN.has(cuerpo.accion)) await borrarCatalogo();
    return json({ ok: true, resultado: r });
  }

  return async function manejar(req: Request, env: EntornoPuente): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      if (url.pathname === '/api/catalogo' && req.method === 'GET') return await catalogo(env);
      if (url.pathname === '/api/pedido' && req.method === 'POST') return await pedido(req, env);
      if (url.pathname.startsWith('/api/fotos/') && req.method === 'GET') {
        return await foto(decodeURIComponent(url.pathname.slice('/api/fotos/'.length)), env);
      }
      if (url.pathname === '/api/admin' && req.method === 'POST') return await admin(req, env);
      return error('noEncontrado');
    } catch (e) {
      if (e instanceof ErrorPuente) return error(e.tipo, e.message);
      // Sin datos personales en los registros: solo el error técnico.
      console.error('puente:', e instanceof Error ? e.message : e);
      return error('servidor');
    }
  };
}
