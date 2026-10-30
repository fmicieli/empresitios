// Ficha de producto: galería, color, talle, cantidad y "Agregar al carrito".

import { useEffect, useRef, useState } from 'preact/hooks';
import { useCarrito } from '@compartido/carrito/carrito';
import { Cantidad, copiarTexto, ErrorCarga, Foto, mostrarToast, useCarga } from '@compartido/componentes/basicos';
import { IconoAtras, IconoChat, IconoCompartir, IconoSiguiente } from '@compartido/componentes/iconos';
import { etiquetaVariante, formatoPrecio, linkProducto, lugarEnPedido, variante, rutaCategoria } from '@compartido/datos/reglas';
import type { ConfigServidor, FilaCategoria, Producto } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { carrito, config, ds } from '../lib/contexto';
import { BarraCarrito, linkCategoria, Marco, Migas } from './Marco';
import { EnlaceWhatsapp } from './EnlaceWhatsapp';

const t = textos.tienda;

function Galeria({ p }: { p: Producto }) {
  const ref = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const total = Math.max(1, p.fotos.length);

  function alDeslizar() {
    const el = ref.current;
    if (el) setActual(Math.round(el.scrollLeft / el.clientWidth));
  }
  function ir(i: number) {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setActual(i);
  }

  return (
    <div class="pila-chica">
      <div class="galeria-marco">
        <div
          class="galeria"
          ref={ref}
          onScroll={alDeslizar}
          tabIndex={p.fotos.length > 1 ? 0 : -1}
          aria-label={`Fotos de ${p.nombre}`}
        >
          {(p.fotos.length ? p.fotos : ['']).map((id, i) => (
            <Foto key={id + i} ds={ds} id={id} inicial={p.nombre} alt={t.fotoDe(p.nombre, i + 1, total)} />
          ))}
        </div>
        {/* Flechas sobre la foto (D-28): se ve que hay más fotos sin tener que bajar hasta las miniaturas. */}
        {p.fotos.length > 1 && (
          <>
            <button
              type="button"
              class="galeria-flecha anterior"
              aria-label={t.fotoAnterior}
              hidden={actual === 0}
              onClick={() => ir(actual - 1)}
            >
              <IconoAtras />
            </button>
            <button
              type="button"
              class="galeria-flecha siguiente"
              aria-label={t.fotoSiguiente}
              hidden={actual >= total - 1}
              onClick={() => ir(actual + 1)}
            >
              <IconoSiguiente />
            </button>
          </>
        )}
      </div>
      {p.fotos.length > 1 && (
        <>
          <div class="galeria-puntos" aria-hidden="true">
            {p.fotos.map((_, i) => (
              <span key={i} data-activo={i === actual} />
            ))}
          </div>
          <div class="miniaturas">
            {p.fotos.map((id, i) => (
              <button
                key={id}
                type="button"
                class="miniatura"
                aria-label={t.verFoto(i + 1)}
                aria-current={i === actual}
                onClick={() => ir(i)}
              >
                <Foto ds={ds} id={id} inicial={p.nombre} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Breadcrumb de la ficha: Inicio / Categoría / Subcategoría. */
function MigasFicha({ p, filas }: { p: Producto; filas: FilaCategoria[] }) {
  const fila = filas.find((f) => f.id === p.categoriaId);
  if (!fila) return null;
  // Inicio / Mujer / Indumentaria / Remeras / Producto (con 2 o 3 niveles según la tienda).
  const ruta = rutaCategoria(fila);
  const pasos = [
    { texto: t.inicio, link: '/' },
    ...ruta.map((texto, i) => ({
      texto,
      link:
        i === 0
          ? linkCategoria(fila.categoria)
          : i === ruta.length - 1
            ? linkCategoria(fila.categoria, fila.id)
            : linkCategoria(fila.categoria, undefined, texto),
    })),
    { texto: p.nombre },
  ];
  return <Migas pasos={pasos} />;
}

/** Link del producto para compartir (sin otros datos en la dirección). */
function linkFicha(p: Producto): string {
  return linkProducto(config.url || location.origin, p.id);
}

/** En el celular abre el menú de compartir del teléfono; si no hay, copia el link. */
async function compartir(p: Producto) {
  const url = linkFicha(p);
  if (navigator.share) {
    try {
      await navigator.share({ title: p.nombre, url });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return; // La persona cerró el menú.
    }
  }
  mostrarToast((await copiarTexto(url)) ? t.linkProductoCopiado : url);
}

function Detalle({ p, filas, cfg }: { p: Producto; filas: FilaCategoria[]; cfg: ConfigServidor }) {
  const items = useCarrito(carrito);
  const libreDe = (c: string, s: string) => variante(p, c, s)?.libre ?? 0;

  const [color, setColor] = useState(() =>
    p.colores.length ? (p.colores.find((c) => p.variantes.some((v) => v.color === c && v.libre > 0)) ?? p.colores[0]) : '',
  );
  // El talle no se elige solo (salvo que haya uno): así nadie compra un talle por error.
  const [talle, setTalle] = useState(() => (p.talles.length === 1 && libreDe(color, p.talles[0]) > 0 ? p.talles[0] : ''));
  const [cant, setCant] = useState(1);

  const falta = p.talles.length > 0 && !talle;
  const libre = falta ? null : libreDe(color, talle);
  const enCarrito = items
    .filter((i) => i.productoId === p.id && i.color === color && i.talle === talle)
    .reduce((a, i) => a + i.cantidad, 0);
  const porStock = libre === null ? 0 : Math.max(0, libre - enCarrito);
  // Topes contra pedidos falsos (D-16): el "+" se deshabilita al llegar al máximo por pedido.
  const porTope = lugarEnPedido(items, p.id, cfg);
  const maximo = Math.min(porStock, porTope);
  const llegoAlTope = libre !== null && porTope < porStock && cant >= maximo;

  useEffect(() => {
    if (cant > Math.max(1, maximo)) setCant(Math.max(1, maximo));
  }, [maximo]);

  function elegirColor(c: string) {
    setColor(c);
    if (talle && libreDe(c, talle) <= 0) setTalle('');
    setCant(1);
  }

  function agregar() {
    carrito.agregar({ productoId: p.id, color, talle, cantidad: cant });
    mostrarToast(t.agregado(p.nombre, etiquetaVariante(color, talle)));
    setCant(1);
  }

  return (
    <div class="ficha">
      <Galeria p={p} />
      <div class="pila">
        <div class="pila-chica">
          <MigasFicha p={p} filas={filas} />
          <h1 class="titulo-ficha">{p.nombre}</h1>
          <div class="fila-extremos">
            <span class="precio precio-grande">{formatoPrecio(p.precio)}</span>
            <button type="button" class="enlace" aria-label={t.compartirProducto(p.nombre)} onClick={() => compartir(p)}>
              <IconoCompartir /> {t.compartir}
            </button>
          </div>
        </div>

        {p.colores.length > 0 && (
          <fieldset>
            <legend>{t.color(color)}</legend>
            <div class="chips envolver">
              {p.colores.map((c) => (
                <button key={c} type="button" class="chip" aria-pressed={color === c} onClick={() => elegirColor(c)}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {p.talles.length > 0 && (
          <fieldset>
            <legend>{t.talle}</legend>
            <div class="talles">
              {p.talles.map((s) => {
                const sin = libreDe(color, s) <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    class="talle"
                    aria-pressed={talle === s}
                    disabled={sin}
                    aria-label={sin ? `${s}, ${t.sinStock.toLowerCase()}` : undefined}
                    onClick={() => {
                      setTalle(s);
                      setCant(1);
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div role="status" class="pila-chica">
          {libre === null ? (
            <span class="suave">{t.elegiTalle}</span>
          ) : libre <= 0 ? (
            <span class="negrita">{t.sinStockOpcion}</span>
          ) : libre <= 2 ? (
            <span class="negrita num">
              {libre === 1 && config.piezasUnicas && !p.colores.length && !p.talles.length ? t.piezaUnica : t.pocas(libre, talle)}
            </span>
          ) : null}
          {enCarrito > 0 && <span class="suave chico num">{t.yaEnCarrito(enCarrito)}</span>}
          {llegoAlTope && <span class="suave chico">{t.topeUnidades}</span>}
        </div>

        <div class="fila" style={{ flexWrap: 'nowrap' }}>
          <Cantidad valor={cant} max={Math.max(1, maximo)} alCambiar={setCant} />
          <button type="button" class="boton" style={{ flex: 1 }} disabled={maximo <= 0} onClick={agregar}>
            {t.agregar}
          </button>
        </div>

        {p.descripcion && (
          <div class="pila-chica">
            <h2 class="titulo-chico">{t.descripcion}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{p.descripcion}</p>
          </div>
        )}

        <EnlaceWhatsapp class="enlace" texto={t.consultaMensaje(p.nombre, linkFicha(p))}>
          <IconoChat /> {t.consultaTalle}
        </EnlaceWhatsapp>
      </div>
    </div>
  );
}

export default function Ficha() {
  const id = new URLSearchParams(location.search).get('id') ?? '';
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getCategorias(), ds.getConfig()]), [id], ds);
  const [productos, filas, cfg] = datos.datos ?? [undefined, undefined, undefined];
  const p = productos?.find((x) => x.id === id);

  useEffect(() => {
    if (p) document.title = `${p.nombre} · ${document.title.split(' · ').pop()}`;
  }, [p?.nombre]);

  return (
    <Marco conBarraAbajo>
      {datos.cargando && !productos ? (
        <div class="ficha" aria-busy="true" aria-label={textos.general.cargando}>
          <div class="foto esqueleto" />
          <div class="pila">
            <div class="esqueleto" style={{ height: '32px', width: '70%' }} />
            <div class="esqueleto" style={{ height: '24px', width: '30%' }} />
            <div class="esqueleto" style={{ height: '52px' }} />
          </div>
        </div>
      ) : datos.error && !productos ? (
        <div>
          <ErrorCarga error={datos.error} alReintentar={datos.recargar} />
        </div>
      ) : !p || !filas || !cfg ? (
        <div class="pila">
          <h1>{t.productoNoEncontrado}</h1>
          <a class="boton secundario" href="/">
            {t.verProductos}
          </a>
        </div>
      ) : (
        <Detalle key={p.id} p={p} filas={filas} cfg={cfg!} />
      )}
      <BarraCarrito productos={productos} />
    </Marco>
  );
}
