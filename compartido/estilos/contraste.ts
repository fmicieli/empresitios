// Revisa que los colores de cada tienda se lean bien (contraste mínimo AA de accesibilidad).
// Lee los tokens de tokens.css y del estilo del cliente, y avisa al compilar si algo no alcanza.

export type Tokens = Record<string, string>;

/** Junta los tokens (--nombre: valor) de varios CSS; los últimos pisan a los primeros. */
export function leerTokens(...css: string[]): Tokens {
  const tokens: Tokens = {};
  for (const texto of css) {
    const sinComentarios = texto.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of sinComentarios.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)[;}]/g)) tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** Resuelve un token a un color #rrggbb (siguiendo var(--x, respaldo)). null si no es un color simple. */
export function resolverColor(valor: string | undefined, tokens: Tokens, vueltas = 0): string | null {
  if (!valor || vueltas > 10) return null;
  const v = valor.trim();
  const m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (m) return resolverColor(tokens[m[1]], tokens, vueltas + 1) ?? resolverColor(m[2], tokens, vueltas + 1);
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return null;
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
  return '#' + h.toLowerCase();
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste entre dos colores (de 1 a 21). */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Pares que se usan como texto sobre fondo (4,5:1) o como elemento sobre fondo (3:1). */
const PARES: { frente: string; fondo: string; minimo: number; que: string }[] = [
  { frente: '--texto', fondo: '--fondo', minimo: 4.5, que: 'el texto sobre el fondo' },
  { frente: '--texto', fondo: '--superficie', minimo: 4.5, que: 'el texto sobre los paneles' },
  { frente: '--texto-suave', fondo: '--fondo', minimo: 4.5, que: 'el texto suave sobre el fondo' },
  { frente: '--texto-suave', fondo: '--superficie', minimo: 4.5, que: 'el texto suave sobre los paneles' },
  { frente: '--sobre-acento', fondo: '--acento', minimo: 4.5, que: 'el texto de los botones sobre el color de marca' },
  { frente: '--acento', fondo: '--fondo', minimo: 3, que: 'el color de marca sobre el fondo (botones)' },
  {
    frente: '--acento-texto',
    fondo: '--fondo',
    minimo: 4.5,
    que: 'el color de marca como texto (botón secundario, talle y color elegidos). Si no alcanza, poné una versión más oscura en --acento-texto',
  },
  { frente: '--error-texto', fondo: '--fondo', minimo: 4.5, que: 'los errores sobre el fondo' },
  { frente: '--icono', fondo: '--fondo', minimo: 3, que: 'los íconos sobre el fondo' },
  { frente: '--enlace', fondo: '--fondo', minimo: 4.5, que: 'los links sobre el fondo' },
  { frente: '--contador-texto', fondo: '--contador-fondo', minimo: 4.5, que: 'los números de los contadores' },
  { frente: '--aviso-texto', fondo: '--aviso-fondo', minimo: 4.5, que: 'el texto de los avisos' },
];

export interface ProblemaContraste {
  que: string;
  frente: string;
  fondo: string;
  relacion: number;
  minimo: number;
}

export function revisarContraste(tokens: Tokens): ProblemaContraste[] {
  const problemas: ProblemaContraste[] = [];
  for (const par of PARES) {
    const frente = resolverColor(`var(${par.frente})`, tokens);
    const fondo = resolverColor(`var(${par.fondo})`, tokens);
    if (!frente || !fondo) continue; // Colores con transparencias u otros formatos: no se pueden revisar acá.
    const relacion = contraste(frente, fondo);
    if (relacion < par.minimo) problemas.push({ que: par.que, frente, fondo, relacion, minimo: par.minimo });
  }
  return problemas;
}

/**
 * Si el color de marca no se lee como texto sobre el fondo (4,5:1), los textos y bordes de marca
 * (botón secundario, talle y color elegidos) pasan al color del texto. El botón principal no cambia.
 */
export function ajustesAutomaticos(tokens: Tokens): Tokens {
  const textoMarca = resolverColor('var(--acento-texto)', tokens);
  const fondo = resolverColor('var(--fondo)', tokens);
  if (textoMarca && fondo && contraste(textoMarca, fondo) < 4.5) return { '--acento-texto': 'var(--texto)' };
  return {};
}

/** Texto para mostrar en la consola al compilar. */
export function explicarProblemas(problemas: ProblemaContraste[]): string {
  return [
    '⚠ Contraste insuficiente en los colores de la tienda (revisá config/estilo.css y estilo.colorMarca en tienda.config.ts):',
    ...problemas.map((p) => `  - ${p.que}: ${p.frente} sobre ${p.fondo} da ${p.relacion.toFixed(2)}:1 (mínimo ${p.minimo}:1).`),
  ].join('\n');
}
