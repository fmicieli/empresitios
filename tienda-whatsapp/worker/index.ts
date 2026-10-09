// Punto de entrada del Worker de Cloudflare: la tienda + el puente a Google (D-16).
// El ID de cliente de Google sale de la configuración de la tienda (un solo lugar por cliente).
import { crearPuente, type EntornoPuente } from '../../compartido/puente/puente';
import { escaparAtributo, vistaPreviaProducto, type ProductoParaVistaPrevia } from '../../compartido/puente/vistaPrevia';
import config from '../config/tienda.config';
import semilla from '../datos-ejemplo/tienda-modelo.json';

let manejar: ReturnType<typeof crearPuente> | undefined;

/** Busca el producto en Google (catálogo con caché) o, en la demo, en los datos de ejemplo. */
async function buscarProducto(id: string, req: Request, env: EntornoPuente): Promise<ProductoParaVistaPrevia | null> {
  if (config.datos === 'appsScript') {
    const r = await manejar!(new Request(new URL('/api/catalogo', req.url)), env);
    const cuerpo = (await r.json().catch(() => null)) as {
      ok?: boolean;
      resultado?: { productos: ProductoParaVistaPrevia[] };
    } | null;
    return cuerpo?.ok ? (cuerpo.resultado!.productos.find((p) => p.id === id) ?? null) : null;
  }
  return (semilla.productos as ProductoParaVistaPrevia[]).find((p) => p.id === id) ?? null;
}

/**
 * Completa la vista previa al compartir el link (WhatsApp, Instagram): dirección completa de la
 * página y de la imagen y, en las fichas, el nombre, precio, descripción y foto del producto.
 */
async function conVistaPrevia(req: Request, env: EntornoPuente): Promise<Response> {
  const pagina = await env.ASSETS.fetch(req);
  if (!pagina.ok || !(pagina.headers.get('Content-Type') ?? '').includes('text/html')) return pagina;
  const url = new URL(req.url);
  const id = url.pathname === '/producto/' ? url.searchParams.get('id') : null;
  let producto: ProductoParaVistaPrevia | null = null;
  if (id) {
    try {
      producto = await buscarProducto(id, req, env);
    } catch {
      // Si Google no responde, la página sale igual, con la vista previa de la tienda.
    }
  }
  const vista = vistaPreviaProducto(producto, {
    descripcionTienda: config.descripcion,
    // Las fotos de Drive se sirven por el puente. Las de la demo son dibujos (SVG), que WhatsApp no muestra.
    urlFoto: (foto) => (config.datos === 'appsScript' ? `${url.origin}/api/fotos/${encodeURIComponent(foto)}` : null),
  });
  const imagen = vista?.imagen ?? (config.imagenCompartir ? url.origin + config.imagenCompartir : null);
  const fijar = (valor: string) => ({ element: (e: Element) => void e.setAttribute('content', valor) });
  const metas = [
    `<meta property="og:url" content="${escaparAtributo(url.href)}" />`,
    imagen ? `<meta property="og:image" content="${escaparAtributo(imagen)}" />` : '',
  ].join('');
  let reescritor = new HTMLRewriter()
    .on('meta[property="og:url"], meta[property="og:image"]', { element: (e) => void e.remove() })
    .on('meta[name="twitter:card"]', fijar(imagen ? 'summary_large_image' : 'summary'))
    .on('head', { element: (e) => void e.append(metas, { html: true }) });
  if (vista) {
    reescritor = reescritor
      .on('title', { element: (e) => void e.setInnerContent(`${vista.titulo} · ${config.nombre}`) })
      .on('meta[property="og:title"]', fijar(vista.titulo))
      .on('meta[name="description"]', fijar(vista.descripcion))
      .on('meta[property="og:description"]', fijar(vista.descripcion));
  }
  return reescritor.transform(pagina);
}

export default {
  async fetch(req: Request, env: EntornoPuente): Promise<Response> {
    manejar ??= crearPuente({ fetch: (...a) => fetch(...a), cache: caches.default });
    const entorno = { ...env, GOOGLE_CLIENT_ID: config.googleClientId };
    const { pathname } = new URL(req.url);
    if (req.method === 'GET' && (pathname === '/' || pathname === '/producto/')) return conVistaPrevia(req, entorno);
    return manejar(req, entorno);
  },
};
