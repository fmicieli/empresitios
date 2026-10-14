import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ajustesAutomaticos, contraste, leerTokens, resolverColor, revisarContraste } from './contraste';

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

describe('contraste de colores', () => {
  it('calcula la relación de contraste', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });

  it('el estilo del cliente pisa los tokens y se resuelven los var()', () => {
    const t = leerTokens(':root{--acento: var(--marca, #000000); --fondo:#fff;}', '/* --fondo: #000; */ :root{--fondo:#fafafa}');
    expect(resolverColor('var(--fondo)', t)).toBe('#fafafa');
    expect(resolverColor('var(--acento)', t)).toBe('#000000');
    expect(resolverColor('var(--acento)', { ...t, '--marca': '#C00' })).toBe('#cc0000');
  });

  it('la plantilla tal como está no tiene problemas', () => {
    const t = leerTokens(leer('./tokens.css'), leer('../../tienda-whatsapp/config/estilo.css'));
    expect(revisarContraste({ ...t, '--marca': '#000000', '--sobre-marca': '#ffffff' })).toEqual([]);
  });

  it('avisa si el color de marca es muy claro para texto blanco', () => {
    const t = leerTokens(leer('./tokens.css'));
    const problemas = revisarContraste({ ...t, '--marca': '#f5c6d0', '--sobre-marca': '#ffffff' });
    expect(problemas.map((p) => p.que)).toContain('el texto de los botones sobre el color de marca');
  });

  it('si el color de marca no se lee como texto, los textos de marca pasan a negro', () => {
    const t = { ...leerTokens(leer('./tokens.css')), '--marca': '#f5c6d0', '--sobre-marca': '#000000' };
    const ajustes = ajustesAutomaticos(t);
    expect(ajustes).toEqual({ '--acento-texto': 'var(--texto)' });
    expect(
      revisarContraste({ ...t, ...ajustes })
        .map((p) => p.que)
        .some((q) => q.startsWith('el color de marca como texto')),
    ).toBe(false);
    expect(ajustesAutomaticos({ ...t, '--marca': '#1f6f5c' })).toEqual({});
  });
});
