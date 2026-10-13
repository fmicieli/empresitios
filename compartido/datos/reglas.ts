// Reglas de negocio escritas una sola vez (docs/04-modelo-de-datos.md y 07-decisiones.md).
// Son funciones puras: no leen ni guardan nada. Se prueban en reglas.test.ts.

import type { Categoria, FilaCategoria, ItemCarrito, Pedido, Producto, Variante } from './tipos';

const HORA = 3600 * 1000;

// ---------- Texto y búsqueda ----------

/** Minúsculas y sin tildes, carácter por carácter (mantiene las posiciones). */
export function normalizarTexto(texto: string): string {
  let salida = '';
  for (const c of texto) {
    salida += c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || c;
  }
  return salida;
}

export function coincide(texto: string, busqueda: string): boolean {
  const q = normalizarTexto(busqueda.trim());
  return q === '' || normalizarTexto(texto).includes(q);
}

/** Parte un nombre en trozos para resaltar la palabra buscada. */
export function resaltar(texto: string, busqueda: string): { texto: string; resaltado: boolean }[] {
  const q = normalizarTexto(busqueda.trim());
  if (!q) return [{ texto, resaltado: false }];
  const caracteres = [...texto];
  const normal = normalizarTexto(texto);
  const i = normal.indexOf(q);
  if (i < 0) return [{ texto, resaltado: false }];
  const trozos = [
    { texto: caracteres.slice(0, i).join(''), resaltado: false },
    { texto: caracteres.slice(i, i + q.length).join(''), resaltado: true },
    { texto: caracteres.slice(i + q.length).join(''), resaltado: false },
  ];
  return trozos.filter((t) => t.texto !== '');
}

// ---------- Precios ----------

/** "15.000", "$ 15000" o "15000" → 15000. Si no hay dígitos, NaN. */
export function parsePrecio(valor: string | number): number {
  const digitos = String(valor).replace(/\D/g, '');
  return digitos ? parseInt(digitos, 10) : NaN;
}

/** 15000 → "$ 15.000" */
export function formatoPrecio(n: number): string {
  const entero = Math.round(n);
  return '$ ' + String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ---------- WhatsApp (D-02) ----------

export type WhatsappNormalizado = { ok: true; diezDigitos: string; internacional: string; paraMostrar: string } | { ok: false };

/**
 * Acepta cualquier formato argentino (+54, 9, 0, 15, espacios, guiones)
 * y devuelve los 10 dígitos: código de área + número.
 */
export function normalizarWhatsapp(crudo: string): WhatsappNormalizado {
  let d = String(crudo ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('9') && d.length === 11) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);

  let largoArea: number | null = null;
  if (d.length === 12) {
    // Hay un 15 después del código de área.
    const candidatos = d.startsWith('11') ? [2] : [3, 4];
    for (const k of candidatos) {
      if (d.slice(k, k + 2) === '15') {
        d = d.slice(0, k) + d.slice(k + 2);
        largoArea = k;
        break;
      }
    }
  }
  if (d.length !== 10 || d.startsWith('0') || d.startsWith('15')) return { ok: false };

  if (largoArea === null) largoArea = d.startsWith('11') ? 2 : 3;
  const area = d.slice(0, largoArea);
  const numero = d.slice(largoArea);
  const corte = numero.length - 4;
  const paraMostrar = `+54 9 ${area} ${numero.slice(0, corte)}-${numero.slice(corte)}`;
  return { ok: true, diezDigitos: d, internacional: '549' + d, paraMostrar };
}

/** Link de WhatsApp con texto armado. `numero` ya en formato internacional (solo dígitos). */
export function linkWhatsapp(numero: string, texto?: string): string {
  const base = 'https://wa.me/' + numero.replace(/\D/g, '');
  return texto ? base + '?text=' + encodeURIComponent(texto) : base;
}

// ---------- Variantes y stock ----------

export function claveVariante(color: string, talle: string): string {
  return (color || '') + '|' + (talle || '');
}

/** "Negro · Talle M", "Talle 38", "Negro" o "" si no tiene variantes. */
export function etiquetaVariante(color: string, talle: string): string {
  return [color, talle ? 'Talle ' + talle : ''].filter(Boolean).join(' · ');
}

/** Todas las combinaciones color × talle de un producto. */
export function combinaciones(colores: string[], talles: string[]): { color: string; talle: string }[] {
  const cs = colores.length ? colores : [''];
  const ts = talles.length ? talles : [''];
  return cs.flatMap((color) => ts.map((talle) => ({ color, talle })));
}

export function estaVigente(pedido: Pick<Pedido, 'estado' | 'venceEn'>, ahora: number): boolean {
  return pedido.estado === 'pendiente' && pedido.venceEn > ahora;
}

/** Unidades reservadas por variante, de pedidos pendientes no vencidos. */
export function reservasPorVariante(pedidos: Pedido[], ahora: number): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const p of pedidos) {
    if (!estaVigente(p, ahora)) continue;
    for (const it of p.items) {
      const k = it.productoId + '|' + claveVariante(it.color, it.talle);
      mapa.set(k, (mapa.get(k) ?? 0) + it.cantidad);
    }
  }
  return mapa;
}

export function armarVariantes(
  productoId: string,
  colores: string[],
  talles: string[],
  stock: { color: string; talle: string; cantidad: number }[],
  reservas: Map<string, number>,
): Variante[] {
  return combinaciones(colores, talles).map(({ color, talle }) => {
    const fila = stock.find((s) => s.color === color && s.talle === talle);
    const cantidad = Math.max(0, fila?.cantidad ?? 0);
    const reservado = reservas.get(productoId + '|' + claveVariante(color, talle)) ?? 0;
    return { color, talle, cantidad, reservado, libre: Math.max(0, cantidad - reservado) };
  });
}

export function variante(p: Producto, color: string, talle: string): Variante | undefined {
  return p.variantes.find((v) => v.color === color && v.talle === talle);
}

export function libreTotal(p: Producto): number {
  return p.variantes.reduce((a, v) => a + v.libre, 0);
}

export function stockTotal(p: Producto): number {
  return p.variantes.reduce((a, v) => a + v.cantidad, 0);
}

// ---------- Carrito ----------

export type EstadoLinea = 'ok' | 'parcial' | 'agotado' | 'noDisponible';

export interface LineaEvaluada {
  item: ItemCarrito;
  producto: Producto | null;
  libre: number;
  estado: EstadoLinea;
  /** Subtotal con el precio vigente; 0 si la línea tiene problemas. */
  subtotal: number;
}

/** Revisa cada línea del carrito contra el stock libre actual. */
export function evaluarCarrito(items: ItemCarrito[], productos: Producto[]): LineaEvaluada[] {
  return items.map((item) => {
    const producto = productos.find((p) => p.id === item.productoId) ?? null;
    if (!producto || !producto.visible) {
      return { item, producto, libre: 0, estado: 'noDisponible', subtotal: 0 };
    }
    const v = variante(producto, item.color, item.talle);
    if (!v) return { item, producto, libre: 0, estado: 'noDisponible', subtotal: 0 };
    const libre = v.libre;
    const estado: EstadoLinea = libre <= 0 ? 'agotado' : libre < item.cantidad ? 'parcial' : 'ok';
    return { item, producto, libre, estado, subtotal: estado === 'ok' ? producto.precio * item.cantidad : 0 };
  });
}

// ---------- Categorías ----------

/** Agrupa las filas de la planilla en el menú de dos niveles, en el orden de la planilla. */
export function agruparCategorias(filas: FilaCategoria[]): Categoria[] {
  const salida: Categoria[] = [];
  for (const f of [...filas].filter((x) => x.visible).sort((a, b) => a.orden - b.orden)) {
    let cat = salida.find((c) => c.nombre === f.categoria);
    if (!cat) {
      cat = { nombre: f.categoria, id: null, subcategorias: [] };
      salida.push(cat);
    }
    if (f.subcategoria) cat.subcategorias.push({ id: f.id, nombre: f.subcategoria });
    else cat.id = f.id;
  }
  return salida;
}

/** "Mujer › Remeras" o "Accesorios" a partir del id. */
export function nombreCategoria(filas: FilaCategoria[], id: string): string {
  const f = filas.find((x) => x.id === id);
  if (!f) return '';
  return f.subcategoria ? f.categoria + ' › ' + f.subcategoria : f.categoria;
}

export function categoriaPrincipal(filas: FilaCategoria[], id: string): string {
  return filas.find((x) => x.id === id)?.categoria ?? '';
}

// ---------- Tiempo ----------

/** "vence en 23 h" / "vence en 40 min" / "vencida". */
export function tiempoRestante(venceEn: number, ahora: number): { texto: string; urgente: boolean; horas: number } {
  const ms = venceEn - ahora;
  if (ms <= 0) return { texto: 'vencida', urgente: true, horas: 0 };
  const horas = Math.floor(ms / HORA);
  const texto = horas >= 1 ? `vence en ${horas} h` : `vence en ${Math.max(1, Math.round(ms / 60000))} min`;
  return { texto, urgente: ms < 3 * HORA, horas };
}

/** "recién", "hace 5 min", "hace 2 h", "hace 3 d". */
export function hace(momento: number, ahora: number): string {
  const min = Math.round((ahora - momento) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "hasta mañana a las 15:20" / "hasta hoy a las 18:00" / "hasta el jueves a las 9:05". */
export function fechaReserva(venceEn: number, ahora: number): string {
  const v = new Date(venceEn);
  const a = new Date(ahora);
  const hhmm = `${v.getHours()}:${String(v.getMinutes()).padStart(2, '0')}`;
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dif = Math.round((dia(v) - dia(a)) / (24 * HORA));
  if (dif === 0) return `hoy a las ${hhmm}`;
  if (dif === 1) return `mañana a las ${hhmm}`;
  return `el ${DIAS[v.getDay()]} a las ${hhmm}`;
}

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? '';
}

/** "Lucía G." para listas (menos datos personales a la vista). */
export function nombreCorto(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[1].charAt(0)}.` : (partes[0] ?? '');
}

// ---------- Topes contra pedidos falsos (D-16) ----------

export const TOPES_POR_DEFECTO = { maxUnidadesPorProducto: 10, maxUnidadesPorPedido: 20 };

/**
 * Cuántas unidades más de un producto entran en el pedido sin pasar los topes.
 * No mira el stock: eso se resuelve aparte.
 */
export function lugarEnPedido(
  items: ItemCarrito[],
  productoId: string,
  config?: { maxUnidadesPorProducto?: number; maxUnidadesPorPedido?: number },
): number {
  const porProducto = config?.maxUnidadesPorProducto ?? TOPES_POR_DEFECTO.maxUnidadesPorProducto;
  const porPedido = config?.maxUnidadesPorPedido ?? TOPES_POR_DEFECTO.maxUnidadesPorPedido;
  const delProducto = items.filter((i) => i.productoId === productoId).reduce((a, i) => a + i.cantidad, 0);
  const total = items.reduce((a, i) => a + i.cantidad, 0);
  return Math.max(0, Math.min(porProducto - delProducto, porPedido - total));
}

/** "Huella" de un pedido: mismos productos, variantes y cantidades dan la misma huella. */
export function huellaItems(items: { productoId: string; color: string; talle: string; cantidad: number }[]): string {
  const suma = new Map<string, number>();
  for (const it of items) {
    const k = `${it.productoId}|${it.color}|${it.talle}`;
    suma.set(k, (suma.get(k) ?? 0) + it.cantidad);
  }
  return [...suma.keys()]
    .sort()
    .map((k) => `${k}×${suma.get(k)}`)
    .join(';');
}
