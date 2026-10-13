// Catálogo (inicio): buscador, categorías y grilla de productos.

import { useEffect, useState } from 'preact/hooks';
import { ErrorCarga, Foto, useCarga } from '@compartido/componentes/basicos';
import { IconoBuscar, IconoChat } from '@compartido/componentes/iconos';
import { agruparCategorias, categoriaPrincipal, coincide, formatoPrecio, libreTotal, resaltar } from '@compartido/datos/reglas';
import { textos } from '@compartido/textos/textos';
import { ds } from '../lib/contexto';
import { BarraCarrito, linkCategoria, Marco } from './Marco';
import { EnlaceWhatsapp } from './EnlaceWhatsapp';

const t = textos.tienda;

function leerUrl() {
  const q = new URLSearchParams(location.search);
  return { cat: q.get('cat') ?? '', sub: q.get('sub') ?? '', busqueda: q.get('q') ?? '' };
}

export default function Catalogo() {
  const [filtro, setFiltro] = useState(leerUrl);
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getCategorias()]), [], ds);
  const [productos, filas] = datos.datos ?? [undefined, undefined];

  // El filtro vive en la dirección (sin datos personales), así "atrás" y compartir funcionan.
  useEffect(() => {
    const q = new URLSearchParams();
    if (filtro.busqueda) q.set('q', filtro.busqueda);
    else {
      if (filtro.cat) q.set('cat', filtro.cat);
      if (filtro.sub) q.set('sub', filtro.sub);
    }
    const nueva = q.toString() ? `/?${q}` : '/';
    if (nueva !== location.pathname + location.search) history.replaceState(null, '', nueva);
  }, [filtro]);

  const categorias = filas ? agruparCategorias(filas) : [];
  const catElegida = categorias.find((c) => c.nombre === filtro.cat);
  const busqueda = filtro.busqueda.trim();

  let lista = productos ?? [];
  if (busqueda) lista = lista.filter((p) => coincide(p.nombre, busqueda));
  else if (filtro.cat && filas) {
    lista = lista.filter(
      (p) => categoriaPrincipal(filas, p.categoriaId) === filtro.cat && (!filtro.sub || p.categoriaId === filtro.sub),
    );
  }

  return (
    <Marco buscadorEnEncabezado={false} conBarraAbajo>
      <div class="pila" style={{ paddingTop: '14px' }}>
        <h1 class="sr">{t.buscar}</h1>
        <div class="buscador" role="search">
          <IconoBuscar />
          <label class="sr" for="buscar">
            {t.buscar}
          </label>
          <input
            id="buscar"
            type="search"
            placeholder={t.buscar}
            autocomplete="off"
            value={filtro.busqueda}
            onInput={(e) => setFiltro({ cat: '', sub: '', busqueda: (e.target as HTMLInputElement).value })}
          />
        </div>

        {!busqueda && categorias.length > 0 && (
          <>
            <nav class="chips" aria-label="Categorías">
              <button
                type="button"
                class="chip"
                aria-pressed={!filtro.cat}
                onClick={() => setFiltro({ cat: '', sub: '', busqueda: '' })}
              >
                {t.todo}
              </button>
              {categorias.map((c) => (
                <button
                  key={c.nombre}
                  type="button"
                  class="chip"
                  aria-pressed={filtro.cat === c.nombre}
                  onClick={() => setFiltro({ cat: c.nombre, sub: '', busqueda: '' })}
                >
                  {c.nombre}
                </button>
              ))}
            </nav>
            {catElegida && catElegida.subcategorias.length > 0 && (
              <div class="chips secundarios" role="group" aria-label={`Subcategorías de ${catElegida.nombre}`}>
                <button type="button" class="chip" aria-pressed={!filtro.sub} onClick={() => setFiltro({ ...filtro, sub: '' })}>
                  {t.todoDe(catElegida.nombre)}
                </button>
                {catElegida.subcategorias.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    class="chip"
                    aria-pressed={filtro.sub === s.id}
                    onClick={() => setFiltro({ ...filtro, sub: s.id })}
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {busqueda && productos && lista.length > 0 && (
          <p class="suave chico num" role="status">
            {t.resultados(lista.length, busqueda)}
          </p>
        )}

        {datos.cargando && !productos ? (
          <div class="grilla" aria-busy="true" aria-label={textos.general.cargando}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} class="pila-chica">
                <div class="foto esqueleto" />
                <div class="esqueleto" style={{ height: '16px', width: '70%' }} />
                <div class="esqueleto" style={{ height: '16px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : datos.error && !productos ? (
          <ErrorCarga error={datos.error} titulo={t.errorCatalogo} alReintentar={datos.recargar} />
        ) : lista.length === 0 ? (
          busqueda ? (
            <div class="pila centrado" style={{ padding: '32px 0' }} role="status">
              <h2>{t.sinResultados(busqueda)}</h2>
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
          ) : (
            <p class="suave">{t.categoriaVacia}</p>
          )
        ) : (
          <ul class="grilla" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {lista.map((p) => {
              const agotado = libreTotal(p) === 0;
              return (
                <li key={p.id}>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <BarraCarrito productos={productos} />
    </Marco>
  );
}
