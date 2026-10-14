// Catálogo. Según la dirección muestra:
//   /                 inicio: banner y una fila de destacados por categoría principal
//   /?cat=Mujer       una categoría (y ?sub= para una subcategoría): breadcrumb, título y productos
//   /?q=remera        resultados de búsqueda (el buscador está en el encabezado)

import { ErrorCarga, Foto, useCarga } from '@compartido/componentes/basicos';
import { IconoChat, IconoDerecha } from '@compartido/componentes/iconos';
import {
  agruparCategorias,
  categoriaPrincipal,
  coincide,
  destacadosPorCategoria,
  formatoPrecio,
  grupoCategoria,
  libreTotal,
  resaltar,
  rutaCategoria,
} from '@compartido/datos/reglas';
import type { Producto } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { config, ds } from '../lib/contexto';
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

function TarjetaProducto({ p, busqueda = '' }: { p: Producto; busqueda?: string }) {
  const agotado = libreTotal(p) === 0;
  return (
    <a class={`tarjeta ${agotado ? 'atenuado' : ''}`} href={`/producto/?id=${encodeURIComponent(p.id)}`}>
      <Foto ds={ds} id={p.fotos[0]} inicial={p.nombre}>
        {agotado && <span class="etiqueta-foto">{t.sinStock}</span>}
      </Foto>
      <span class="tarjeta-nombre">
        {resaltar(p.nombre, busqueda).map((tr, i) => (tr.resaltado ? <mark key={i}>{tr.texto}</mark> : tr.texto))}
      </span>
      <span class="precio">{formatoPrecio(p.precio)}</span>
      {agotado && <span class="sr">, {t.sinStock}</span>}
    </a>
  );
}

function Grilla({ lista, busqueda }: { lista: Producto[]; busqueda?: string }) {
  return (
    <ul class="grilla" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {lista.map((p) => (
        <li key={p.id}>
          <TarjetaProducto p={p} busqueda={busqueda} />
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

function Inicio({ productos, filas }: { productos: Producto[]; filas: Parameters<typeof destacadosPorCategoria>[1] }) {
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
                <TarjetaProducto p={p} />
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
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getCategorias()]), [], ds);
  const [productos, filas] = datos.datos ?? [undefined, undefined];
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
            <Grilla lista={lista} busqueda={busqueda} />
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
        {lista.length ? <Grilla lista={lista} /> : <p class="suave">{t.categoriaVacia}</p>}
      </div>
    );
  } else {
    contenido = <Inicio productos={productos} filas={filas} />;
  }

  return (
    <Marco conBarraAbajo>
      <div>{contenido}</div>
      <BarraCarrito productos={productos} />
    </Marco>
  );
}
