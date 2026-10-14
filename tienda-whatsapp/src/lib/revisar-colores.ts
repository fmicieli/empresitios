// Colores de la tienda al compilar (D-19). Solo corre en la compilación, nunca en el navegador.
//  - Ajuste automático: si el color de marca no se lee como texto, los textos de marca van en el color del texto.
//  - Aviso: si igual queda algún par con poco contraste, lo muestra en la consola.
import tokensCss from '@compartido/estilos/tokens.css?raw';
import { ajustesAutomaticos, explicarProblemas, leerTokens, revisarContraste } from '@compartido/estilos/contraste';
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
