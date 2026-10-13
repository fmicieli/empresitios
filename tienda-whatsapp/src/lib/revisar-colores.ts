// Revisión de contraste al compilar (D-19). Solo corre en la compilación, nunca en el navegador.
import tokensCss from '@compartido/estilos/tokens.css?raw';
import { explicarProblemas, leerTokens, revisarContraste } from '@compartido/estilos/contraste';
import estiloCss from '../../config/estilo.css?raw';

let revisado = false;

export function revisarColores(colorMarca: string, colorSobreMarca: string) {
  if (revisado) return;
  revisado = true;
  const tokens = { ...leerTokens(tokensCss, estiloCss), '--marca': colorMarca, '--sobre-marca': colorSobreMarca };
  const problemas = revisarContraste(tokens);
  if (problemas.length) console.warn('\n' + explicarProblemas(problemas) + '\n');
}
