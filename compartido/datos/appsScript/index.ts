// Implementación "appsScript" de la capa de datos: Google Sheets + Drive (D-16).
// El navegador nunca habla con Google: le pide todo al puente (/api, en Cloudflare),
// que guarda el catálogo unos segundos, verifica el anti-robots y la sesión del admin.

import type { DataStore, FilaCategoria, ConfigServidor, Pedido, Producto, SesionAdmin, TipoError } from '../tipos';
import { ErrorDatos } from '../tipos';

export interface OpcionesAppsScript {
  /** Prefijo para lo que se guarda en el navegador. */
  clave: string;
  /** Dónde está el puente. Por defecto, el mismo sitio. */
  base?: string;
  fetch?: typeof fetch;
}

interface Catalogo {
  config: ConfigServidor;
  categorias: FilaCategoria[];
  productos: Producto[];
}

const TIPOS_CONOCIDOS: TipoError[] = [
  'sinConexion',
  'servidor',
  'sesion',
  'noEncontrado',
  'noAutorizado',
  'limitePedidos',
  'limiteUnidades',
  'pedidoRepetido',
  'antiRobot',
];

/** El catálogo se reutiliza unos segundos: la portada pide config, categorías y productos a la vez. */
const SEGUNDOS_CATALOGO_LOCAL = 15;

/**
 * Mostrar primero lo último conocido y actualizar por detrás (D-35). Google tarda entre 1 y 4 segundos en
 * contestar; así, al pasar de una página a otra o de una pestaña del admin a otra, se ve el contenido al
 * instante y se corrige solo si cambió. El stock se vuelve a verificar en la planilla al mandar el pedido.
 * - Catálogo de la tienda: se guarda en el navegador (localStorage); es público.
 * - Catálogo del admin: en sessionStorage (se borra al cerrar la pestaña o al salir).
 * - Pedidos: solo en memoria, nunca en el navegador (tienen datos personales, Ley 25.326).
 */

export function crearDataStoreAppsScript(op: OpcionesAppsScript): DataStore {
  const base = op.base ?? '/api';
  const pedir = op.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const claveSesion = `${op.clave}:sesion-google`;

  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((f) => f());
  const oyentesSesion = new Set<() => void>();

  // --- Sesión del admin -------------------------------------------------------
  // El pase de Google (dura alrededor de una hora) va en sessionStorage: se borra al cerrar la pestaña.
  let sesion: { pase: string; correo: string } | null = leerSesion();

  function leerSesion() {
    try {
      return JSON.parse(sessionStorage.getItem(claveSesion) ?? 'null');
    } catch {
      return null;
    }
  }
  function guardarSesion(s: typeof sesion) {
    sesion = s;
    try {
      if (s) sessionStorage.setItem(claveSesion, JSON.stringify(s));
      else sessionStorage.removeItem(claveSesion);
    } catch {
      /* no pasa nada */
    }
    catalogo = { admin: null, tienda: null };
    ultimo.admin = null;
    pedidosEnMemoria.clear();
    guardarLocal('admin', null);
    oyentesSesion.forEach((f) => f());
  }

  // --- Llamadas al puente ------------------------------------------------------
  async function llamar<T>(ruta: string, init?: RequestInit): Promise<T> {
    let r: Response;
    try {
      r = await pedir(base + ruta, init);
    } catch {
      throw new ErrorDatos('sinConexion');
    }
    let cuerpo: { ok?: boolean; resultado?: T; error?: { tipo?: string; mensaje?: string } };
    try {
      cuerpo = await r.json();
    } catch {
      throw new ErrorDatos('servidor');
    }
    if (cuerpo.ok) return cuerpo.resultado as T;
    const tipo = TIPOS_CONOCIDOS.includes(cuerpo.error?.tipo as TipoError) ? (cuerpo.error!.tipo as TipoError) : 'servidor';
    throw new ErrorDatos(tipo, cuerpo.error?.mensaje || undefined);
  }

  async function admin<T>(accion: string, datos: unknown = {}, pase = sesion?.pase): Promise<T> {
    if (!pase) throw new ErrorDatos('sesion');
    try {
      return await llamar<T>('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pase}` },
        body: JSON.stringify({ accion, datos }),
      });
    } catch (e) {
      // Pase vencido o cuenta sacada de la lista: de vuelta a la pantalla de ingreso.
      if (e instanceof ErrorDatos && (e.tipo === 'sesion' || e.tipo === 'noAutorizado') && pase === sesion?.pase) {
        guardarSesion(null);
      }
      throw e;
    }
  }

  /** Después de guardar: se olvida lo guardado (catálogo y pedidos) y se avisa a las pantallas. */
  async function escribir<T>(accion: string, datos: unknown): Promise<T> {
    const r = await admin<T>(accion, datos);
    olvidarTodo();
    avisar();
    return r;
  }

  function olvidarTodo() {
    catalogo = { admin: null, tienda: null };
    // Después de un cambio propio no se muestra lo viejo: se espera la respuesta nueva.
    ultimo.admin = null;
    ultimo.tienda = null;
    guardarLocal('admin', null);
    guardarLocal('tienda', null);
    pedidosEnMemoria.clear();
  }

  // --- Lo último conocido (D-35) ------------------------------------------------
  type Cual = 'admin' | 'tienda';
  const claveLocal = (cual: Cual) => `${op.clave}:catalogo-${cual}`;
  const almacen = (cual: Cual): Storage | null => {
    try {
      return cual === 'tienda' ? localStorage : sessionStorage;
    } catch {
      return null; // navegación privada o almacenamiento bloqueado: funciona sin recordar
    }
  };
  function leerLocal(cual: Cual): Catalogo | null {
    try {
      return JSON.parse(almacen(cual)?.getItem(claveLocal(cual)) ?? 'null');
    } catch {
      return null;
    }
  }
  function guardarLocal(cual: Cual, c: Catalogo | null) {
    try {
      if (c) almacen(cual)?.setItem(claveLocal(cual), JSON.stringify(c));
      else almacen(cual)?.removeItem(claveLocal(cual));
    } catch {
      /* lleno o bloqueado: no pasa nada */
    }
  }
  const ultimo: Record<Cual, Catalogo | null> = { admin: null, tienda: null };
  const pedidosEnMemoria = new Map<string, { hasta: number; datos: Promise<Pedido[]>; ultimo: Pedido[] | null }>();

  /**
   * Devuelve lo último conocido al instante (si hay) y pide lo nuevo por detrás; si llega distinto, avisa
   * a las pantallas para que se actualicen. Sin nada guardado, espera la respuesta.
   */
  function conUltimo<T>(previo: T | null, pedido: Promise<T>, alLlegar: (d: T) => void): Promise<T> {
    const llega = pedido.then((d) => {
      const cambio = JSON.stringify(d) !== JSON.stringify(previo);
      alLlegar(d);
      if (previo && cambio) avisar();
      return d;
    });
    if (!previo) return llega;
    llega.catch(() => {}); // si falla, se sigue mostrando lo último conocido
    return Promise.resolve(previo);
  }

  // --- Catálogo ---------------------------------------------------------------
  let catalogo: Record<Cual, { hasta: number; promesa: Promise<Catalogo> } | null> = { admin: null, tienda: null };

  function getCatalogo(deAdmin = !!sesion): Promise<Catalogo> {
    const cual: Cual = deAdmin ? 'admin' : 'tienda';
    const c = catalogo[cual];
    // Pedido en camino o reciente: lo último conocido al instante (se actualiza solo cuando llega).
    if (c && c.hasta > Date.now()) return ultimo[cual] ? Promise.resolve(ultimo[cual]!) : c.promesa;
    if (ultimo[cual] === null) ultimo[cual] = leerLocal(cual);
    const pedido = deAdmin ? admin<Catalogo>('catalogo') : llamar<Catalogo>('/catalogo');
    const promesa = conUltimo(ultimo[cual], pedido, (d) => {
      ultimo[cual] = d;
      guardarLocal(cual, d);
    });
    catalogo[cual] = { hasta: Date.now() + SEGUNDOS_CATALOGO_LOCAL * 1000, promesa: pedido };
    pedido.catch(() => (catalogo[cual] = null));
    return promesa;
  }

  function getPedidosConMemoria(estado: string): Promise<Pedido[]> {
    const m = pedidosEnMemoria.get(estado);
    if (m && m.hasta > Date.now()) return m.ultimo ? Promise.resolve(m.ultimo) : m.datos;
    const pedido = admin<Pedido[]>('pedidos', { estado });
    const entrada = { hasta: Date.now() + SEGUNDOS_CATALOGO_LOCAL * 1000, datos: pedido, ultimo: m?.ultimo ?? null };
    pedidosEnMemoria.set(estado, entrada);
    pedido.catch(() => pedidosEnMemoria.delete(estado));
    return conUltimo(entrada.ultimo, pedido, (d) => (entrada.ultimo = d));
  }

  // Al volver a la pestaña (por ejemplo, después de contestar un WhatsApp), los datos se refrescan.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Al volver se muestra lo último conocido y se actualiza por detrás.
        catalogo = { admin: null, tienda: null };
        pedidosEnMemoria.forEach((m) => (m.hasta = 0));
        avisar();
      }
    });
  }

  const sesionAdmin: SesionAdmin = {
    correo: () => sesion?.correo ?? null,
    async iniciar(credencial) {
      const { correo } = await admin<{ correo: string }>('quienSoy', {}, credencial);
      guardarSesion({ pase: credencial, correo });
      return correo;
    },
    cerrar: () => guardarSesion(null),
    alCambiar(fn) {
      oyentesSesion.add(fn);
      return () => oyentesSesion.delete(fn);
    },
  };

  return {
    tipo: 'appsScript',
    ahora: () => Date.now(),
    sesion: sesionAdmin,

    async getConfig() {
      return (await getCatalogo()).config;
    },
    async getCategorias() {
      return (await getCatalogo()).categorias;
    },
    async getProductos(opciones) {
      const { productos } = await getCatalogo(opciones?.incluirOcultos || undefined);
      return opciones?.incluirOcultos ? productos : productos.filter((p) => p.visible);
    },
    async getProducto(id) {
      return (await getCatalogo()).productos.find((p) => p.id === id) ?? null;
    },

    async crearPedido({ items, comprador, verificacion }) {
      const r = await llamar<Awaited<ReturnType<DataStore['crearPedido']>>>('/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, comprador, verificacion }),
      });
      olvidarTodo();
      avisar();
      return r;
    },

    getPedidos: (filtro) => getPedidosConMemoria(filtro?.estado ?? ''),
    getPedido: (numero) => admin('pedido', { numero }),
    confirmarPedido: (numero, opciones) => escribir('confirmar', { numero, forzar: !!opciones?.forzar }),
    cancelarPedido: (numero) => escribir('cancelar', { numero }),
    async cancelarPendientesDe(whatsappNormalizado) {
      const r = await escribir<{ cancelados: number[] }>('cancelarPendientesDe', { whatsappNormalizado });
      return r.cancelados;
    },
    async deshacer(accionId) {
      await escribir('deshacer', { accionId });
    },

    ajustarStock: (productoId, cambios) => escribir('ajustarStock', { productoId, cambios }),
    guardarProducto: (producto) => escribir('guardarProducto', { producto }),
    async eliminarProducto(id) {
      await escribir('eliminarProducto', { id });
    },

    async subirFoto(archivo) {
      const base64 = await aBase64(archivo);
      return admin<string>('subirFoto', { base64, tipo: archivo.type || 'image/webp' });
    },
    async urlFoto(id) {
      // Las fotos de ejemplo de la plantilla (rutas) se muestran tal cual.
      if (id.startsWith('/') || id.startsWith('http')) return id;
      return `${base}/fotos/${encodeURIComponent(id)}`;
    },

    alCambiar(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}

async function aBase64(archivo: Blob): Promise<string> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  let texto = '';
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(texto);
}
