// Módulo Productos: lista con buscador, ajuste rápido de stock y formulario.

import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { ErrorCarga, Foto, useCarga } from '../../componentes/basicos';
import { IconoBuscar, IconoFlecha, IconoProductos } from '../../componentes/iconos';
import { agruparCategorias, coincide, formatoPrecio, nombreCategoria, stockTotal } from '../../datos/reglas';
import type { FilaCategoria, Pedido, Producto } from '../../datos/tipos';
import { textos } from '../../textos/textos';
import type { ContextoAdmin, ModuloAdmin } from '../nucleo/tipos';
import { AjusteRapido } from './AjusteRapido';
import { FormularioProducto } from './FormularioProducto';

const t = textos.admin;

function Etiquetas({ p }: { p: Producto }) {
  const total = stockTotal(p);
  return (
    <>
      {total === 0 && <span class="pastilla fuerte">{textos.tienda.sinStock}</span>}
      {!p.visible && <span class="pastilla">{t.oculto}</span>}
    </>
  );
}

function FilaCelular({
  p,
  ctx,
  abierto,
  alAbrir,
  alCerrar,
  pendientes,
}: {
  p: Producto;
  ctx: ContextoAdmin;
  abierto: boolean;
  alAbrir: () => void;
  alCerrar: () => void;
  pendientes: Pedido[];
}) {
  const total = stockTotal(p);
  return (
    <li class="fila-producto" data-producto={p.id}>
      <button
        type="button"
        class="cabeza-producto"
        aria-expanded={abierto}
        aria-label={`${p.nombre}. ${t.abrirAjuste(p.nombre)}`}
        onClick={alAbrir}
      >
        <Foto ds={ctx.ds} id={p.fotos[0]} inicial={p.nombre} clase="cuadrada" />
        <span class="pila-chica" style={{ gap: '2px', flex: 1, minWidth: 0 }}>
          <strong>{p.nombre}</strong>
          <span class="suave chico num">
            {formatoPrecio(p.precio)}
            {total > 0 && ` · ${t.stockN(total)}`}
          </span>
          <span class="fila" style={{ gap: '6px' }}>
            <Etiquetas p={p} />
          </span>
        </span>
        <IconoFlecha abierto={abierto} />
      </button>
      {abierto && <AjusteRapido ds={ctx.ds} producto={p} pendientes={pendientes} alCerrar={alCerrar} />}
    </li>
  );
}

function TablaEscritorio({
  lista,
  filas,
  ctx,
  abierto,
  setAbierto,
  pendientes,
}: {
  lista: Producto[];
  filas: FilaCategoria[];
  ctx: ContextoAdmin;
  abierto: string | null;
  setAbierto: (id: string | null) => void;
  pendientes: Pedido[];
}) {
  return (
    <table class="tabla">
      <thead>
        <tr>
          <th scope="col">{t.tablaProducto}</th>
          <th scope="col">{t.tablaCategoria}</th>
          <th scope="col">{t.tablaPrecio}</th>
          <th scope="col">{t.tablaStock}</th>
          <th scope="col">{t.tablaVisible}</th>
          <th scope="col">{t.tablaAccion}</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((p) => (
          <Fragment key={p.id}>
            <tr aria-selected={abierto === p.id} data-producto={p.id}>
              <td>
                <div class="fila" style={{ flexWrap: 'nowrap' }}>
                  <div style={{ width: '44px', flexShrink: 0 }}>
                    <Foto ds={ctx.ds} id={p.fotos[0]} inicial={p.nombre} clase="cuadrada" />
                  </div>
                  <span class="pila-chica" style={{ gap: 0 }}>
                    <strong>{p.nombre}</strong>
                    {p.codigo && <span class="chico suave">{t.codigoCorto(p.codigo)}</span>}
                  </span>
                </div>
              </td>
              <td class="chico">{nombreCategoria(filas, p.categoriaId)}</td>
              <td class="precio">{formatoPrecio(p.precio)}</td>
              <td class="num">{stockTotal(p) || <span class="pastilla fuerte">{textos.tienda.sinStock}</span>}</td>
              <td>{p.visible ? t.visibleSi : <span class="pastilla">{t.oculto}</span>}</td>
              <td>
                <div class="fila" style={{ gap: '4px 12px' }}>
                  <button
                    type="button"
                    class="enlace"
                    aria-expanded={abierto === p.id}
                    onClick={() => setAbierto(abierto === p.id ? null : p.id)}
                  >
                    {t.tablaStock} <IconoFlecha abierto={abierto === p.id} />
                  </button>
                  <a class="enlace" href={`#/productos/${encodeURIComponent(p.id)}`}>
                    {t.editarProducto}
                  </a>
                </div>
              </td>
            </tr>
            {abierto === p.id && (
              <tr data-producto={p.id}>
                <td colSpan={6} style={{ background: 'var(--superficie)' }}>
                  <div
                    style={{ maxWidth: '520px', background: 'var(--fondo)', borderRadius: 'var(--radio)', paddingTop: '12px' }}
                  >
                    <AjusteRapido ds={ctx.ds} producto={p} pendientes={pendientes} alCerrar={() => setAbierto(null)} />
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function Lista({ ctx }: { ctx: ContextoAdmin }) {
  const { ds } = ctx;
  const datos = useCarga(
    () => Promise.all([ds.getProductos({ incluirOcultos: true }), ds.getCategorias(), ds.getPedidos({ estado: 'pendiente' })]),
    [],
    ds,
  );
  const [productos, filas, pendientes] = datos.datos ?? [undefined, undefined, undefined];
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);

  if (datos.cargando && !productos) {
    return (
      <div class="pila" aria-busy="true" aria-label={textos.general.cargando}>
        <div class="esqueleto" style={{ height: '32px', width: '40%' }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} class="esqueleto" style={{ height: '80px' }} />
        ))}
      </div>
    );
  }
  if (datos.error && !productos) return <ErrorCarga error={datos.error} alReintentar={datos.recargar} />;
  if (!productos || !filas || !pendientes) return null;

  const q = busqueda.trim();
  const lista = productos.filter(
    (p) =>
      (!q || coincide(p.nombre, q) || (p.codigo && coincide(p.codigo, q))) &&
      (!categoria || p.categoriaId === categoria || filas.find((f) => f.id === p.categoriaId)?.categoria === categoria),
  );

  return (
    <div class="pila">
      <div class="fila-extremos">
        <h1>{t.productos}</h1>
        <a class="boton chico" href="#/productos/nuevo">
          {t.agregar}
        </a>
      </div>
      <div class={ctx.esEscritorio ? 'fila' : 'pila'} style={{ flexWrap: 'nowrap' }}>
        <div class="buscador" role="search" style={{ flex: 1 }}>
          <IconoBuscar />
          <label class="sr" for="buscar-producto">
            {t.buscarProducto}
          </label>
          <input
            id="buscar-producto"
            type="search"
            placeholder={t.buscarProducto}
            value={busqueda}
            autocomplete="off"
            onInput={(e) => setBusqueda((e.target as HTMLInputElement).value)}
          />
        </div>
        {ctx.esEscritorio && (
          <div class="campo" style={{ width: '260px' }}>
            <label class="sr" for="filtro-categoria">
              {t.filtrarCategoria}
            </label>
            <select
              id="filtro-categoria"
              class="entrada"
              value={categoria}
              onChange={(e) => setCategoria((e.target as HTMLSelectElement).value)}
            >
              <option value="">{t.todasCategorias}</option>
              {agruparCategorias(filas).map((c) =>
                c.subcategorias.length ? (
                  <optgroup key={c.nombre} label={c.nombre}>
                    <option value={c.nombre}>{textos.tienda.todoDe(c.nombre)}</option>
                    {c.subcategorias.map((s) => (
                      <option key={s.id} value={s.id}>
                        {c.nombre} › {s.nombre}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={c.nombre} value={c.id ?? ''}>
                    {c.nombre}
                  </option>
                ),
              )}
            </select>
          </div>
        )}
      </div>
      <div class="aviso">
        <strong>{t.avisoStock}</strong> {t.avisoStockAyuda}
      </div>
      {!lista.length ? (
        <p class="suave">{t.sinProductos}</p>
      ) : ctx.esEscritorio ? (
        <TablaEscritorio
          lista={lista}
          filas={filas}
          ctx={ctx}
          abierto={abierto}
          setAbierto={setAbierto}
          pendientes={pendientes}
        />
      ) : (
        <ul class="lista-productos">
          {lista.map((p) => (
            <FilaCelular
              key={p.id}
              p={p}
              ctx={ctx}
              abierto={abierto === p.id}
              alAbrir={() => setAbierto(abierto === p.id ? null : p.id)}
              alCerrar={() => setAbierto(null)}
              pendientes={pendientes}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Pantalla({ ruta, ctx }: { ruta: string[]; ctx: ContextoAdmin }) {
  if (ruta[0]) return <FormularioProducto key={ruta[0]} id={ruta[0] === 'nuevo' ? null : ruta[0]} ctx={ctx} />;
  return <Lista ctx={ctx} />;
}

export const moduloProductos: ModuloAdmin = {
  id: 'productos',
  titulo: t.productos,
  Icono: IconoProductos,
  Pantalla,
};
