// Prepara el catálogo de prueba para pasarlo a Google (D-31).
// Lee datos-ejemplo/tienda-modelo.json y escribe public/importar/catalogo.json con las categorías,
// los productos, el stock y la dirección de cada foto. No incluye pedidos ni datos de compradores.
// Después, en la planilla, importarCatalogo() lo lee desde la tienda publicada (docs/09).
//
// Uso: npm run exportar:catalogo

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE_FOTOS = '/fotos-demo/';
const origen = new URL('../datos-ejemplo/tienda-modelo.json', import.meta.url);
const destino = new URL('../public/importar/catalogo.json', import.meta.url);

const semilla = JSON.parse(readFileSync(origen, 'utf8'));
const catalogo = {
  version: 1,
  categorias: semilla.categorias.map(({ id, orden, categoria, subcategoria, visible }) => ({
    id,
    orden,
    categoria,
    subcategoria: subcategoria ?? '',
    visible,
  })),
  productos: semilla.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    precio: p.precio,
    descripcion: p.descripcion ?? '',
    codigo: p.codigo ?? '',
    visible: p.visible !== false,
    destacado: !!p.destacado,
    colores: p.colores ?? [],
    talles: p.talles ?? [],
    fotos: (p.fotos ?? []).map((f) => (f.startsWith('/') ? f : BASE_FOTOS + f)),
    stock: p.stock ?? [],
  })),
};

mkdirSync(new URL('.', destino), { recursive: true });
writeFileSync(destino, JSON.stringify(catalogo, null, 2) + '\n');
const fotos = catalogo.productos.reduce((n, p) => n + p.fotos.length, 0);
console.log(`Listo: ${catalogo.categorias.length} categorías, ${catalogo.productos.length} productos y ${fotos} fotos en public/importar/catalogo.json`);
