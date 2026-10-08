// Implementación "local" de la capa de datos: simula la planilla de Google
// dentro del navegador, con la demora y los errores de un servidor real.
// Sirve para probar todo sin backend (Fase 1).

import { armarVariantes, claveVariante, combinaciones, reservasPorVariante } from '../reglas';
import {
  ErrorDatos,
  type ConfigServidor,
  type DataStore,
  type EstadoPedido,
  type FilaCategoria,
  type LineaConProblema,
  type Pedido,
  type Producto,
  type ProductoAGuardar,
  type TipoError,
} from '../tipos';
import { esFotoLocal, fotosEnMemoria, type AlmacenFotos } from './fotos';
import type { Semilla } from './semilla';

const HORA = 3600 * 1000;

type FilaProducto = Omit<Producto, 'variantes'>;
type FilaStock = { productoId: string; color: string; talle: string; cantidad: number };

interface Accion {
  id: string;
  fecha: number;
  accion: string;
  detalle: string;
  /** Lo necesario para "Deshacer" (D-05). */
  deshacer?: {
    numero: number;
    estadoAnterior: EstadoPedido;
    stockAnterior: FilaStock[];
    descontadoAnterior: number[];
    usado: boolean;
  };
}

/** Lo que se guarda en el navegador: las mismas pestañas que la planilla. */
interface EstadoLocal {
  version: 1;
  config: ConfigServidor;
  categorias: FilaCategoria[];
  productos: FilaProducto[];
  stock: FilaStock[];
  pedidos: Pedido[];
  registro: Accion[];
  /** Cuánto se adelantó el reloj con las herramientas de prueba (ms). */
  desplazamientoReloj: number;
}

/** Ajustes de las herramientas de prueba (no forman parte del producto). */
export interface AjustesPrueba {
  demora: 'realista' | 'ninguna';
  /** Mientras esté activo, todo lo que se guarda falla con este error (para ver los mensajes de error). */
  fallarAlGuardar: TipoError | null;
  /** WhatsApp de la tienda para recibir los pedidos de prueba. */
  whatsappTienda: string;
}

export interface StorageSimple {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface OpcionesLocal {
  semilla: Semilla;
  /** Prefijo de las claves en el navegador, por ejemplo "tienda-modelo". */
  clave: string;
  almacen?: StorageSimple;
  fotos?: AlmacenFotos;
  /** Carpeta pública de las fotos de ejemplo, por ejemplo "/fotos-demo/". */
  baseFotos?: string;
  /** Forzar demora (ms). Si no se pasa, usa los ajustes de prueba. */
  demoraFija?: number;
}

export interface HerramientasPrueba {
  getAjustes(): AjustesPrueba;
  setAjustes(cambios: Partial<AjustesPrueba>): void;
  /** Vuelve a los datos de ejemplo. */
  restaurar(): Promise<void>;
  /** Adelanta el reloj (para simular que pasaron las horas de reserva). */
  adelantarReloj(horas: number): void;
  setHorasReserva(horas: number): void;
  contarPendientes(): number;
}

export type DataStoreLocal = DataStore & { herramientas: HerramientasPrueba };

function memoria(): StorageSimple {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

function nuevoId(prefijo: string): string {
  return prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function estadoDesdeSemilla(s: Semilla, ahora: number): EstadoLocal {
  const productos: FilaProducto[] = s.productos.map(({ stock: _s, ...p }) => ({ ...p, creado: ahora, actualizado: ahora }));
  const stock: FilaStock[] = s.productos.flatMap((p) => p.stock.map((st) => ({ productoId: p.id, ...st })));
  const pedidos: Pedido[] = s.pedidos.map((sp) => {
    const creado = ahora - sp.haceMinutos * 60000;
    const items = sp.items.map((it) => {
      const p = s.productos.find((x) => x.id === it.productoId)!;
      return {
        ...it,
        nombreProducto: p.nombre,
        precioUnitario: p.precio,
        codigo: p.codigo,
        descontado: sp.estado === 'confirmada' ? it.cantidad : 0,
      };
    });
    return {
      numero: sp.numero,
      creado,
      venceEn: creado + s.config.horasReserva * HORA,
      estado: sp.estado,
      comprador: sp.comprador,
      items,
      total: items.reduce((a, i) => a + i.precioUnitario * i.cantidad, 0),
      actualizado: creado,
    };
  });
  return {
    version: 1,
    config: { ...s.config },
    categorias: s.categorias.map((c) => ({ ...c })),
    productos,
    stock,
    pedidos,
    registro: [],
    desplazamientoReloj: 0,
  };
}

const AJUSTES_INICIALES: AjustesPrueba = { demora: 'realista', fallarAlGuardar: null, whatsappTienda: '' };

export function crearDataStoreLocal(op: OpcionesLocal): DataStoreLocal {
  const almacen = op.almacen ?? (typeof localStorage !== 'undefined' ? localStorage : memoria());
  const fotos = op.fotos ?? fotosEnMemoria();
  const claveDatos = `${op.clave}:datos:v1`;
  const claveAjustes = `${op.clave}:pruebas`;
  const oyentes = new Set<() => void>();

  // ---------- lectura y escritura del "archivo" ----------

  function leer(): EstadoLocal {
    try {
      const crudo = almacen.getItem(claveDatos);
      if (crudo) {
        const e = JSON.parse(crudo) as EstadoLocal;
        if (e.version === 1) return e;
      }
    } catch {
      /* datos dañados: se vuelve a la semilla */
    }
    const e = estadoDesdeSemilla(op.semilla, Date.now());
    escribir(e);
    return e;
  }

  function escribir(e: EstadoLocal) {
    try {
      almacen.setItem(claveDatos, JSON.stringify(e));
    } catch {
      throw new ErrorDatos('servidor', 'El navegador no tiene más espacio para guardar.');
    }
  }

  function getAjustes(): AjustesPrueba {
    try {
      return { ...AJUSTES_INICIALES, ...JSON.parse(almacen.getItem(claveAjustes) ?? '{}') };
    } catch {
      return { ...AJUSTES_INICIALES };
    }
  }

  function ahora(): number {
    return Date.now() + leer().desplazamientoReloj;
  }

  function avisar() {
    oyentes.forEach((fn) => fn());
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (ev) => {
      if (ev.key === claveDatos) avisar();
    });
  }

  /** Simula la ida y vuelta al servidor: demora y errores de prueba. */
  async function viaje(tipo: 'lectura' | 'escritura') {
    const aj = getAjustes();
    let ms = op.demoraFija;
    if (ms === undefined) {
      if (aj.demora === 'ninguna') ms = 0;
      else ms = tipo === 'lectura' ? 300 + Math.random() * 600 : 1000 + Math.random() * 2000;
    }
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    // Solo fallan las operaciones que guardan (confirmar, enviar un pedido, guardar stock…):
    // así las lecturas de fondo no "gastan" la falla antes de que la veas.
    if (tipo === 'escritura' && aj.fallarAlGuardar) throw new ErrorDatos(aj.fallarAlGuardar);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErrorDatos('sinConexion');
  }

  /** Bloqueo entre pestañas, como LockService en Apps Script. */
  async function conBloqueo<T>(fn: () => T): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? (navigator as Navigator).locks : undefined;
    if (locks?.request) return locks.request(claveDatos, async () => fn()) as Promise<T>;
    return fn();
  }

  /** Pasa a "vencida" los pendientes cuyo plazo terminó. Devuelve si cambió algo. */
  function vencer(e: EstadoLocal, t: number): boolean {
    let cambio = false;
    for (const p of e.pedidos) {
      if (p.estado === 'pendiente' && p.venceEn <= t) {
        p.estado = 'vencida';
        p.actualizado = t;
        registrar(e, t, 'pedido vencido', `#${p.numero}`);
        cambio = true;
      }
    }
    return cambio;
  }

  function registrar(e: EstadoLocal, t: number, accion: string, detalle: string, deshacer?: Accion['deshacer']): Accion {
    const a: Accion = { id: nuevoId('a'), fecha: t, accion, detalle, deshacer };
    e.registro.push(a);
    if (e.registro.length > 500) e.registro.splice(0, e.registro.length - 500);
    return a;
  }

  /** Lee, vence reservas y, si hace falta, guarda. Para las lecturas. */
  function leerAlDia(): { e: EstadoLocal; t: number } {
    const e = leer();
    const t = Date.now() + e.desplazamientoReloj;
    if (vencer(e, t)) escribir(e);
    return { e, t };
  }

  /** Lee, aplica un cambio y guarda, todo bajo bloqueo. Para las escrituras. */
  async function modificar<T>(fn: (e: EstadoLocal, t: number) => T): Promise<T> {
    await viaje('escritura');
    const r = await conBloqueo(() => {
      const e = leer();
      const t = Date.now() + e.desplazamientoReloj;
      vencer(e, t);
      const res = fn(e, t);
      escribir(e);
      return res;
    });
    avisar();
    return r;
  }

  function armarProducto(e: EstadoLocal, p: FilaProducto, t: number): Producto {
    const reservas = reservasPorVariante(e.pedidos, t);
    const filas = e.stock.filter((s) => s.productoId === p.id);
    return { ...p, variantes: armarVariantes(p.id, p.colores, p.talles, filas, reservas) };
  }

  function filaStock(e: EstadoLocal, productoId: string, color: string, talle: string): FilaStock | undefined {
    return e.stock.find((s) => s.productoId === productoId && s.color === color && s.talle === talle);
  }

  function libreDe(e: EstadoLocal, t: number, productoId: string, color: string, talle: string): number {
    const cant = filaStock(e, productoId, color, talle)?.cantidad ?? 0;
    const res = reservasPorVariante(e.pedidos, t).get(productoId + '|' + claveVariante(color, talle)) ?? 0;
    return Math.max(0, cant - res);
  }

  function buscarPedido(e: EstadoLocal, numero: number): Pedido {
    const p = e.pedidos.find((x) => x.numero === numero);
    if (!p) throw new ErrorDatos('noEncontrado', `No existe el pedido #${numero}.`);
    return p;
  }

  function fotoDeEstado(p: Pedido, e: EstadoLocal) {
    return {
      stockAnterior: p.items
        .map((it) => filaStock(e, it.productoId, it.color, it.talle))
        .filter((s): s is FilaStock => !!s)
        .map((s) => ({ ...s })),
      descontadoAnterior: p.items.map((it) => it.descontado),
    };
  }

  const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

  // ---------- la interfaz ----------

  const ds: DataStoreLocal = {
    tipo: 'local',
    ahora,

    async getConfig() {
      await viaje('lectura');
      return { ...leerAlDia().e.config };
    },

    async getCategorias() {
      await viaje('lectura');
      return copia(leerAlDia().e.categorias);
    },

    async getProductos(opciones) {
      await viaje('lectura');
      const { e, t } = leerAlDia();
      return e.productos.filter((p) => opciones?.incluirOcultos || p.visible).map((p) => armarProducto(e, p, t));
    },

    async getProducto(id) {
      await viaje('lectura');
      const { e, t } = leerAlDia();
      const p = e.productos.find((x) => x.id === id);
      return p ? armarProducto(e, p, t) : null;
    },

    async crearPedido({ items, comprador }) {
      // Validaciones del lado del "servidor": nunca confiar solo en el navegador.
      if (!items.length) throw new ErrorDatos('servidor', 'El pedido no tiene productos.');
      if (!comprador.nombre.trim() || !/^\d{10}$/.test(comprador.whatsappNormalizado)) {
        throw new ErrorDatos('servidor', 'Faltan datos del comprador.');
      }
      if (comprador.entrega === 'envio' && (!comprador.direccion.trim() || !comprador.localidad.trim())) {
        throw new ErrorDatos('servidor', 'Falta la dirección de entrega.');
      }
      return modificar((e, t) => {
        // 1. Verificar stock libre de cada línea (sumando líneas repetidas).
        const pedidoPorVariante = new Map<string, number>();
        const problemas: LineaConProblema[] = [];
        for (const it of items) {
          const k = it.productoId + '|' + claveVariante(it.color, it.talle);
          pedidoPorVariante.set(k, (pedidoPorVariante.get(k) ?? 0) + it.cantidad);
        }
        for (const it of items) {
          const prod = e.productos.find((p) => p.id === it.productoId);
          const existe =
            prod &&
            prod.visible &&
            combinaciones(prod.colores, prod.talles).some((c) => c.color === it.color && c.talle === it.talle);
          if (!existe || !Number.isInteger(it.cantidad) || it.cantidad < 1) {
            problemas.push({ ...it, pedida: it.cantidad, libre: 0, motivo: 'noDisponible' });
            continue;
          }
          const libre = libreDe(e, t, it.productoId, it.color, it.talle);
          const k = it.productoId + '|' + claveVariante(it.color, it.talle);
          if (libre < (pedidoPorVariante.get(k) ?? 0)) {
            problemas.push({
              productoId: it.productoId,
              color: it.color,
              talle: it.talle,
              pedida: it.cantidad,
              libre,
              motivo: 'sinStock',
            });
          }
        }
        if (problemas.length) return { ok: false as const, lineas: problemas };

        // 2. Numerar y reservar.
        const numero = e.config.proximoNumero;
        e.config.proximoNumero = numero + 1;
        const itemsPedido = items.map((it) => {
          const prod = e.productos.find((p) => p.id === it.productoId)!;
          return {
            productoId: it.productoId,
            nombreProducto: prod.nombre,
            color: it.color,
            talle: it.talle,
            cantidad: it.cantidad,
            precioUnitario: prod.precio,
            codigo: prod.codigo,
            descontado: 0,
          };
        });
        const pedido: Pedido = {
          numero,
          creado: t,
          venceEn: t + e.config.horasReserva * HORA,
          estado: 'pendiente',
          comprador: { ...comprador, nombre: comprador.nombre.trim() },
          items: itemsPedido,
          total: itemsPedido.reduce((a, i) => a + i.precioUnitario * i.cantidad, 0),
          actualizado: t,
        };
        e.pedidos.push(pedido);
        registrar(e, t, 'pedido creado', `#${numero}`);
        return { ok: true as const, pedido: copia(pedido), horasReserva: e.config.horasReserva };
      });
    },

    async getPedidos(filtro) {
      await viaje('lectura');
      const { e } = leerAlDia();
      return copia(e.pedidos.filter((p) => !filtro?.estado || p.estado === filtro.estado).sort((a, b) => b.creado - a.creado));
    },

    async getPedido(numero) {
      await viaje('lectura');
      const p = leerAlDia().e.pedidos.find((x) => x.numero === numero);
      return p ? copia(p) : null;
    },

    async confirmarPedido(numero, opciones) {
      return modificar((e, t) => {
        const p = buscarPedido(e, numero);
        if (p.estado !== 'pendiente' && p.estado !== 'vencida') {
          throw new ErrorDatos('servidor', `El pedido #${numero} ya está ${p.estado}.`);
        }
        if (p.estado === 'vencida' && !opciones?.forzar) {
          const faltan: LineaConProblema[] = p.items
            .map((it) => ({ it, libre: libreDe(e, t, it.productoId, it.color, it.talle) }))
            .filter(({ it, libre }) => libre < it.cantidad)
            .map(({ it, libre }) => ({
              productoId: it.productoId,
              color: it.color,
              talle: it.talle,
              pedida: it.cantidad,
              libre,
              motivo: 'sinStock' as const,
            }));
          if (faltan.length) return { ok: false as const, motivo: 'sinStock' as const, lineas: faltan };
        }
        const antes = fotoDeEstado(p, e);
        const estadoAnterior = p.estado;
        for (const it of p.items) {
          const fila = filaStock(e, it.productoId, it.color, it.talle);
          if (!fila) {
            it.descontado = 0;
            continue;
          }
          const nueva = Math.max(0, fila.cantidad - it.cantidad);
          it.descontado = fila.cantidad - nueva;
          fila.cantidad = nueva;
        }
        p.estado = 'confirmada';
        p.actualizado = t;
        const a = registrar(e, t, 'pedido confirmado', `#${numero}`, { numero, estadoAnterior, ...antes, usado: false });
        return { ok: true as const, accionId: a.id, pedido: copia(p) };
      });
    },

    async cancelarPedido(numero) {
      return modificar((e, t) => {
        const p = buscarPedido(e, numero);
        if (p.estado === 'cancelada') throw new ErrorDatos('servidor', `El pedido #${numero} ya está cancelado.`);
        const antes = fotoDeEstado(p, e);
        const estadoAnterior = p.estado;
        if (p.estado === 'confirmada') {
          for (const it of p.items) {
            const fila = filaStock(e, it.productoId, it.color, it.talle);
            if (fila) fila.cantidad += it.descontado;
            it.descontado = 0;
          }
        }
        p.estado = 'cancelada';
        p.actualizado = t;
        const a = registrar(e, t, 'pedido cancelado', `#${numero}`, { numero, estadoAnterior, ...antes, usado: false });
        return { accionId: a.id, pedido: copia(p) };
      });
    },

    async deshacer(accionId) {
      return modificar((e, t) => {
        const a = e.registro.find((x) => x.id === accionId);
        if (!a?.deshacer || a.deshacer.usado) throw new ErrorDatos('servidor', 'Ese cambio ya no se puede deshacer.');
        const d = a.deshacer;
        const p = buscarPedido(e, d.numero);
        for (const s of d.stockAnterior) {
          const fila = filaStock(e, s.productoId, s.color, s.talle);
          if (fila) fila.cantidad = s.cantidad;
          else e.stock.push({ ...s });
        }
        p.items.forEach((it, i) => (it.descontado = d.descontadoAnterior[i] ?? 0));
        // Si mientras tanto venció el plazo, vuelve como vencida.
        p.estado = d.estadoAnterior === 'pendiente' && p.venceEn <= t ? 'vencida' : d.estadoAnterior;
        p.actualizado = t;
        d.usado = true;
        registrar(e, t, 'cambio deshecho', `${a.accion} #${d.numero}`);
      });
    },

    async ajustarStock(productoId, cambios) {
      return modificar((e, t) => {
        const prod = e.productos.find((p) => p.id === productoId);
        if (!prod) throw new ErrorDatos('noEncontrado', 'El producto ya no existe.');
        for (const c of cambios) {
          const cantidad = Math.max(0, Math.floor(c.cantidad) || 0);
          const fila = filaStock(e, productoId, c.color, c.talle);
          if (fila) fila.cantidad = cantidad;
          else e.stock.push({ productoId, color: c.color, talle: c.talle, cantidad });
        }
        prod.actualizado = t;
        registrar(e, t, 'stock ajustado', prod.nombre);
        return armarProducto(e, prod, t);
      });
    },

    async guardarProducto(datos: ProductoAGuardar) {
      if (!datos.nombre.trim() || !Number.isInteger(datos.precio) || datos.precio < 0 || !datos.fotos.length) {
        throw new ErrorDatos('servidor', 'Faltan datos del producto.');
      }
      return modificar((e, t) => {
        if (!e.categorias.some((c) => c.id === datos.categoriaId)) throw new ErrorDatos('servidor', 'La categoría no existe.');
        let prod = datos.id ? e.productos.find((p) => p.id === datos.id) : undefined;
        if (datos.id && !prod) throw new ErrorDatos('noEncontrado', 'El producto ya no existe.');
        const campos = {
          nombre: datos.nombre.trim(),
          categoriaId: datos.categoriaId,
          precio: datos.precio,
          descripcion: datos.descripcion.trim(),
          codigo: datos.codigo.trim(),
          visible: datos.visible,
          colores: [...datos.colores],
          talles: [...datos.talles],
          fotos: [...datos.fotos],
          actualizado: t,
        };
        if (prod) Object.assign(prod, campos);
        else {
          prod = { id: nuevoId('p'), creado: t, ...campos };
          e.productos.unshift(prod);
        }
        const id = prod.id;
        // Stock: solo las combinaciones que existen; el resto se descarta.
        e.stock = e.stock.filter((s) => s.productoId !== id);
        for (const { color, talle } of combinaciones(campos.colores, campos.talles)) {
          const dato = datos.stock.find((s) => s.color === color && s.talle === talle);
          e.stock.push({ productoId: id, color, talle, cantidad: Math.max(0, Math.floor(dato?.cantidad ?? 0)) });
        }
        registrar(e, t, 'producto guardado', campos.nombre);
        return armarProducto(e, prod, t);
      });
    },

    async eliminarProducto(id) {
      return modificar((e, t) => {
        const prod = e.productos.find((p) => p.id === id);
        if (!prod) return;
        e.productos = e.productos.filter((p) => p.id !== id);
        e.stock = e.stock.filter((s) => s.productoId !== id);
        registrar(e, t, 'producto eliminado', prod.nombre);
      });
    },

    async subirFoto(archivo) {
      await viaje('escritura');
      return fotos.guardar(archivo);
    },

    async urlFoto(id) {
      if (!id) return '';
      if (esFotoLocal(id)) return fotos.url(id);
      return (op.baseFotos ?? '/') + id;
    },

    alCambiar(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },

    herramientas: {
      getAjustes,
      setAjustes(cambios) {
        almacen.setItem(claveAjustes, JSON.stringify({ ...getAjustes(), ...cambios }));
        avisar();
      },
      async restaurar() {
        escribir(estadoDesdeSemilla(op.semilla, Date.now()));
        await fotos.borrarTodo().catch(() => {});
        avisar();
      },
      adelantarReloj(horas) {
        const e = leer();
        e.desplazamientoReloj += horas * HORA;
        vencer(e, Date.now() + e.desplazamientoReloj);
        escribir(e);
        avisar();
      },
      setHorasReserva(horas) {
        const e = leer();
        e.config.horasReserva = horas;
        escribir(e);
        avisar();
      },
      contarPendientes() {
        return leerAlDia().e.pedidos.filter((p) => p.estado === 'pendiente').length;
      },
    },
  };
  return ds;
}
