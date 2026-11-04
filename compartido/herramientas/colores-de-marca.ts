// Colores de cada sitio al compilar (D-19). Lo usan las dos plantillas (tienda y turnos).
// Solo corre en la compilación, nunca en el navegador.
//  - Ajuste automático: si el color de marca no se lee como texto, los textos de marca van en el color del texto.
//  - Aviso: si igual queda algún par con poco contraste, lo muestra en la consola.
import tokensCss from '../estilos/tokens.css?raw';
import { ajustesAutomaticos, explicarProblemas, leerTokens, revisarContraste, type Tokens } from '../estilos/contraste';

export interface ParContraste {
  frente: string;
  fondo: string;
  minimo: number;
  que: string;
}

/**
 * Devuelve las variables CSS de la marca (con los ajustes automáticos) para poner en la página.
 * `estiloCss` es el config/estilo.css del cliente; `paresExtra`, pares propios de cada plantilla.
 */
export function calcularColoresDeMarca(
  estiloCss: string,
  colorMarca: string,
  colorSobreMarca: string,
  paresExtra: ParContraste[] = [],
): string {
  const base = { '--marca': colorMarca, '--sobre-marca': colorSobreMarca };
  const tokens: Tokens = { ...leerTokens(tokensCss, estiloCss), ...base };
  const ajustes = ajustesAutomaticos(tokens);
  if (Object.keys(ajustes).length) {
    console.info(
      '\nℹ El color de marca no se lee bien como texto sobre el fondo: los textos y bordes de marca van en el color del texto.\n',
    );
  }
  const problemas = revisarContraste({ ...tokens, ...ajustes }, paresExtra);
  if (problemas.length) console.warn('\n' + explicarProblemas(problemas) + '\n');
  return `:root{${Object.entries({ ...base, ...ajustes })
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
}
