// Pruebas de Codigo.gs contra la "Google de mentira".

import { beforeEach, describe, expect, it } from 'vitest';
import { crearGoogleFalso, type GoogleFalso } from './google-falso';

const DUENA = 'duena@ejemplo.com';
let g: GoogleFalso;

function llamar(accion: string, datos: unknown = {}, usuario = '') {
  return g.doPost({ secreto: g.secreto, accion, datos, usuario });
}
function admin(accion: string, datos: unknown = {}) {
  const r = llamar('admin.' + accion, datos, DUENA);
  if (!r.ok) throw new Error(`${accion}: ${r.error?.tipo} ${r.error?.mensaje}`);
  return r.resultado;
}

const comprador = (n = '1144440000') => ({
  nombre: 'Ana Prueba',
  whatsapp: n,
  whatsappNormalizado: n,
  entrega: 'retiro',
  direccion: '',
  localidad: '',
  pago: 'transferencia',
  nota: '',
});

beforeEach(() => {
  g = crearGoogleFalso(DUENA);
  // Categorías: las define quien mantiene el sitio, a mano en la planilla.
  const cat = g.hojas.get('Categorias')!;
  cat.appendRow(['c1', 1, 'Mujer', 'Remeras', true]);
  cat.appendRow(['c2', 2, 'Accesorios', '', true]);
  admin('guardarProducto', {
    producto: {
      id: null,
      nombre: 'Remera',
      categoriaId: 'c1',
      precio: 15000,
      descripcion: '',
      codigo: 'RB-01',
      visible: true,
      colores: ['Negro'],
      talles: ['S', 'M'],
      fotos: ['f1'],
      stock: [
        { color: 'Negro', talle: 'S', cantidad: 1 },
        { color: 'Negro', talle: 'M', cantidad: 5 },
      ],
    },
  });
  admin('guardarProducto', {
    producto: {
      id: null,
      nombre: 'Pañuelo',
      categoriaId: 'c2',
      precio: 9000,
      descripcion: '',
      codigo: '',
      visible: false,
      colores: [],
      talles: [],
      fotos: ['f2'],
      stock: [{ color: '', talle: '', cantidad: 3 }],
    },
  });
});

const remera = () => (llamar('catalogo').resultado.productos as any[]).find((p) => p.nombre === 'Remera');
const libre = (talle: string) => remera().variantes.find((v: any) => v.talle === talle).libre;

describe('entrada y seguridad', () => {
  it('rechaza pedidos sin la clave secreta', () => {
    expect(g.doPost({ secreto: 'otra', accion: 'catalogo' })).toMatchObject({ ok: false, error: { tipo: 'noAutorizado' } });
  });
  it('el admin solo acepta los correos de la lista', () => {
    expect(llamar('admin.pedidos', {}, 'intruso@ejemplo.com')).toMatchObject({ ok: false, error: { tipo: 'noAutorizado' } });
    expect(llamar('admin.pedidos', {}, '')).toMatchObject({ ok: false });
    expect(llamar('admin.quienSoy', {}, DUENA.toUpperCase())).toMatchObject({ ok: true });
  });
  it('configurarPlanilla anota a la dueña como admin y se puede repetir sin perder datos', () => {
    g.ejecutar('configurarPlanilla');
    expect(llamar('catalogo').resultado.productos).toHaveLength(1);
    const config = g.hojas.get('Config')!.datos.find((f) => f[0] === 'correosAdmin');
    expect(config?.[1]).toBe(DUENA);
  });
});

describe('catálogo', () => {
  it('la tienda no ve productos ocultos, ni códigos, ni stock total', () => {
    const r = llamar('catalogo').resultado;
    expect(r.productos.map((p: any) => p.nombre)).toEqual(['Remera']);
    expect(r.productos[0].codigo).toBe('');
    expect(r.config.proximoNumero).toBe(0);
  });
  it('el admin ve todo', () => {
    const r = admin('catalogo');
    expect(r.productos).toHaveLength(2);
    expect(r.config.proximoNumero).toBe(1001);
  });
});

describe('pedidos', () => {
  const item = (talle: string, cantidad = 1) => ({ productoId: remera().id, color: 'Negro', talle, cantidad });

  it('numera desde 1001 y reserva stock', () => {
    const r = llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() }).resultado;
    expect(r.ok).toBe(true);
    expect(r.pedido.numero).toBe(1001);
    expect(r.pedido.items[0].codigo).toBe('RB-01');
    expect(libre('M')).toBe(3);
  });

  it('solo uno se lleva la última unidad', () => {
    expect(llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440001') }).resultado.ok).toBe(true);
    const r = llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440002') }).resultado;
    expect(r).toMatchObject({ ok: false, lineas: [{ motivo: 'sinStock', libre: 0 }] });
  });

  it('tope de pedidos pendientes por número de WhatsApp (D-16)', () => {
    llamar('crearPedido', { items: [item('M')], comprador: comprador() });
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    expect(llamar('crearPedido', { items: [item('S')], comprador: comprador() })).toMatchObject({
      ok: false,
      error: { tipo: 'limitePedidos' },
    });
  });

  it('el mismo pedido exacto, dos veces, no se registra de nuevo', () => {
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() }).resultado.ok).toBe(true);
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() })).toMatchObject({
      ok: false,
      error: { tipo: 'pedidoRepetido' },
    });
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador('1144440001') }).resultado.ok).toBe(true);
    // Si el comercio lo desactiva en Config, se registra igual.
    g.hojas.get('Config')!.datos.find((f) => f[0] === 'bloquearPedidosRepetidos')![1] = false;
    expect(llamar('crearPedido', { items: [item('M')], comprador: comprador() }).resultado.ok).toBe(true);
  });

  it('máximo de unidades por producto y por pedido (D-16)', () => {
    expect(llamar('crearPedido', { items: [item('M', 11)], comprador: comprador() })).toMatchObject({
      error: { tipo: 'limiteUnidades' },
    });
  });

  it('valida los datos del comprador del lado del servidor', () => {
    expect(
      llamar('crearPedido', { items: [item('M')], comprador: { ...comprador(), whatsappNormalizado: '123' } }),
    ).toMatchObject({ ok: false });
    expect(llamar('crearPedido', { items: [item('M')], comprador: { ...comprador(), entrega: 'envio' } })).toMatchObject({
      ok: false,
    });
  });

  it('confirmar descuenta, cancelar devuelve y deshacer vuelve atrás', () => {
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    const c = admin('confirmar', { numero: 1001 });
    expect(c.ok).toBe(true);
    expect(remera().variantes.find((v: any) => v.talle === 'M').cantidad).toBe(3);
    admin('deshacer', { accionId: c.accionId });
    expect(admin('pedidos', { estado: 'pendiente' })).toHaveLength(1);
    expect(libre('M')).toBe(3);
    admin('confirmar', { numero: 1001 });
    admin('cancelar', { numero: 1001 });
    expect(libre('M')).toBe(5);
  });

  it('las reservas vencen solas y un vencido sin stock se puede confirmar igual', () => {
    llamar('crearPedido', { items: [item('S')], comprador: comprador() });
    // Adelantamos el vencimiento en la planilla.
    const filaPedido = g.hojas.get('Pedidos')!.datos[1];
    filaPedido[2] = new Date(Date.now() - 1000);
    expect(libre('S')).toBe(1);
    expect(admin('pedidos', { estado: 'vencida' })).toHaveLength(1);
    // Otra persona compra la última unidad.
    llamar('crearPedido', { items: [item('S')], comprador: comprador('1144440009') });
    expect(admin('confirmar', { numero: 1001 })).toMatchObject({ ok: false, motivo: 'sinStock' });
    expect(admin('confirmar', { numero: 1001, forzar: true }).ok).toBe(true);
  });

  it('cancela todos los pendientes de un número (D-16)', () => {
    llamar('crearPedido', { items: [item('M')], comprador: comprador() });
    llamar('crearPedido', { items: [item('M', 2)], comprador: comprador() });
    expect(admin('cancelarPendientesDe', { whatsappNormalizado: '1144440000' }).cancelados).toEqual([1001, 1002]);
    expect(libre('M')).toBe(5);
  });
});

describe('productos y fotos', () => {
  it('ajusta stock sin dejarlo negativo', () => {
    const p = admin('ajustarStock', { productoId: remera().id, cambios: [{ color: 'Negro', talle: 'M', cantidad: -4 }] });
    expect(p.variantes.find((v: any) => v.talle === 'M').cantidad).toBe(0);
  });

  it('guardar descarta el stock de talles quitados y eliminar borra todo', () => {
    const r = remera();
    const g2 = admin('guardarProducto', {
      producto: { ...r, talles: ['M'], stock: [{ color: 'Negro', talle: 'M', cantidad: 2 }] },
    });
    expect(g2.variantes).toHaveLength(1);
    expect(g.hojas.get('Stock')!.datos.filter((f) => f[0] === r.id)).toHaveLength(1);
    admin('eliminarProducto', { id: r.id });
    expect(llamar('catalogo').resultado.productos).toHaveLength(0);
    expect(g.hojas.get('Stock')!.datos.filter((f) => f[0] === r.id)).toHaveLength(0);
  });

  it('sube fotos a la carpeta de la tienda y solo sirve esas', () => {
    const base64 = Buffer.from('foto-de-prueba').toString('base64');
    const id = admin('subirFoto', { base64, tipo: 'image/webp' });
    expect(llamar('foto', { id }).resultado).toEqual({ tipo: 'image/webp', base64 });
    g.archivos.set('archivoAjeno12345', { bytes: [1], tipo: 'image/png', carpeta: 'otra' });
    expect(llamar('foto', { id: 'archivoAjeno12345' })).toMatchObject({ ok: false, error: { tipo: 'noEncontrado' } });
    expect(llamar('admin.subirFoto', { base64, tipo: 'application/pdf' }, DUENA)).toMatchObject({ ok: false });
  });
});

describe('fotos ordenadas en Drive (D-26)', () => {
  const subir = (texto: string) => admin('subirFoto', { base64: Buffer.from(texto).toString('base64'), tipo: 'image/jpeg' });
  const producto = (fotos: string[], extra: Record<string, unknown> = {}) => ({
    id: null,
    nombre: 'Abanico Koi',
    categoriaId: 'c1',
    precio: 25000,
    descripcion: '',
    codigo: 'AB-05',
    visible: true,
    colores: [],
    talles: [],
    fotos,
    stock: [{ color: '', talle: '', cantidad: 1 }],
    ...extra,
  });
  const papelera = (nombre: string) => [...g.carpetas.values()].find((c) => c.nombre === nombre)?.papelera;

  it('van a categoría / subcategoría / producto, con nombres en orden', () => {
    const [a, b] = [subir('uno'), subir('dos')];
    admin('guardarProducto', { producto: producto([a, b]) });
    expect(g.ruta(a)).toBe('Mujer/Remeras/AB-05 · Abanico Koi/AB-05-1.jpg');
    expect(g.ruta(b)).toBe('Mujer/Remeras/AB-05 · Abanico Koi/AB-05-2.jpg');
    // Moverlas no rompe nada: la tienda las pide por id.
    expect(llamar('foto', { id: a }).resultado.base64).toBe(Buffer.from('uno').toString('base64'));
  });

  it('sin subcategoría ni código, usa la categoría y el nombre', () => {
    const a = subir('uno');
    admin('guardarProducto', { producto: producto([a], { codigo: '', categoriaId: 'c2', nombre: 'Pañuelo / seda' }) });
    expect(g.ruta(a)).toBe('Accesorios/Pañuelo - seda/Pañuelo - seda-1.jpg');
  });

  it('al reordenar, cambiar de categoría o quitar fotos, se acomodan solas', () => {
    const [a, b, c] = [subir('uno'), subir('dos'), subir('tres')];
    const p = admin('guardarProducto', { producto: producto([a, b, c]) });
    admin('guardarProducto', { producto: { ...producto([c, a]), id: p.id, categoriaId: 'c2' } });
    expect(g.ruta(c)).toBe('Accesorios/AB-05 · Abanico Koi/AB-05-1.jpg');
    expect(g.ruta(a)).toBe('Accesorios/AB-05 · Abanico Koi/AB-05-2.jpg');
    expect(g.ruta(b)).toMatch(/^Fotos sin usar\//);
    expect(papelera('Remeras')).toBe(true); // quedó vacía
    expect(llamar('foto', { id: b }).ok).toBe(true); // nada se borra
  });

  it('al eliminar el producto, sus fotos van a "Fotos sin usar"', () => {
    const a = subir('uno');
    const p = admin('guardarProducto', { producto: producto([a]) });
    admin('eliminarProducto', { id: p.id });
    expect(g.ruta(a)).toMatch(/^Fotos sin usar\//);
    expect(papelera('AB-05 · Abanico Koi')).toBe(true);
  });

  it('nunca mueve archivos de fuera de la carpeta de la tienda', () => {
    g.archivos.set('archivoAjeno12345', { bytes: [1], tipo: 'image/png', carpeta: 'otra', nombre: 'privado.png' });
    admin('guardarProducto', { producto: producto(['archivoAjeno12345']) });
    expect(g.archivos.get('archivoAjeno12345')).toMatchObject({ carpeta: 'otra', nombre: 'privado.png' });
  });

  it('ordenarTodasLasFotos acomoda las de todos los productos', () => {
    const a = subir('uno');
    admin('guardarProducto', { producto: producto([a]) });
    g.hojas.get('Categorias')!.datos[1][2] = 'Ropa'; // se renombró la categoría en la planilla
    g.ejecutar('ordenarTodasLasFotos');
    expect(g.ruta(a)).toBe('Ropa/Remeras/AB-05 · Abanico Koi/AB-05-1.jpg');
  });
});

describe('importar el catálogo de prueba (D-31)', () => {
  const SITIO = 'https://mi-tienda.workers.dev';
  const catalogo = {
    version: 1,
    categorias: [
      { id: 'c1', orden: 1, categoria: 'Accesorios', subcategoria: 'Abanicos', visible: true },
      { id: 'c2', orden: 2, categoria: 'Home', subcategoria: '', visible: true },
    ],
    productos: [
      {
        id: 'AB-01',
        nombre: 'Abanico Menta',
        categoriaId: 'c1',
        precio: 25000,
        descripcion: 'Pintado a mano.',
        codigo: 'AB-01',
        visible: true,
        destacado: true,
        colores: [],
        talles: [],
        fotos: ['/fotos-demo/AB-01-1.jpg', '/fotos-demo/AB-01-2.jpg'],
        stock: [{ color: '', talle: '', cantidad: 1 }],
      },
      {
        id: 'FA-01',
        nombre: 'Fundas Marina',
        categoriaId: 'c2',
        precio: 15000,
        descripcion: '',
        codigo: '',
        visible: true,
        destacado: false,
        colores: ['Azul', 'Gris'],
        talles: [],
        fotos: ['/fotos-demo/FA-01-1.jpg'],
        stock: [{ color: 'Azul', talle: '', cantidad: 2 }],
      },
    ],
  };
  const publicar = () => {
    g.web.set(SITIO + '/importar/catalogo.json', {
      codigo: 200,
      tipo: 'application/json',
      cuerpo: Buffer.from(JSON.stringify(catalogo)),
    });
    for (const p of catalogo.productos)
      for (const f of p.fotos) g.web.set(SITIO + f, { codigo: 200, tipo: 'image/jpeg', cuerpo: Buffer.from('foto ' + f) });
  };
  const configurar = (url: string) => {
    const fila = g.hojas.get('Config')!.datos.find((f) => f[0] === 'importarDesde')!;
    fila[1] = url;
  };
  beforeEach(() => {
    // Planilla recién creada: sin las categorías ni los productos de las otras pruebas.
    g = crearGoogleFalso(DUENA);
  });

  it('trae categorías, productos, stock y fotos, ya ordenadas en Drive', () => {
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    expect(g.ejecutar('importarCatalogo')).toMatch(/Importados: 2 productos/);
    const productos = llamar('catalogo').resultado.productos;
    expect(productos.map((p: any) => p.id)).toEqual(['AB-01', 'FA-01']);
    const abanico = productos[0];
    expect(abanico.destacado).toBe(true);
    expect(abanico.variantes).toMatchObject([{ color: '', talle: '', libre: 1 }]);
    expect(abanico.fotos.map((id: string) => g.ruta(id))).toEqual([
      'Accesorios/Abanicos/AB-01 · Abanico Menta/AB-01-1.jpg',
      'Accesorios/Abanicos/AB-01 · Abanico Menta/AB-01-2.jpg',
    ]);
    expect(llamar('foto', { id: abanico.fotos[1] }).resultado.base64).toBe(
      Buffer.from('foto /fotos-demo/AB-01-2.jpg').toString('base64'),
    );
    // Sin código, la foto lleva el nombre; las combinaciones sin dato quedan en 0.
    expect(g.ruta(productos[1].fotos[0])).toBe('Home/Fundas Marina/Fundas Marina-1.jpg');
    expect(productos[1].variantes.map((v: any) => [v.color, v.libre])).toEqual([
      ['Azul', 2],
      ['Gris', 0],
    ]);
  });

  it('se puede volver a ejecutar sin duplicar', () => {
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    g.ejecutar('importarCatalogo');
    expect(g.ejecutar('importarCatalogo')).toMatch(/Importados: 0 productos. Ya estaban: 2/);
    expect(g.hojas.get('Productos')!.datos).toHaveLength(3); // encabezado + 2
    expect(g.hojas.get('Categorias')!.datos).toHaveLength(3);
  });

  it('avisa qué falta en vez de importar a medias', () => {
    expect(() => g.ejecutar('importarCatalogo')).toThrow(/importarDesde/);
    configurar(SITIO + '/importar/catalogo.json');
    expect(() => g.ejecutar('importarCatalogo')).toThrow(/código 404/);
    publicar();
    g.hojas.get('Categorias')!.appendRow(['otra', 1, 'Ropa', '', true]);
    expect(() => g.ejecutar('importarCatalogo')).toThrow(/c1, c2/);
    expect(g.hojas.get('Productos')!.datos).toHaveLength(1);
  });
  it('no confunde las casillas ✓ vacías con categorías o productos', () => {
    // Así queda la planilla real después de configurarPlanilla: casillas en FALSO hasta la fila 1000.
    for (const [pestana, col] of [
      ['Categorias', 4],
      ['Productos', 6],
    ] as const) {
      const datos = g.hojas.get(pestana)!.datos;
      for (let f = 1; f < 40; f++) {
        datos[f] = datos[f] ?? [];
        datos[f][col] = false;
      }
    }
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    expect(g.ejecutar('importarCatalogo')).toMatch(/Importados: 2 productos/);
    // Se escriben arriba de todo, no después de las casillas.
    expect(g.hojas.get('Categorias')!.datos[1][0]).toBe('c1');
    expect(g.hojas.get('Productos')!.datos[1][0]).toBe('AB-01');
    expect(llamar('admin.catalogo', {}, DUENA).resultado.productos).toHaveLength(2);
  });
  it('reintenta las fotos que fallan y no deja fotos repetidas', () => {
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    // Falla dos veces y a la tercera anda: se importa igual.
    g.fallas.set(SITIO + '/fotos-demo/AB-01-2.jpg', 2);
    expect(g.ejecutar('importarCatalogo')).toMatch(/Importados: 2 productos/);

    // Una importación anterior se cortó en FA-01 y dejó su foto suelta: la nueva la manda a la papelera.
    g = crearGoogleFalso(DUENA);
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    g.fallas.set(SITIO + '/fotos-demo/FA-01-1.jpg', 3);
    expect(() => g.ejecutar('importarCatalogo')).toThrow(/Probé 3 veces/);
    expect(g.hojas.get('Productos')!.datos).toHaveLength(2); // AB-01 quedó; FA-01 no
    expect(g.ejecutar('importarCatalogo')).toMatch(/Importados: 1 productos. Ya estaban: 1/);
    const fotosFundas = [...g.archivos.values()].filter((a) => a.nombre?.startsWith('Fundas Marina-') && !a.papelera);
    expect(fotosFundas).toHaveLength(1);
  });
  it('actualizarFotos cambia las fotos de los productos de la lista y manda las viejas a "Fotos sin usar"', () => {
    publicar();
    configurar(SITIO + '/importar/catalogo.json');
    g.ejecutar('importarCatalogo');
    const antes = llamar('catalogo').resultado.productos[0].fotos as string[];

    // Fotos nuevas publicadas con el mismo nombre (el botón de la marca centrado).
    for (const f of catalogo.productos[0].fotos)
      g.web.set(SITIO + f, { codigo: 200, tipo: 'image/jpeg', cuerpo: Buffer.from('nueva ' + f) });
    const fila = g.hojas.get('Config')!.datos.find((f) => f[0] === 'actualizarFotosDe')!;
    fila[1] = 'AB-01, NO-EXISTE';
    expect(g.ejecutar('actualizarFotos')).toBe(
      'Fotos actualizadas: AB-01. No encontrados o sin fotos en el catálogo: NO-EXISTE. Listo.',
    );

    const despues = llamar('catalogo').resultado.productos[0].fotos as string[];
    expect(despues).toHaveLength(2);
    expect(despues).not.toEqual(antes);
    expect(despues.map((id) => g.ruta(id))).toEqual([
      'Accesorios/Abanicos/AB-01 · Abanico Menta/AB-01-1.jpg',
      'Accesorios/Abanicos/AB-01 · Abanico Menta/AB-01-2.jpg',
    ]);
    expect(llamar('foto', { id: despues[0] }).resultado.base64).toBe(
      Buffer.from('nueva /fotos-demo/AB-01-1.jpg').toString('base64'),
    );
    for (const id of antes) expect(g.ruta(id)).toMatch(/^Fotos sin usar\//);
    expect(fila[1]).toBe(''); // la lista se vació
    // La otra no se tocó.
    expect(g.ruta(llamar('catalogo').resultado.productos[1].fotos[0])).toBe('Home/Fundas Marina/Fundas Marina-1.jpg');
  });

  it('actualizarFotos sin lista avisa qué completar', () => {
    expect(() => g.ejecutar('actualizarFotos')).toThrow(/actualizarFotosDe/);
  });
});
