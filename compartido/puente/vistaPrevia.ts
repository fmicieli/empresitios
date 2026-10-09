// Vista previa de un producto al compartir su link (WhatsApp, Instagram, Facebook).
// Las fichas se arman en el navegador, así que sin esto la vista previa mostraría
// solo el nombre de la tienda. El Worker completa estos datos antes de enviar la página.

import { formatoPrecio } from '../datos/reglas';

export interface ProductoParaVistaPrevia {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  visible: boolean;
  fotos: string[];
}

export interface VistaPrevia {
  titulo: string;
  descripcion: string;
  /** Dirección completa de la foto, o null si no hay una que sirva. */
  imagen: string | null;
}

const LARGO_DESCRIPCION = 160;

export function vistaPreviaProducto(
  p: ProductoParaVistaPrevia | null | undefined,
  op: { descripcionTienda: string; urlFoto: (id: string) => string | null },
): VistaPrevia | null {
  if (!p || !p.visible) return null;
  const texto = (p.descripcion || op.descripcionTienda).replace(/\s+/g, ' ').trim();
  return {
    titulo: `${p.nombre} · ${formatoPrecio(p.precio)}`,
    descripcion: texto.length > LARGO_DESCRIPCION ? texto.slice(0, LARGO_DESCRIPCION - 1).trimEnd() + '…' : texto,
    imagen: p.fotos[0] ? op.urlFoto(p.fotos[0]) : null,
  };
}

/** Para escribir texto dentro de un atributo HTML sin romper la página. */
export function escaparAtributo(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
