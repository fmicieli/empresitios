// Módulo Pedidos: lista con filtros, detalle, confirmar/cancelar con "Deshacer"
// y el caso de un pedido vencido sin stock.

import { useState } from 'preact/hooks';
import { copiarTexto, Dialogo, ErrorCarga, Foto, mensajeDeError, mostrarToast, useCarga } from '../../componentes/basicos';
import { IconoAtras, IconoBuscar, IconoChat, IconoPedidos } from '../../componentes/iconos';
import {
  coincide,
  etiquetaVariante,
  formatoPrecio,
  hace,
  linkWhatsapp,
  nombreCorto,
  primerNombre,
  tiempoRestante,
} from '../../datos/reglas';
import type { DataStore, EstadoPedido, LineaConProblema, Pedido, Producto } from '../../datos/tipos';
import { textos } from '../../textos/textos';
import type { ContextoAdmin, ModuloAdmin } from '../nucleo/tipos';
import { useTic } from '../nucleo/utiles';

const t = textos.admin;
type Filtro = EstadoPedido | 'todas';
const FILTROS: Filtro[] = ['pendiente', 'confirmada', 'cancelada', 'vencida', 'todas'];

const pagoTexto = { transferencia: 'transferencia', efectivo: 'efectivo' } as const;

// ---------- Acciones (confirmar, cancelar, deshacer) ----------

interface DialogoSinStock {
  pedido: Pedido;
  lineas: LineaConProblema[];
}

function useAcciones(ds: DataStore) {
  const [ocupado, setOcupado] = useState<Record<number, 'confirmando' | 'cancelando'>>({});
  const [sinStock, setSinStock] = useState<DialogoSinStock | null>(null);

  const marcar = (n: number, v?: 'confirmando' | 'cancelando') =>
    setOcupado((o) => {
      const c = { ...o };
      if (v) c[n] = v;
      else delete c[n];
      return c;
    });

  async function deshacer(accionId: string) {
    try {
      await ds.deshacer(accionId);
      mostrarToast(t.deshecho);
    } catch (e) {
      mostrarToast(mensajeDeError(e));
    }
  }

  async function confirmar(p: Pedido, forzar = false) {
    if (ocupado[p.numero]) return;
    setSinStock(null);
    marcar(p.numero, 'confirmando');
    try {
      const r = await ds.confirmarPedido(p.numero, { forzar });
      if (!r.ok) setSinStock({ pedido: p, lineas: r.lineas });
      else mostrarToast(t.avisoConfirmado(p.numero), { texto: t.deshacer, fn: () => deshacer(r.accionId) });
    } catch (e) {
      mostrarToast(mensajeDeError(e));
    } finally {
      marcar(p.numero);
    }
  }

  async function cancelar(p: Pedido) {
    if (ocupado[p.numero]) return;
    marcar(p.numero, 'cancelando');
    try {
      const r = await ds.cancelarPedido(p.numero);
      mostrarToast(t.avisoCancelado(p.numero), { texto: t.deshacer, fn: () => deshacer(r.accionId) });
    } catch (e) {
      mostrarToast(mensajeDeError(e));
    } finally {
      marcar(p.numero);
    }
  }

  return { ocupado, confirmar, cancelar, sinStock, cerrarSinStock: () => setSinStock(null) };
}

type Acciones = ReturnType<typeof useAcciones>;

// ---------- Piezas ----------

function EstadoPastilla({ p, ahora }: { p: Pedido; ahora: number }) {
  if (p.estado === 'pendiente') {
    const r = tiempoRestante(p.venceEn, ahora);
    return (
      <span class={`pastilla ${r.urgente ? 'fuerte' : ''}`}>
        {r.urgente && '⚠ '}
        {t.reserva(r.texto)}
      </span>
    );
  }
  return <span class="pastilla">{t.estados[p.estado]}</span>;
}

function BotonesPedido({ p, acc, grandes = false }: { p: Pedido; acc: Acciones; grandes?: boolean }) {
  const oc = acc.ocupado[p.numero];
  const clase = grandes ? 'boton' : 'boton chico';
  if (p.estado === 'cancelada') return null;
  return (
    <div class="pila-chica">
      {p.estado === 'confirmada' ? (
        <button type="button" class={`${clase} secundario`} disabled={!!oc} onClick={() => acc.cancelar(p)}>
          {oc === 'cancelando' ? t.cancelando : t.cancelarConfirmada}
        </button>
      ) : (
        <div class="dos-botones">
          <button type="button" class={`${clase} secundario`} disabled={!!oc} onClick={() => acc.cancelar(p)}>
            {oc === 'cancelando' ? t.cancelando : grandes ? t.cancelarPedido : t.cancelar}
          </button>
          <button type="button" class={clase} disabled={!!oc} onClick={() => acc.confirmar(p)}>
            {oc === 'confirmando' ? t.confirmando : grandes ? t.confirmarVenta : t.confirmar}
          </button>
        </div>
      )}
      {oc && (
        <span class="chico suave" role="status">
          <span class="girando chico" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          {t.puedeTardar}
        </span>
      )}
    </div>
  );
}

function DialogoVencido({ acc }: { acc: Acciones }) {
  const d = acc.sinStock;
  const lista = d
    ? d.lineas.map((l) => {
        const it = d.pedido.items.find((i) => i.productoId === l.productoId && i.color === l.color && i.talle === l.talle);
        const v = etiquetaVariante(l.color, l.talle);
        return (it?.nombreProducto ?? 'Producto') + (v ? ` · ${v}` : '');
      })
    : [];
  return (
    <Dialogo abierto={!!d} alCerrar={acc.cerrarSinStock} titulo={t.vencidoSinStock}>
      {d && (
        <>
          <p>
            <strong>{lista.join(', ')}</strong>
          </p>
          <p>{t.vencidoSinStockTexto}</p>
          <a
            class="boton"
            target="_blank"
            rel="noopener"
            href={linkWhatsapp(
              '549' + d.pedido.comprador.whatsappNormalizado,
              t.mensajeAgotado(primerNombre(d.pedido.comprador.nombre), lista.join(', '), d.pedido.numero),
            )}
          >
            <IconoChat /> {t.avisarle}
          </a>
          <button type="button" class="boton secundario" onClick={() => acc.confirmar(d.pedido, true)}>
            {t.confirmarIgual}
          </button>
          <p class="chico suave">{t.confirmarIgualAyuda}</p>
          <button type="button" class="enlace" onClick={acc.cerrarSinStock}>
            {t.volverSinCambios}
          </button>
        </>
      )}
    </Dialogo>
  );
}

function Detalle({
  p,
  productos,
  ctx,
  acc,
  conVolver,
}: {
  p: Pedido;
  productos: Producto[];
  ctx: ContextoAdmin;
  acc: Acciones;
  conVolver: boolean;
}) {
  const ahora = ctx.ds.ahora();
  const c = p.comprador;
  const fecha = new Date(p.creado).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <article class="pila" aria-labelledby="titulo-pedido">
      <div class="fila" style={{ flexWrap: 'nowrap' }}>
        {conVolver && (
          <a class="boton-icono" href="#/pedidos" aria-label={t.volverPedidos}>
            <IconoAtras />
          </a>
        )}
        <div class="pila-chica" style={{ gap: 0 }}>
          <h1 id="titulo-pedido" tabIndex={-1}>
            {t.pedidoN(p.numero)}
          </h1>
          <span class="suave chico">
            {fecha} · {hace(p.creado, ahora)} · {t.estados[p.estado]}
          </span>
        </div>
      </div>

      {p.estado === 'pendiente' && (
        <div class="panel">
          <strong>{t.reservaDetalle(tiempoRestante(p.venceEn, ahora).texto)}</strong>
          <br />
          <span class="chico">{t.reservaDetalleAyuda}</span>
        </div>
      )}
      {p.estado === 'vencida' && <div class="panel">{t.vencidaDetalle}</div>}

      <section class="pila-chica" aria-label={t.productosDelPedido}>
        <h2 class="suave chico" style={{ fontWeight: 'var(--peso-regular)' }}>
          {t.productosDelPedido}
        </h2>
        {p.items.map((i, n) => {
          const prod = productos.find((x) => x.id === i.productoId);
          const v = etiquetaVariante(i.color, i.talle);
          return (
            <div key={n} class="fila" style={{ flexWrap: 'nowrap' }}>
              <div style={{ width: '56px', flexShrink: 0 }}>
                <Foto ds={ctx.ds} id={prod?.fotos[0]} inicial={i.nombreProducto} clase="cuadrada" />
              </div>
              <div class="pila-chica" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                <strong>{i.nombreProducto}</strong>
                <span class="suave chico">
                  {[v, `× ${i.cantidad}`, i.codigo ? t.codigoCorto(i.codigo) : ''].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span class="precio">{formatoPrecio(i.precioUnitario * i.cantidad)}</span>
            </div>
          );
        })}
        <div class="fila-extremos total" style={{ borderTop: '1px solid var(--linea-suave)', paddingTop: '8px' }}>
          <span>{t.totalSinEnvio}</span>
          <span class="num">{formatoPrecio(p.total)}</span>
        </div>
      </section>

      <section class="pila-chica" aria-label={t.comprador}>
        <h2 class="suave chico" style={{ fontWeight: 'var(--peso-regular)' }}>
          {t.comprador}
        </h2>
        <strong>{c.nombre}</strong>
        <span>{t.whatsappDe(c.whatsapp)}</span>
        <span>{c.entrega === 'envio' ? t.entregaEnvio(c.direccion, c.localidad) : t.entregaRetiro}</span>
        <span>{t.pagaCon(pagoTexto[c.pago])}</span>
        {c.nota && <span class="suave">{t.notaComprador(c.nota)}</span>}
      </section>

      <a
        class="boton secundario"
        target="_blank"
        rel="noopener"
        href={linkWhatsapp('549' + c.whatsappNormalizado, t.mensajeComprador(primerNombre(c.nombre), p.numero))}
      >
        <IconoChat /> {t.abrirChat}
      </a>
      <BotonesPedido p={p} acc={acc} grandes />
    </article>
  );
}

function TarjetaPedido({ p, ahora, acc }: { p: Pedido; ahora: number; acc: Acciones }) {
  return (
    <li class="tarjeta-pedido">
      <div class="fila-extremos">
        <a class="titulo-pedido" href={`#/pedidos/${p.numero}`}>
          #{p.numero} · {nombreCorto(p.comprador.nombre)}
        </a>
        <span class="chico suave">{hace(p.creado, ahora)}</span>
      </div>
      <div class="pila-chica" style={{ gap: '2px' }}>
        {p.items.map((i, n) => {
          const v = etiquetaVariante(i.color, i.talle);
          return (
            <span key={n}>
              {i.nombreProducto}
              {v && ` · ${v}`} × {i.cantidad}
            </span>
          );
        })}
      </div>
      <div class="fila-extremos">
        <span class="precio">{formatoPrecio(p.total)}</span>
        <EstadoPastilla p={p} ahora={ahora} />
      </div>
      {p.estado === 'pendiente' ? (
        <BotonesPedido p={p} acc={acc} />
      ) : (
        <a class="boton secundario chico" href={`#/pedidos/${p.numero}`}>
          {t.verDetalle}
        </a>
      )}
    </li>
  );
}

function TablaPedidos({ lista, ahora, acc, elegido }: { lista: Pedido[]; ahora: number; acc: Acciones; elegido?: number }) {
  return (
    <div class="tabla-desplazable">
      <table class="tabla">
        <thead>
          <tr>
            <th scope="col">{t.tablaNumero}</th>
            <th scope="col">{t.tablaComprador}</th>
            <th scope="col">{t.tablaProductos}</th>
            <th scope="col">{t.tablaTotal}</th>
            <th scope="col">{t.tablaEstado}</th>
            <th scope="col">{t.tablaAccion}</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr
              key={p.numero}
              class="fila-clic"
              aria-selected={p.numero === elegido}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('a,button')) location.hash = `#/pedidos/${p.numero}`;
              }}
            >
              <td class="nowrap">
                <a class="enlace-fila" href={`#/pedidos/${p.numero}`}>
                  #{p.numero}
                </a>
              </td>
              <td>
                {nombreCorto(p.comprador.nombre)}
                <br />
                <span class="chico suave">{hace(p.creado, ahora)}</span>
              </td>
              <td class="chico">{p.items.map((i) => `${i.nombreProducto} × ${i.cantidad}`).join(', ')}</td>
              <td class="precio nowrap">{formatoPrecio(p.total)}</td>
              <td>
                <EstadoPastilla p={p} ahora={ahora} />
              </td>
              <td style={{ minWidth: '200px' }}>
                {p.estado === 'pendiente' ? (
                  <BotonesPedido p={p} acc={acc} />
                ) : (
                  <a class="enlace" href={`#/pedidos/${p.numero}`}>
                    {t.verDetalle}
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pantalla({ ruta, ctx }: { ruta: string[]; ctx: ContextoAdmin }) {
  useTic();
  const { ds } = ctx;
  const datos = useCarga(() => Promise.all([ds.getPedidos(), ds.getProductos({ incluirOcultos: true })]), [], ds);
  const [pedidos, productos] = datos.datos ?? [undefined, undefined];
  const [filtro, setFiltro] = useState<Filtro>('pendiente');
  const [busqueda, setBusqueda] = useState('');
  const acc = useAcciones(ds);
  const ahora = ds.ahora();
  const numero = ruta[0] ? parseInt(ruta[0], 10) : undefined;
  const elegido = numero !== undefined ? pedidos?.find((p) => p.numero === numero) : undefined;

  if (datos.cargando && !pedidos) {
    return (
      <div class="pila" aria-busy="true" aria-label={textos.general.cargando}>
        <div class="esqueleto" style={{ height: '32px', width: '40%' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} class="esqueleto" style={{ height: '140px' }} />
        ))}
      </div>
    );
  }
  if (datos.error && !pedidos) return <ErrorCarga error={datos.error} alReintentar={datos.recargar} />;
  if (!pedidos || !productos) return null;

  // Celular: el detalle ocupa toda la pantalla.
  if (!ctx.esEscritorio && numero !== undefined) {
    return (
      <>
        {elegido ? (
          <Detalle p={elegido} productos={productos} ctx={ctx} acc={acc} conVolver />
        ) : (
          <div class="pila">
            <p>{textos.general.errores.noEncontrado}</p>
            <a class="boton secundario" href="#/pedidos">
              {t.volverPedidos}
            </a>
          </div>
        )}
        <DialogoVencido acc={acc} />
      </>
    );
  }

  const cuenta = (e: EstadoPedido) => pedidos.filter((p) => p.estado === e).length;
  const q = busqueda.trim();
  let lista = q
    ? pedidos.filter((p) => String(p.numero).includes(q.replace('#', '')) || coincide(p.comprador.nombre, q))
    : filtro === 'todas'
      ? pedidos
      : pedidos.filter((p) => p.estado === filtro);
  // Pendientes arriba; dentro de cada grupo, los más nuevos primero.
  lista = [...lista].sort((a, b) => Number(b.estado === 'pendiente') - Number(a.estado === 'pendiente') || b.creado - a.creado);

  const urlTienda = ctx.config.urlTienda || location.origin + '/';
  const vacio =
    !q && filtro === 'pendiente' ? (
      <div class="panel pila centrado" style={{ padding: '32px 16px' }}>
        <h2>{t.alDia}</h2>
        <p>{t.alDiaTexto}</p>
        <button
          type="button"
          class="boton secundario chico"
          onClick={async () => mostrarToast((await copiarTexto(urlTienda)) ? t.linkCopiado : urlTienda)}
        >
          {t.copiarLink}
        </button>
      </div>
    ) : (
      <p class="suave">{q ? t.sinPedidosBusqueda : t.sinPedidosEstado}</p>
    );

  const encabezado = (
    <>
      <h1>{t.pedidos}</h1>
      <div class="buscador" role="search">
        <IconoBuscar />
        <label class="sr" for="buscar-pedido">
          {t.buscarPedido}
        </label>
        <input
          id="buscar-pedido"
          type="search"
          placeholder={t.buscarPedido}
          value={busqueda}
          autocomplete="off"
          onInput={(e) => setBusqueda((e.target as HTMLInputElement).value)}
        />
      </div>
      {!q && (
        <div class="chips" role="group" aria-label="Filtrar pedidos">
          {FILTROS.map((f) => (
            <button key={f} type="button" class="chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
              {t.filtros[f]}
              {f !== 'todas' && <span class="num"> · {cuenta(f)}</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (ctx.esEscritorio) {
    return (
      <div class="pedidos-escritorio">
        <div class="pila">
          {encabezado}
          {lista.length ? <TablaPedidos lista={lista} ahora={ahora} acc={acc} elegido={numero} /> : vacio}
        </div>
        <aside class="panel-lateral" aria-label="Detalle del pedido">
          {elegido ? (
            <Detalle p={elegido} productos={productos} ctx={ctx} acc={acc} conVolver={false} />
          ) : (
            <p class="suave">{t.elegiPedido}</p>
          )}
        </aside>
        <DialogoVencido acc={acc} />
      </div>
    );
  }

  return (
    <div class="pila">
      {encabezado}
      {lista.length ? (
        <ul class="tarjetas">
          {lista.map((p) => (
            <TarjetaPedido key={p.numero} p={p} ahora={ahora} acc={acc} />
          ))}
        </ul>
      ) : (
        vacio
      )}
      <DialogoVencido acc={acc} />
    </div>
  );
}

export const moduloPedidos: ModuloAdmin = {
  id: 'pedidos',
  titulo: t.pedidos,
  Icono: IconoPedidos,
  contador: async (ds) => (await ds.getPedidos({ estado: 'pendiente' })).length,
  Pantalla,
};
