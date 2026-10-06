// Marco de todas las pantallas de la tienda: encabezado, menú y avisos.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { unidades, useCarrito } from '@compartido/carrito/carrito';
import { useCarga, ZonaToast } from '@compartido/componentes/basicos';
import { IconoBolsa, IconoBuscar, IconoCerrar, IconoChat, IconoFlecha, IconoMenu } from '@compartido/componentes/iconos';
import { agruparCategorias, evaluarCarrito, formatoPrecio, linkWhatsapp } from '@compartido/datos/reglas';
import type { Categoria, Producto } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { carrito, config, ds, whatsappTienda } from '../lib/contexto';

const t = textos.tienda;

export function linkCategoria(cat: string, subId?: string): string {
  const q = new URLSearchParams({ cat });
  if (subId) q.set('sub', subId);
  return `/?${q}`;
}

function Logo() {
  return (
    <a class="logo" href="/">
      {config.estilo.logo ? <img src={config.estilo.logo} alt={config.nombre} /> : config.nombre}
    </a>
  );
}

function MenuEscritorio({ categorias }: { categorias: Categoria[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const cerrar = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(null);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(null);
    document.addEventListener('click', cerrar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('click', cerrar);
      document.removeEventListener('keydown', tecla);
    };
  }, []);
  return (
    <nav aria-label="Categorías" style={{ flex: 1 }}>
      <ul class="menu-escritorio" ref={ref}>
        {categorias.map((c) =>
          c.subcategorias.length ? (
            <li key={c.nombre}>
              <button
                type="button"
                class="item-menu"
                aria-expanded={abierto === c.nombre}
                onClick={() => setAbierto(abierto === c.nombre ? null : c.nombre)}
              >
                {c.nombre} <IconoFlecha abierto={abierto === c.nombre} />
              </button>
              {abierto === c.nombre && (
                <ul class="desplegable">
                  <li><a href={linkCategoria(c.nombre)}>{t.todoDe(c.nombre)}</a></li>
                  {c.subcategorias.map((s) => (
                    <li key={s.id}><a href={linkCategoria(c.nombre, s.id)}>{s.nombre}</a></li>
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <li key={c.nombre}>
              <a class="item-menu" href={linkCategoria(c.nombre)}>{c.nombre}</a>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function MenuLateral({ abierto, alCerrar, categorias }: { abierto: boolean; alCerrar: () => void; categorias: Categoria[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [desplegada, setDesplegada] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      class="menu-lateral"
      aria-label="Menú"
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && alCerrar()}
    >
      <div class="menu-lateral-interior">
        <div class="fila-extremos">
          <strong>{config.nombre}</strong>
          <button type="button" class="boton-icono" aria-label={t.cerrarMenu} onClick={alCerrar}>
            <IconoCerrar />
          </button>
        </div>
        <nav aria-label="Categorías">
          <ul class="lista-menu">
            <li><a href="/">{t.todo}</a></li>
            {categorias.map((c) =>
              c.subcategorias.length ? (
                <li key={c.nombre}>
                  <button
                    type="button"
                    aria-expanded={desplegada === c.nombre}
                    onClick={() => setDesplegada(desplegada === c.nombre ? null : c.nombre)}
                  >
                    {c.nombre} <IconoFlecha abierto={desplegada === c.nombre} />
                  </button>
                  {desplegada === c.nombre && (
                    <ul>
                      <li><a href={linkCategoria(c.nombre)}>{t.todoDe(c.nombre)}</a></li>
                      {c.subcategorias.map((s) => (
                        <li key={s.id}><a href={linkCategoria(c.nombre, s.id)}>{s.nombre}</a></li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={c.nombre}><a href={linkCategoria(c.nombre)}>{c.nombre}</a></li>
              ),
            )}
          </ul>
        </nav>
        <a class="boton secundario" href={linkWhatsapp(whatsappTienda())} target="_blank" rel="noopener">
          <IconoChat /> {t.menuConsultas}
        </a>
        {config.horarios && (
          <div class="pila-chica">
            <strong>{t.menuHorarios}</strong>
            <span>{config.horarios}</span>
            {config.direccionLocal && <span class="suave">{config.direccionLocal}</span>}
          </div>
        )}
        {config.redes.length > 0 && (
          <div class="pila-chica">
            <strong>{t.menuRedes}</strong>
            <div class="fila">
              {config.redes.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener" class="enlace">{r.nombre}</a>
              ))}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

/** Barra fija abajo: "Ver carrito · 2 · $ 42.000". */
export function BarraCarrito({ productos }: { productos: Producto[] | undefined }) {
  const items = useCarrito(carrito);
  if (!items.length) return null;
  const total = productos ? evaluarCarrito(items, productos).reduce((a, l) => a + l.subtotal, 0) : null;
  return (
    <div class="barra-carrito">
      <a class="boton" href="/carrito/">
        <span>{t.barraCarrito(unidades(items))}</span>
        {total !== null && <span class="num">{formatoPrecio(total)}</span>}
      </a>
    </div>
  );
}

export function Marco({
  children,
  buscadorEnEncabezado = true,
  conBarraAbajo = false,
}: {
  children: ComponentChildren;
  buscadorEnEncabezado?: boolean;
  conBarraAbajo?: boolean;
}) {
  const items = useCarrito(carrito);
  const n = unidades(items);
  const [menu, setMenu] = useState(false);
  const cats = useCarga(() => ds.getCategorias(), []);
  const categorias = cats.datos ? agruparCategorias(cats.datos) : [];

  return (
    <div class={conBarraAbajo && n > 0 ? 'con-barra-abajo' : ''}>
      <header class="encabezado">
        <div class="encabezado-interior">
          <button type="button" class="boton-icono boton-menu" aria-label={t.abrirMenu} aria-haspopup="dialog" onClick={() => setMenu(true)}>
            <IconoMenu />
          </button>
          <Logo />
          <MenuEscritorio categorias={categorias} />
          {buscadorEnEncabezado && (
            <form class="buscador buscador-encabezado" action="/" method="get" role="search">
              <IconoBuscar />
              <label class="sr" for="buscar-encabezado">{t.buscar}</label>
              <input id="buscar-encabezado" type="search" name="q" placeholder={t.buscar} autocomplete="off" />
            </form>
          )}
          <a class="boton-icono" href="/carrito/" aria-label={t.carrito(n)}>
            <IconoBolsa />
            {n > 0 && <span class="contador num" aria-hidden="true">{n}</span>}
          </a>
        </div>
      </header>
      <MenuLateral abierto={menu} alCerrar={() => setMenu(false)} categorias={categorias} />
      <main class="contenedor" id="contenido">
        {children}
      </main>
      <ZonaToast />
    </div>
  );
}
