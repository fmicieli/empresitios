// Catálogo. Según la dirección muestra:
//   /                 inicio: banner y una fila de destacados por categoría principal
//   /?cat=Mujer       una categoría (y ?sub= para una subcategoría): breadcrumb, título y productos
//   /?q=remera        resultados de búsqueda (el buscador está en el encabezado)

import { useCarrito } from '@compartido/carrito/carrito';
import { ErrorCarga, Foto, mostrarToast, useCarga } from '@compartido/componentes/basicos';
import { IconoChat, IconoDerecha } from '@compartido/componentes/iconos';
import {
  agruparCategorias,
  categoriaPrincipal,
  coincide,
  destacadosPorCategoria,
  etiquetaVariante,
  formatoPrecio,
  grupoCategoria,
  libreTotal,
  lugarEnPedido,
  resaltar,
  rutaCategoria,
} from '@compartido/datos/reglas';
import type { ConfigServidor, Producto } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { carrito, config, ds } from '../lib/contexto';
import { EnlaceWhatsapp } from './EnlaceWhatsapp';
import { BarraCarrito, linkCategoria, Marco, Migas } from './Marco';

const t = textos.tienda;

function leerUrl() {
  const q = new URLSearchParams(location.search);
  return {
    cat: q.get('cat') ?? '',
    grupo: q.get('grupo') ?? '',
    sub: q.get('sub') ?? '',
    busqueda: (q.get('q') ?? '').trim(),
  };
}

/**
 * Botón de la tarjeta (14/10, Flor): si el producto tiene una sola opción, lo agrega directo al carrito;
 * si hay que elegir talle o color, lleva a la ficha.
 */
function BotonTarjeta({ p, cfg }: { p: Producto; cfg: ConfigServidor | undefined }) {
  const items = useCarrito(carrito);
  if (libreTotal(p) === 0) {
    return (
      <button type="button" class="boton secundario chico ancho" disabled>
        {t.sinStock}
      </button>
    );
  }
  if (p.variantes.length > 1) {
    const texto =
      p.talles.length > 1 && p.colores.length > 1 ? t.elegirColorYTalle : p.talles.length > 1 ? t.elegirTalle : t.elegirColor;
    return (
      <a
        class="boton secundario chico ancho"
        href={`/producto/?id=${encodeURIComponent(p.id)}`}
        aria-label={`${texto}: ${p.nombre}`}
      >
        {texto}
      </a>
    );
  }
  const v = p.variantes[0];
  const enCarrito = items.filter((i) => i.productoId === p.id).reduce((a, i) => a + i.cantidad, 0);
  const maximo = Math.min(Math.max(0, v.libre - enCarrito), cfg ? lugarEnPedido(items, p.id, cfg) : 0);
  return (
    <button
      type="button"
      class="boton secundario chico ancho"
      disabled={maximo <= 0}
      aria-label={`${t.agregar}: ${p.nombre}`}
      onClick={() => {
        carrito.agregar({ productoId: p.id, color: v.color, talle: v.talle, cantidad: 1 });
        mostrarToast(t.agregado(p.nombre, etiquetaVariante(v.color, v.talle)));
      }}
    >
      {t.agregar}
    </button>
  );
}

function TarjetaProducto({ p, cfg, busqueda = '' }: { p: Producto; cfg: ConfigServidor | undefined; busqueda?: string }) {
  const agotado = libreTotal(p) === 0;
  return (
    <div class={`tarjeta ${agotado ? 'agotada' : ''}`}>
      <a class="tarjeta-link" href={`/producto/?id=${encodeURIComponent(p.id)}`}>
        <Foto ds={ds} id={p.fotos[0]} inicial={p.nombre}>
          {agotado && <span class="etiqueta-foto">{t.sinStock}</span>}
        </Foto>
        <span class="tarjeta-nombre">
          {resaltar(p.nombre, busqueda).map((tr, i) => (tr.resaltado ? <mark key={i}>{tr.texto}</mark> : tr.texto))}
        </span>
        <span class="precio">{formatoPrecio(p.precio)}</span>
        {agotado && <span class="sr">, {t.sinStock}</span>}
      </a>
      <BotonTarjeta p={p} cfg={cfg} />
    </div>
  );
}

function Grilla({ lista, cfg, busqueda }: { lista: Producto[]; cfg: ConfigServidor | undefined; busqueda?: string }) {
  return (
    <ul class="grilla" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {lista.map((p) => (
        <li key={p.id}>
          <TarjetaProducto p={p} cfg={cfg} busqueda={busqueda} />
        </li>
      ))}
    </ul>
  );
}

function Banner() {
  const b = config.inicio.banner;
  if (!b.titulo && !b.imagen) return null;
  return (
    <section class={`banner ${b.imagen ? '' : 'sin-imagen'}`} aria-labelledby="titulo-banner">
      {b.imagen && <img class="banner-imagen" src={b.imagen} alt="" />}
      <div class="banner-texto">
        <h1 id="titulo-banner">{b.titulo}</h1>
        {b.texto && <p>{b.texto}</p>}
        {b.boton.link && (
          <a class="boton" href={b.boton.link}>
            {b.boton.texto}
          </a>
        )}
      </div>
    </section>
  );
}

function Inicio({
  productos,
  filas,
  cfg,
}: {
  productos: Producto[];
  filas: Parameters<typeof destacadosPorCategoria>[1];
  cfg: ConfigServidor | undefined;
}) {
  const filasDestacados = destacadosPorCategoria(productos, filas);
  return (
    <div class="pila" style={{ gap: '32px' }}>
      <Banner />
      {filasDestacados.map((f) => (
        <section key={f.categoria} class="pila" aria-labelledby={`fila-${f.categoria}`}>
          <div class="fila-extremos">
            <h2 id={`fila-${f.categoria}`}>{t.destacadosDe(f.categoria)}</h2>
            <a class="enlace" href={linkCategoria(f.categoria)} aria-label={t.verTodoDe(f.categoria)}>
              {t.verTodo} <IconoDerecha />
            </a>
          </div>
          {/* Fila con desplazamiento horizontal: en el celular se desliza con el dedo. */}
          <ul class="fila-productos" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {f.productos.map((p) => (
              <li key={p.id}>
                <TarjetaProducto p={p} cfg={cfg} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function Catalogo() {
  const filtro = leerUrl();
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getCategorias(), ds.getConfig()]), [], ds);
  const [productos, filas, cfg] = datos.datos ?? [undefined, undefined, undefined];
  const categorias = filas ? agruparCategorias(filas) : [];
  const { busqueda } = filtro;
  const subFila = filas?.find((f) => f.id === filtro.sub);

  let contenido;
  if (datos.cargando && !productos) {
    contenido = (
      <div class="grilla" aria-busy="true" aria-label={textos.general.cargando}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} class="pila-chica">
            <div class="foto esqueleto" />
            <div class="esqueleto" style={{ height: '16px', width: '70%' }} />
            <div class="esqueleto" style={{ height: '16px', width: '40%' }} />
          </div>
        ))}
      </div>
    );
  } else if (datos.error && !productos) {
    contenido = <ErrorCarga error={datos.error} titulo={t.errorCatalogo} alReintentar={datos.recargar} />;
  } else if (!productos || !filas) {
    contenido = null;
  } else if (busqueda) {
    const lista = productos.filter((p) => coincide(p.nombre, busqueda));
    contenido = (
      <div class="pila">
        <Migas pasos={[{ texto: t.inicio, link: '/' }, { texto: t.busquedaMigas }]} />
        {lista.length ? (
          <>
            <h1 role="status">{t.resultados(lista.length, busqueda)}</h1>
            <Grilla lista={lista} cfg={cfg} busqueda={busqueda} />
          </>
        ) : (
          <div class="pila centrado" style={{ padding: '32px 0' }} role="status">
            <h1>{t.sinResultados(busqueda)}</h1>
            <p class="suave">{t.sinResultadosAyuda}</p>
            <div class="chips envolver" style={{ justifyContent: 'center' }}>
              {categorias.map((c) => (
                <a key={c.nombre} class="chip" href={linkCategoria(c.nombre)}>
                  {c.nombre}
                </a>
              ))}
            </div>
            <EnlaceWhatsapp class="boton secundario" texto={`Hola, estoy buscando ${busqueda}.`}>
              <IconoChat /> {t.consultarWhatsapp}
            </EnlaceWhatsapp>
          </div>
        )}
      </div>
    );
  } else if (filtro.cat) {
    // Subcategoría elegida, o grupo (nivel del medio, si la tienda usa 3 niveles), o toda la categoría.
    const grupoDe = (id: string) => {
      const f = filas.find((x) => x.id === id);
      return f ? grupoCategoria(f) : '';
    };
    const lista = productos.filter(
      (p) =>
        categoriaPrincipal(filas, p.categoriaId) === filtro.cat &&
        (!filtro.sub || p.categoriaId === filtro.sub) &&
        (!filtro.grupo || grupoDe(p.categoriaId) === filtro.grupo),
    );
    const ruta = subFila ? rutaCategoria(subFila) : [filtro.cat, ...(filtro.grupo ? [filtro.grupo] : [])];
    const titulo = ruta[ruta.length - 1];
    const pasos = [
      { texto: t.inicio, link: '/' },
      ...ruta.map((texto, i) => ({
        texto,
        link: i === 0 ? linkCategoria(filtro.cat) : i < ruta.length - 1 ? linkCategoria(filtro.cat, undefined, texto) : undefined,
      })),
    ];
    contenido = (
      <div class="pila">
        <Migas pasos={pasos} />
        <h1>{titulo}</h1>
        {lista.length ? <Grilla lista={lista} cfg={cfg} /> : <p class="suave">{t.categoriaVacia}</p>}
      </div>
    );
  } else {
    contenido = <Inicio productos={productos} filas={filas} cfg={cfg} />;
  }

  return (
    <Marco conBarraAbajo>
      <div>{contenido}</div>
      <BarraCarrito productos={productos} />
    </Marco>
  );
}
