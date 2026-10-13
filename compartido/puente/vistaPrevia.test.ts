import { describe, expect, it } from 'vitest';
import { escaparAtributo, vistaPreviaProducto } from './vistaPrevia';

const producto = { id: 'p1', nombre: 'Remera', precio: 15000, descripcion: 'Algodón.', visible: true, fotos: ['f1'] };
const op = { descripcionTienda: 'Ropa.', urlFoto: (id: string) => `https://t.com/api/fotos/${id}` };

describe('vista previa al compartir', () => {
  it('nombre con precio, descripción y foto', () => {
    expect(vistaPreviaProducto(producto, op)).toEqual({
      titulo: expect.stringMatching(/^Remera · \$\s?15\.000$/),
      descripcion: 'Algodón.',
      imagen: 'https://t.com/api/fotos/f1',
    });
  });
  it('sin descripción usa la de la tienda; textos largos se cortan', () => {
    expect(vistaPreviaProducto({ ...producto, descripcion: '' }, op)!.descripcion).toBe('Ropa.');
    expect(vistaPreviaProducto({ ...producto, descripcion: 'a '.repeat(200) }, op)!.descripcion.length).toBeLessThanOrEqual(160);
  });
  it('productos ocultos o inexistentes no se muestran', () => {
    expect(vistaPreviaProducto({ ...producto, visible: false }, op)).toBeNull();
    expect(vistaPreviaProducto(null, op)).toBeNull();
  });
  it('escapa comillas para no romper la página', () => {
    expect(escaparAtributo('a"<b>&')).toBe('a&quot;&lt;b&gt;&amp;');
  });
});
