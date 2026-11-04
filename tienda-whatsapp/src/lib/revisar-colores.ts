// Colores de la tienda al compilar (D-19). La lógica está en compartido/ (la usan las dos plantillas).
import { contraste } from '@compartido/estilos/contraste';
import { calcularColoresDeMarca } from '@compartido/herramientas/colores-de-marca';
import estiloCss from '../../config/estilo.css?raw';

let resultado: string | null = null;

/** Devuelve las variables CSS de la marca (con los ajustes automáticos) para poner en la página. */
export function coloresDeMarca(colorMarca: string, colorSobreMarca: string): string {
  if (resultado === null) resultado = calcularColoresDeMarca(estiloCss, colorMarca, colorSobreMarca);
  return resultado;
}

let bannerRevisado = false;

/** Avisa al compilar si el texto de alguna foto del banner no se lee bien sobre su fondo (D-29). */
export function revisarBanner(fotos: { titulo?: string; texto?: string; fondo?: string; tinta?: string }[]): void {
  if (bannerRevisado) return;
  bannerRevisado = true;
  const hex = /^#[0-9a-f]{6}$/i;
  fotos.forEach((f, i) => {
    if (!(f.titulo || f.texto) || !f.tinta || !f.fondo || !hex.test(f.tinta) || !hex.test(f.fondo)) return;
    const c = contraste(f.tinta, f.fondo);
    if (c < 4.5) {
      console.warn(
        `\n⚠ Banner, foto ${i + 1}: el texto (${f.tinta}) sobre el fondo (${f.fondo}) tiene contraste ${c.toFixed(1)}:1 y necesita 4,5:1. Oscurecé "tinta" o aclará "fondo".\n`,
      );
    }
  });
}
