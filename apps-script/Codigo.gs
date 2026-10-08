/**
 * Tienda con WhatsApp — código de Google Apps Script.
 *
 * Va pegado en la planilla del comercio (Extensiones → Apps Script).
 * Es el "depósito": lee y escribe la planilla y guarda las fotos en Drive.
 * Solo atiende pedidos que llegan desde el puente de Cloudflare con la clave
 * secreta (docs/08-investigacion-fase-2.md y docs/09-guia-conectar-cliente.md).
 *
 * Pasos de instalación: docs/09-guia-conectar-cliente.md
 *   1. Ejecutar configurarPlanilla() una vez.
 *   2. Implementar como aplicación web: "Ejecutar como: yo", "Acceso: cualquier persona".
 */

const VERSION = '1';
const HORA = 3600 * 1000;

// ---------------------------------------------------------------------------
// Pestañas de la planilla (docs/04-modelo-de-datos.md)
// ---------------------------------------------------------------------------

const PESTANAS = {
  Config: ['clave', 'valor', 'para qué sirve'],
  Categorias: ['id', 'orden', 'categoria', 'subcategoria', 'visible'],
  Productos: ['id', 'nombre', 'categoriaId', 'precio', 'descripcion', 'codigo', 'visible', 'colores', 'talles', 'fotos', 'creado', 'actualizado'],
  Stock: ['productoId', 'color', 'talle', 'cantidad'],
  Pedidos: [
    'numero', 'creado', 'venceEn', 'estado', 'nombre', 'whatsapp', 'whatsappNormalizado', 'entrega',
    'direccion', 'localidad', 'pago', 'nota', 'total', 'actualizado',
  ],
  PedidoItems: ['numero', 'productoId', 'nombreProducto', 'color', 'talle', 'cantidad', 'precioUnitario', 'codigo', 'descontado'],
  Registro: ['id', 'fecha', 'accion', 'detalle', 'deshacer'],
};

const CONFIG_INICIAL = [
  ['horasReserva', 24, 'Horas que se reserva el stock de un pedido pendiente.'],
  ['proximoNumero', 1001, 'Próximo número de pedido. No tocar.'],
  ['maxPendientesPorWhatsapp', 2, 'Pedidos pendientes que puede tener un mismo número de WhatsApp.'],
  ['maxUnidadesPorProducto', 10, 'Unidades máximas de un mismo producto en un pedido.'],
  ['maxUnidadesPorPedido', 20, 'Unidades máximas en total por pedido.'],
  ['correosAdmin', '', 'Correos que pueden entrar al admin, separados por coma. El primero es el del negocio.'],
  ['carpetaFotosId', '', 'Carpeta de Drive con las fotos. Se completa sola.'],
];

// ---------------------------------------------------------------------------
// Entrada: el puente de Cloudflare llama con POST (texto JSON)
// ---------------------------------------------------------------------------

function doGet() {
  return responder({ ok: true, resultado: { servicio: 'tienda-whatsapp', version: VERSION } });
}

function doPost(e) {
  let pedido;
  try {
    pedido = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return responder(fallo('servidor', 'Pedido mal formado.'));
  }
  const secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
  if (!secreto || pedido.secreto !== secreto) return responder(fallo('noAutorizado', 'Clave incorrecta.'));
  try {
    return responder({ ok: true, resultado: ejecutar(pedido.accion, pedido.datos || {}, pedido.usuario || '') });
  } catch (err) {
    if (err && err.tipo) return responder(fallo(err.tipo, err.message));
    console.error(err && err.stack ? err.stack : err); // sin datos personales: solo el error técnico
    return responder(fallo('servidor', 'Error inesperado.'));
  }
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fallo(tipo, mensaje) {
  return { ok: false, error: { tipo: tipo, mensaje: mensaje || '' } };
}

function ErrorTienda(tipo, mensaje) {
  const e = new Error(mensaje || tipo);
  e.tipo = tipo;
  return e;
}

const ACCIONES_PUBLICAS = {
  catalogo: () => catalogoPublico(),
  crearPedido: (d) => crearPedido(d),
  foto: (d) => leerFoto(d.id),
};

const ACCIONES_ADMIN = {
  quienSoy: (d, u) => ({ correo: u }),
  catalogo: () => catalogoAdmin(),
  pedidos: (d) => listarPedidos(d.estado),
  pedido: (d) => buscarPedidoPublico(d.numero),
  confirmar: (d) => confirmarPedido(d.numero, !!d.forzar),
  cancelar: (d) => cancelarPedido(d.numero),
  cancelarPendientesDe: (d) => cancelarPendientesDe(d.whatsappNormalizado),
  deshacer: (d) => deshacer(d.accionId),
  ajustarStock: (d) => ajustarStock(d.productoId, d.cambios || []),
  guardarProducto: (d) => guardarProducto(d.producto),
  eliminarProducto: (d) => eliminarProducto(d.id),
  subirFoto: (d) => subirFoto(d.base64, d.tipo),
};

function ejecutar(accion, datos, usuario) {
  vencerReservas();
  if (accion.indexOf('admin.') === 0) {
    verificarAdmin(usuario);
    const f = ACCIONES_ADMIN[accion.slice(6)];
    if (!f) throw ErrorTienda('servidor', 'Acción desconocida.');
    return f(datos, usuario);
  }
  const f = ACCIONES_PUBLICAS[accion];
  if (!f) throw ErrorTienda('servidor', 'Acción desconocida.');
  return f(datos);
}

function verificarAdmin(correo) {
  const permitidos = String(leerConfig().correosAdmin || '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  if (!correo || permitidos.indexOf(String(correo).toLowerCase()) < 0) {
    throw ErrorTienda('noAutorizado', 'Esta cuenta no tiene acceso al admin.');
  }
}

// ---------------------------------------------------------------------------
// Lectura y escritura de pestañas
// ---------------------------------------------------------------------------

function hoja(nombre) {
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h) throw ErrorTienda('servidor', 'Falta la pestaña ' + nombre + '. Ejecutá configurarPlanilla().');
  return h;
}

/** Lee una pestaña como lista de objetos; cada uno recuerda su fila (_fila). */
function leer(nombre) {
  const h = hoja(nombre);
  const valores = h.getDataRange().getValues();
  const cols = PESTANAS[nombre];
  const filas = [];
  for (let i = 1; i < valores.length; i++) {
    const v = valores[i];
    if (v.every((x) => x === '' || x === null)) continue;
    const o = { _fila: i + 1 };
    cols.forEach((c, j) => (o[c] = v[j]));
    filas.push(o);
  }
  return filas;
}

function aFila(nombre, o) {
  return PESTANAS[nombre].map((c) => (o[c] === undefined || o[c] === null ? '' : o[c]));
}

function agregar(nombre, o) {
  hoja(nombre).appendRow(aFila(nombre, o));
}

function agregarVarias(nombre, lista) {
  if (!lista.length) return;
  const h = hoja(nombre);
  const cols = PESTANAS[nombre].length;
  h.getRange(h.getLastRow() + 1, 1, lista.length, cols).setValues(lista.map((o) => aFila(nombre, o)));
}

function actualizar(nombre, o) {
  const cols = PESTANAS[nombre].length;
  hoja(nombre).getRange(o._fila, 1, 1, cols).setValues([aFila(nombre, o)]);
}

/** Borra filas (de abajo hacia arriba para no correr los números). */
function borrarFilas(nombre, objetos) {
  const h = hoja(nombre);
  objetos
    .map((o) => o._fila)
    .sort((a, b) => b - a)
    .forEach((f) => h.deleteRow(f));
}

function leerConfig() {
  const c = {};
  leer('Config').forEach((f) => (c[f.clave] = f.valor));
  return c;
}

function guardarConfig(clave, valor) {
  const fila = leer('Config').find((f) => f.clave === clave);
  if (fila) {
    fila.valor = valor;
    actualizar('Config', fila);
  } else agregar('Config', { clave: clave, valor: valor });
}

function numeroConfig(c, clave, porDefecto) {
  const n = Number(c[clave]);
  return isFinite(n) && n > 0 ? n : porDefecto;
}

const lista = (s) => String(s || '').split('|').map((x) => x.trim()).filter(Boolean);
const siNo = (v) => v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'sí' || String(v).toLowerCase() === 'si';
const ms = (v) => (v instanceof Date ? v.getTime() : Number(v) || 0);
const clave = (pid, color, talle) => pid + '|' + (color || '') + '|' + (talle || '');

function conCandado(fn) {
  const candado = LockService.getScriptLock();
  if (!candado.tryLock(10000)) throw ErrorTienda('servidor', 'La tienda está ocupada. Probá de nuevo.');
  try {
    const r = fn();
    SpreadsheetApp.flush();
    return r;
  } finally {
    candado.releaseLock();
  }
}

function registrar(accion, detalle, deshacer) {
  const id = Utilities.getUuid();
  agregar('Registro', { id: id, fecha: new Date(), accion: accion, detalle: detalle, deshacer: deshacer ? JSON.stringify(deshacer) : '' });
  return id;
}

// ---------------------------------------------------------------------------
// Catálogo y stock
// ---------------------------------------------------------------------------

function combinaciones(colores, talles) {
  const cs = colores.length ? colores : [''];
  const ts = talles.length ? talles : [''];
  const r = [];
  cs.forEach((c) => ts.forEach((t) => r.push({ color: c, talle: t })));
  return r;
}

function reservas(pedidos, items, ahora) {
  const vigentes = {};
  pedidos.forEach((p) => {
    if (p.estado === 'pendiente' && ms(p.venceEn) > ahora) vigentes[p.numero] = true;
  });
  const r = {};
  items.forEach((i) => {
    if (!vigentes[i.numero]) return;
    const k = clave(i.productoId, i.color, i.talle);
    r[k] = (r[k] || 0) + Number(i.cantidad);
  });
  return r;
}

function armarProductos(incluirOcultos) {
  const ahora = Date.now();
  const res = reservas(leer('Pedidos'), leer('PedidoItems'), ahora);
  const stock = leer('Stock');
  return leer('Productos')
    .filter((p) => incluirOcultos || siNo(p.visible))
    .map((p) => {
      const colores = lista(p.colores);
      const talles = lista(p.talles);
      const variantes = combinaciones(colores, talles).map((c) => {
        const fila = stock.find((s) => s.productoId === p.id && String(s.color) === c.color && String(s.talle) === c.talle);
        const cantidad = Math.max(0, Number(fila ? fila.cantidad : 0) || 0);
        const reservado = res[clave(p.id, c.color, c.talle)] || 0;
        return { color: c.color, talle: c.talle, cantidad: cantidad, reservado: reservado, libre: Math.max(0, cantidad - reservado) };
      });
      return {
        id: String(p.id),
        nombre: String(p.nombre),
        categoriaId: String(p.categoriaId),
        precio: Number(p.precio) || 0,
        descripcion: String(p.descripcion || ''),
        codigo: String(p.codigo || ''),
        visible: siNo(p.visible),
        colores: colores,
        talles: talles,
        fotos: lista(p.fotos),
        variantes: variantes,
        creado: ms(p.creado),
        actualizado: ms(p.actualizado),
      };
    });
}

function categorias() {
  return leer('Categorias').map((c) => ({
    id: String(c.id),
    orden: Number(c.orden) || 0,
    categoria: String(c.categoria),
    subcategoria: String(c.subcategoria || ''),
    visible: siNo(c.visible),
  }));
}

/** Lo que ve la tienda: sin cantidades totales ni reservas, solo el stock libre. */
function catalogoPublico() {
  const c = leerConfig();
  return {
    config: { horasReserva: numeroConfig(c, 'horasReserva', 24), proximoNumero: 0 },
    categorias: categorias().filter((x) => x.visible),
    productos: armarProductos(false).map((p) => {
      p.codigo = '';
      p.variantes = p.variantes.map((v) => ({ color: v.color, talle: v.talle, cantidad: v.libre, reservado: 0, libre: v.libre }));
      return p;
    }),
  };
}

function catalogoAdmin() {
  const c = leerConfig();
  return {
    config: { horasReserva: numeroConfig(c, 'horasReserva', 24), proximoNumero: Number(c.proximoNumero) || 0 },
    categorias: categorias(),
    productos: armarProductos(true),
  };
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

function soloDigitos(s) {
  return String(s || '').replace(/\D/g, '');
}

function validarComprador(c) {
  if (!c || !String(c.nombre || '').trim()) throw ErrorTienda('servidor', 'Falta el nombre.');
  if (!/^\d{10}$/.test(String(c.whatsappNormalizado || ''))) throw ErrorTienda('servidor', 'WhatsApp inválido.');
  if (['envio', 'retiro'].indexOf(c.entrega) < 0) throw ErrorTienda('servidor', 'Entrega inválida.');
  if (c.entrega === 'envio' && (!String(c.direccion || '').trim() || !String(c.localidad || '').trim())) {
    throw ErrorTienda('servidor', 'Falta la dirección.');
  }
  if (['transferencia', 'efectivo'].indexOf(c.pago) < 0) throw ErrorTienda('servidor', 'Forma de pago inválida.');
}

const recortar = (s, n) => String(s || '').trim().slice(0, n);

function crearPedido(d) {
  const items = (d && d.items) || [];
  const comprador = d && d.comprador;
  if (!items.length) throw ErrorTienda('servidor', 'El pedido no tiene productos.');
  validarComprador(comprador);

  return conCandado(() => {
    const c = leerConfig();
    const ahora = Date.now();
    const pedidos = leer('Pedidos');

    // Defensas contra pedidos falsos (D-16).
    const maxPorProducto = numeroConfig(c, 'maxUnidadesPorProducto', 10);
    const maxPorPedido = numeroConfig(c, 'maxUnidadesPorPedido', 20);
    const maxPendientes = numeroConfig(c, 'maxPendientesPorWhatsapp', 2);
    let total = 0;
    const porProducto = {};
    items.forEach((it) => {
      const n = Number(it.cantidad);
      if (!(n >= 1) || Math.floor(n) !== n) throw ErrorTienda('servidor', 'Cantidad inválida.');
      total += n;
      porProducto[it.productoId] = (porProducto[it.productoId] || 0) + n;
    });
    if (total > maxPorPedido || Object.keys(porProducto).some((k) => porProducto[k] > maxPorProducto)) {
      throw ErrorTienda('limiteUnidades', 'Demasiadas unidades.');
    }
    const pendientes = pedidos.filter(
      (p) => p.estado === 'pendiente' && ms(p.venceEn) > ahora && String(p.whatsappNormalizado) === comprador.whatsappNormalizado,
    ).length;
    if (pendientes >= maxPendientes) throw ErrorTienda('limitePedidos', 'Demasiados pedidos pendientes.');

    // 1. Verificar stock libre (sumando líneas repetidas).
    const productos = armarProductos(false);
    const pedidoPorVariante = {};
    items.forEach((it) => {
      const k = clave(it.productoId, it.color, it.talle);
      pedidoPorVariante[k] = (pedidoPorVariante[k] || 0) + Number(it.cantidad);
    });
    const lineas = [];
    items.forEach((it) => {
      const p = productos.find((x) => x.id === it.productoId);
      const v = p && p.variantes.find((x) => x.color === (it.color || '') && x.talle === (it.talle || ''));
      if (!v) {
        lineas.push({ productoId: it.productoId, color: it.color || '', talle: it.talle || '', pedida: it.cantidad, libre: 0, motivo: 'noDisponible' });
      } else if (v.libre < pedidoPorVariante[clave(it.productoId, it.color, it.talle)]) {
        lineas.push({ productoId: it.productoId, color: it.color || '', talle: it.talle || '', pedida: it.cantidad, libre: v.libre, motivo: 'sinStock' });
      }
    });
    if (lineas.length) return { ok: false, lineas: lineas };

    // 2. Numerar y reservar.
    const numero = Number(c.proximoNumero) || 1001;
    guardarConfig('proximoNumero', numero + 1);
    const horas = numeroConfig(c, 'horasReserva', 24);
    const creado = new Date(ahora);
    const venceEn = new Date(ahora + horas * HORA);
    const codigos = {};
    leer('Productos').forEach((x) => (codigos[x.id] = String(x.codigo || '')));
    const itemsPedido = items.map((it) => {
      const p = productos.find((x) => x.id === it.productoId);
      return {
        numero: numero,
        productoId: it.productoId,
        nombreProducto: p.nombre,
        color: it.color || '',
        talle: it.talle || '',
        cantidad: Number(it.cantidad),
        precioUnitario: p.precio,
        codigo: codigos[p.id] || '',
        descontado: 0,
      };
    });
    const totalPesos = itemsPedido.reduce((a, i) => a + i.precioUnitario * i.cantidad, 0);
    const fila = {
      numero: numero,
      creado: creado,
      venceEn: venceEn,
      estado: 'pendiente',
      nombre: recortar(comprador.nombre, 80),
      whatsapp: recortar(comprador.whatsapp, 30),
      whatsappNormalizado: comprador.whatsappNormalizado,
      entrega: comprador.entrega,
      direccion: comprador.entrega === 'envio' ? recortar(comprador.direccion, 150) : '',
      localidad: comprador.entrega === 'envio' ? recortar(comprador.localidad, 80) : '',
      pago: comprador.pago,
      nota: recortar(comprador.nota, 300),
      total: totalPesos,
      actualizado: creado,
    };
    agregar('Pedidos', fila);
    agregarVarias('PedidoItems', itemsPedido);
    registrar('pedido creado', '#' + numero);
    return { ok: true, pedido: aPedido(fila, itemsPedido), horasReserva: horas };
  });
}

function aPedido(p, items) {
  return {
    numero: Number(p.numero),
    creado: ms(p.creado),
    venceEn: ms(p.venceEn),
    estado: String(p.estado),
    comprador: {
      nombre: String(p.nombre),
      whatsapp: String(p.whatsapp),
      whatsappNormalizado: String(p.whatsappNormalizado),
      entrega: String(p.entrega),
      direccion: String(p.direccion || ''),
      localidad: String(p.localidad || ''),
      pago: String(p.pago),
      nota: String(p.nota || ''),
    },
    items: items
      .filter((i) => Number(i.numero) === Number(p.numero))
      .map((i) => ({
        productoId: String(i.productoId),
        nombreProducto: String(i.nombreProducto),
        color: String(i.color || ''),
        talle: String(i.talle || ''),
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
        codigo: String(i.codigo || ''),
        descontado: Number(i.descontado) || 0,
      })),
    total: Number(p.total),
    actualizado: ms(p.actualizado),
  };
}

function listarPedidos(estado) {
  const items = leer('PedidoItems');
  return leer('Pedidos')
    .filter((p) => !estado || p.estado === estado)
    .map((p) => aPedido(p, items))
    .sort((a, b) => b.creado - a.creado);
}

function buscarPedidoPublico(numero) {
  const p = leer('Pedidos').find((x) => Number(x.numero) === Number(numero));
  return p ? aPedido(p, leer('PedidoItems')) : null;
}

/** Pasa a "vencida" los pendientes cuyo plazo terminó. También lo corre un disparador cada 10 minutos. */
function vencerReservas() {
  const ahora = Date.now();
  const vencidos = leer('Pedidos').filter((p) => p.estado === 'pendiente' && ms(p.venceEn) <= ahora);
  if (!vencidos.length) return 0;
  conCandado(() => {
    leer('Pedidos')
      .filter((p) => p.estado === 'pendiente' && ms(p.venceEn) <= Date.now())
      .forEach((p) => {
        p.estado = 'vencida';
        p.actualizado = new Date();
        actualizar('Pedidos', p);
        registrar('pedido vencido', '#' + p.numero);
      });
  });
  return vencidos.length;
}

function buscarPedidoFila(numero) {
  const p = leer('Pedidos').find((x) => Number(x.numero) === Number(numero));
  if (!p) throw ErrorTienda('noEncontrado', 'No existe el pedido #' + numero + '.');
  return p;
}

function filaStock(stock, productoId, color, talle) {
  return stock.find((s) => s.productoId === productoId && String(s.color) === (color || '') && String(s.talle) === (talle || ''));
}

function libreDe(productoId, color, talle) {
  const p = armarProductos(true).find((x) => x.id === productoId);
  const v = p && p.variantes.find((x) => x.color === (color || '') && x.talle === (talle || ''));
  return v ? v.libre : 0;
}

function confirmarPedido(numero, forzar) {
  return conCandado(() => {
    const p = buscarPedidoFila(numero);
    if (p.estado !== 'pendiente' && p.estado !== 'vencida') throw ErrorTienda('servidor', 'El pedido ya está ' + p.estado + '.');
    const items = leer('PedidoItems').filter((i) => Number(i.numero) === Number(numero));
    if (p.estado === 'vencida' && !forzar) {
      const faltan = items
        .map((i) => ({ i: i, libre: libreDe(i.productoId, i.color, i.talle) }))
        .filter((x) => x.libre < Number(x.i.cantidad))
        .map((x) => ({ productoId: x.i.productoId, color: String(x.i.color || ''), talle: String(x.i.talle || ''), pedida: Number(x.i.cantidad), libre: x.libre, motivo: 'sinStock' }));
      if (faltan.length) return { ok: false, motivo: 'sinStock', lineas: faltan };
    }
    const stock = leer('Stock');
    const antes = fotoParaDeshacer(p, items, stock);
    items.forEach((i) => {
      const s = filaStock(stock, i.productoId, i.color, i.talle);
      if (!s) {
        i.descontado = 0;
      } else {
        const cant = Number(s.cantidad) || 0;
        const nueva = Math.max(0, cant - Number(i.cantidad));
        i.descontado = cant - nueva;
        s.cantidad = nueva;
        actualizar('Stock', s);
      }
      actualizar('PedidoItems', i);
    });
    p.estado = 'confirmada';
    p.actualizado = new Date();
    actualizar('Pedidos', p);
    const accionId = registrar('pedido confirmado', '#' + numero, antes);
    return { ok: true, accionId: accionId, pedido: aPedido(p, items) };
  });
}

function cancelarPedido(numero) {
  return conCandado(() => {
    const p = buscarPedidoFila(numero);
    if (p.estado === 'cancelada') throw ErrorTienda('servidor', 'El pedido ya está cancelado.');
    const items = leer('PedidoItems').filter((i) => Number(i.numero) === Number(numero));
    const stock = leer('Stock');
    const antes = fotoParaDeshacer(p, items, stock);
    if (p.estado === 'confirmada') {
      items.forEach((i) => {
        const s = filaStock(stock, i.productoId, i.color, i.talle);
        if (s) {
          s.cantidad = (Number(s.cantidad) || 0) + (Number(i.descontado) || 0);
          actualizar('Stock', s);
        }
        i.descontado = 0;
        actualizar('PedidoItems', i);
      });
    }
    p.estado = 'cancelada';
    p.actualizado = new Date();
    actualizar('Pedidos', p);
    const accionId = registrar('pedido cancelado', '#' + numero, antes);
    return { accionId: accionId, pedido: aPedido(p, items) };
  });
}

/** Botón del admin contra pedidos falsos: cancela todos los pendientes de un número (D-16). */
function cancelarPendientesDe(whatsappNormalizado) {
  const numero = soloDigitos(whatsappNormalizado);
  if (numero.length !== 10) throw ErrorTienda('servidor', 'Número inválido.');
  return conCandado(() => {
    const cancelados = [];
    leer('Pedidos')
      .filter((p) => (p.estado === 'pendiente' || p.estado === 'vencida') && String(p.whatsappNormalizado) === numero)
      .forEach((p) => {
        p.estado = 'cancelada';
        p.actualizado = new Date();
        actualizar('Pedidos', p);
        cancelados.push(Number(p.numero));
      });
    if (cancelados.length) registrar('pendientes cancelados', cancelados.length + ' pedidos');
    return { cancelados: cancelados };
  });
}

/** Lo necesario para "Deshacer" (D-05). */
function fotoParaDeshacer(p, items, stock) {
  return {
    numero: Number(p.numero),
    estadoAnterior: p.estado,
    stockAnterior: items
      .map((i) => filaStock(stock, i.productoId, i.color, i.talle))
      .filter(Boolean)
      .map((s) => ({ productoId: s.productoId, color: String(s.color || ''), talle: String(s.talle || ''), cantidad: Number(s.cantidad) || 0 })),
    descontadoAnterior: items.map((i) => Number(i.descontado) || 0),
  };
}

function deshacer(accionId) {
  return conCandado(() => {
    const a = leer('Registro').find((r) => r.id === accionId);
    if (!a || !a.deshacer) throw ErrorTienda('servidor', 'Ese cambio ya no se puede deshacer.');
    const d = JSON.parse(a.deshacer);
    if (d.usado) throw ErrorTienda('servidor', 'Ese cambio ya no se puede deshacer.');
    const p = buscarPedidoFila(d.numero);
    const stock = leer('Stock');
    d.stockAnterior.forEach((s) => {
      const fila = filaStock(stock, s.productoId, s.color, s.talle);
      if (fila) {
        fila.cantidad = s.cantidad;
        actualizar('Stock', fila);
      } else agregar('Stock', s);
    });
    leer('PedidoItems')
      .filter((i) => Number(i.numero) === Number(d.numero))
      .forEach((i, n) => {
        i.descontado = d.descontadoAnterior[n] || 0;
        actualizar('PedidoItems', i);
      });
    p.estado = d.estadoAnterior === 'pendiente' && ms(p.venceEn) <= Date.now() ? 'vencida' : d.estadoAnterior;
    p.actualizado = new Date();
    actualizar('Pedidos', p);
    d.usado = true;
    a.deshacer = JSON.stringify(d);
    actualizar('Registro', a);
    registrar('cambio deshecho', a.accion + ' #' + d.numero);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Productos y stock
// ---------------------------------------------------------------------------

function ajustarStock(productoId, cambios) {
  return conCandado(() => {
    const prod = leer('Productos').find((p) => p.id === productoId);
    if (!prod) throw ErrorTienda('noEncontrado', 'El producto ya no existe.');
    const stock = leer('Stock');
    cambios.forEach((c) => {
      const cantidad = Math.max(0, Math.floor(Number(c.cantidad)) || 0);
      const fila = filaStock(stock, productoId, c.color, c.talle);
      if (fila) {
        fila.cantidad = cantidad;
        actualizar('Stock', fila);
      } else agregar('Stock', { productoId: productoId, color: c.color || '', talle: c.talle || '', cantidad: cantidad });
    });
    prod.actualizado = new Date();
    actualizar('Productos', prod);
    registrar('stock ajustado', String(prod.nombre));
    return armarProductos(true).find((p) => p.id === productoId);
  });
}

function guardarProducto(d) {
  if (!d || !String(d.nombre || '').trim()) throw ErrorTienda('servidor', 'Falta el nombre.');
  const precio = Number(d.precio);
  if (!(precio >= 0) || Math.floor(precio) !== precio) throw ErrorTienda('servidor', 'Precio inválido.');
  if (!d.fotos || !d.fotos.length) throw ErrorTienda('servidor', 'Falta al menos una foto.');
  return conCandado(() => {
    if (!leer('Categorias').some((c) => String(c.id) === d.categoriaId)) throw ErrorTienda('servidor', 'La categoría no existe.');
    const ahora = new Date();
    const productos = leer('Productos');
    let prod = d.id ? productos.find((p) => p.id === d.id) : null;
    if (d.id && !prod) throw ErrorTienda('noEncontrado', 'El producto ya no existe.');
    const campos = {
      nombre: recortar(d.nombre, 120),
      categoriaId: d.categoriaId,
      precio: precio,
      descripcion: recortar(d.descripcion, 2000),
      codigo: recortar(d.codigo, 60),
      visible: !!d.visible,
      colores: (d.colores || []).map((x) => recortar(x, 40)).join('|'),
      talles: (d.talles || []).map((x) => recortar(x, 20)).join('|'),
      fotos: (d.fotos || []).join('|'),
      actualizado: ahora,
    };
    if (prod) {
      Object.keys(campos).forEach((k) => (prod[k] = campos[k]));
      actualizar('Productos', prod);
    } else {
      prod = Object.assign({ id: 'p' + Utilities.getUuid().slice(0, 8), creado: ahora }, campos);
      agregar('Productos', prod);
    }
    const id = prod.id;
    // Stock: solo las combinaciones que existen; el resto se descarta.
    borrarFilas('Stock', leer('Stock').filter((s) => s.productoId === id));
    agregarVarias(
      'Stock',
      combinaciones(lista(campos.colores), lista(campos.talles)).map((c) => {
        const dato = (d.stock || []).find((s) => (s.color || '') === c.color && (s.talle || '') === c.talle);
        return { productoId: id, color: c.color, talle: c.talle, cantidad: Math.max(0, Math.floor(Number(dato ? dato.cantidad : 0)) || 0) };
      }),
    );
    registrar('producto guardado', campos.nombre);
    return armarProductos(true).find((p) => p.id === id);
  });
}

function eliminarProducto(id) {
  return conCandado(() => {
    const prod = leer('Productos').find((p) => p.id === id);
    if (!prod) return true;
    borrarFilas('Stock', leer('Stock').filter((s) => s.productoId === id));
    borrarFilas('Productos', [prod]);
    registrar('producto eliminado', String(prod.nombre));
    return true;
  });
}

// ---------------------------------------------------------------------------
// Fotos (Drive del comercio, D-16)
// ---------------------------------------------------------------------------

const TIPOS_FOTO = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_FOTO = 4 * 1024 * 1024;

function carpetaFotos() {
  const id = leerConfig().carpetaFotosId;
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      /* la carpeta se borró: se crea otra */
    }
  }
  const carpeta = DriveApp.createFolder('Tienda · fotos (no borrar)');
  guardarConfig('carpetaFotosId', carpeta.getId());
  return carpeta;
}

function subirFoto(base64, tipo) {
  if (!TIPOS_FOTO[tipo]) throw ErrorTienda('servidor', 'Formato de foto no admitido.');
  const bytes = Utilities.base64Decode(String(base64 || ''));
  if (!bytes.length || bytes.length > MAX_FOTO) throw ErrorTienda('servidor', 'La foto es demasiado grande.');
  const blob = Utilities.newBlob(bytes, tipo, 'foto-' + Date.now() + '.' + TIPOS_FOTO[tipo]);
  const archivo = carpetaFotos().createFile(blob);
  return archivo.getId();
}

/** Solo devuelve archivos que están en la carpeta de fotos de la tienda. */
function leerFoto(id) {
  if (!/^[\w-]{10,}$/.test(String(id || ''))) throw ErrorTienda('noEncontrado', 'Foto inexistente.');
  let archivo;
  try {
    archivo = DriveApp.getFileById(id);
  } catch (e) {
    throw ErrorTienda('noEncontrado', 'Foto inexistente.');
  }
  const carpetaId = leerConfig().carpetaFotosId;
  const padres = archivo.getParents();
  let enCarpeta = false;
  while (padres.hasNext()) if (padres.next().getId() === carpetaId) enCarpeta = true;
  if (!enCarpeta) throw ErrorTienda('noEncontrado', 'Foto inexistente.');
  const blob = archivo.getBlob();
  return { tipo: blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
}

// ---------------------------------------------------------------------------
// Instalación (se ejecuta a mano una vez, desde el editor)
// ---------------------------------------------------------------------------

/**
 * Crea las pestañas con sus encabezados, las protege, completa la
 * configuración inicial, crea la carpeta de fotos, instala el proceso
 * automático de vencimiento y genera la clave secreta.
 * Se puede volver a ejecutar sin perder datos.
 */
function configurarPlanilla() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(PESTANAS).forEach((nombre) => {
    let h = libro.getSheetByName(nombre);
    if (!h) h = libro.insertSheet(nombre);
    const cols = PESTANAS[nombre];
    h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    h.setFrozenRows(1);
    // Solo el script y quien mantiene el sitio escriben acá.
    const protecciones = h.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (!protecciones.length) h.protect().setDescription('Tienda: no editar a mano').setWarningOnly(true);
  });

  const config = leerConfig();
  CONFIG_INICIAL.forEach((fila) => {
    if (!(fila[0] in config)) agregar('Config', { clave: fila[0], valor: fila[1], 'para qué sirve': fila[2] });
  });
  if (!String(leerConfig().correosAdmin || '').trim()) {
    guardarConfig('correosAdmin', Session.getEffectiveUser().getEmail());
  }
  carpetaFotos();

  const visible = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  hoja('Categorias').getRange('E2:E1000').setDataValidation(visible);
  hoja('Productos').getRange('G2:G1000').setDataValidation(visible);

  // Proceso automático: vence reservas cada 10 minutos.
  const yaEsta = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === 'vencerReservas');
  if (!yaEsta) ScriptApp.newTrigger('vencerReservas').timeBased().everyMinutes(10).create();

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRETO')) props.setProperty('SECRETO', Utilities.getUuid() + Utilities.getUuid());
  // El editor solo muestra lo que pasa por console.log (en el "Registro de ejecución").
  console.log('Listo. Clave secreta para Cloudflare (APPS_SCRIPT_SECRETO): ' + props.getProperty('SECRETO'));
  return props.getProperty('SECRETO');
}

/** Si la clave se filtró: crea una nueva. Después hay que cargarla en Cloudflare (la vieja deja de andar). */
function cambiarClaveSecreta() {
  PropertiesService.getScriptProperties().setProperty('SECRETO', Utilities.getUuid() + Utilities.getUuid());
  return verClaveSecreta();
}

/** Muestra la clave secreta (para copiarla en Cloudflare). */
function verClaveSecreta() {
  const s = PropertiesService.getScriptProperties().getProperty('SECRETO');
  console.log(s ? 'Clave secreta: ' + s : 'Todavía no hay clave: ejecutá configurarPlanilla().');
  return s;
}
