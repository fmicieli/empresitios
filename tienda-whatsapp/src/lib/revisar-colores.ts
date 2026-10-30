// Colores de la tienda al compilar (D-19). Solo corre en la compilación, nunca en el navegador.
//  - Ajuste automático: si el color de marca no se lee como texto, los textos de marca van en el color del texto.
//  - Aviso: si igual queda algún par con poco contraste, lo muestra en la consola.
import tokensCss from '@compartido/estilos/tokens.css?raw';
import { ajustesAutomaticos, contraste, explicarProblemas, leerTokens, revisarContraste } from '@compartido/estilos/contraste';
import estiloCss from '../../config/estilo.css?raw';

let resultado: string | null = null;

/** Devuelve las variables CSS de la marca (con los ajustes automáticos) para poner en la página. */
export function coloresDeMarca(colorMarca: string, colorSobreMarca: string): string {
  if (resultado !== null) return resultado;
  const base = { '--marca': colorMarca, '--sobre-marca': colorSobreMarca };
  const tokens = { ...leerTokens(tokensCss, estiloCss), ...base };
  const ajustes = ajustesAutomaticos(tokens);
  if (Object.keys(ajustes).length) {
    console.info(
      '\nℹ El color de marca no se lee bien como texto sobre el fondo: los textos y bordes de marca van en el color del texto.\n',
    );
  }
  const problemas = revisarContraste({ ...tokens, ...ajustes });
  if (problemas.length) console.warn('\n' + explicarProblemas(problemas) + '\n');
  resultado = `:root{${Object.entries({ ...base, ...ajustes })
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
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
