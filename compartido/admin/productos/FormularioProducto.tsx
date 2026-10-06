// Formulario de producto (alta y edición). Regla clave: cada campo es lo que
// el comprador ve en la ficha (salvo el código, que es interno).

import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Dialogo,
  ErrorCarga,
  ErrorDeCampo,
  Foto,
  mensajeDeError,
  mostrarToast,
  ResumenErrores,
  useCarga,
} from '../../componentes/basicos';
import { IconoAtras, IconoFoto } from '../../componentes/iconos';
import {
  agruparCategorias,
  claveVariante,
  combinaciones,
  etiquetaVariante,
  formatoPrecio,
  linkWhatsapp,
  nombreCategoria,
  parsePrecio,
} from '../../datos/reglas';
import type { FilaCategoria, Producto } from '../../datos/tipos';
import { textos } from '../../textos/textos';
import type { ContextoAdmin } from '../nucleo/tipos';
import { achicarFoto } from './achicarFoto';

const t = textos.admin;

interface FotoBorrador {
  clave: string;
  /** id ya guardado. */
  id?: string;
  /** Foto nueva, ya achicada, todavía sin subir. */
  blob?: Blob;
  /** Vista previa de una foto nueva. */
  url?: string;
}

interface Borrador {
  nombre: string;
  categoriaId: string;
  precio: string;
  descripcion: string;
  codigo: string;
  visible: boolean;
  colores: string[];
  talles: string[];
  stock: Record<string, string>;
  fotos: FotoBorrador[];
}

type Campo = 'fotos' | 'nombre' | 'categoriaId' | 'precio';
const ORDEN: Campo[] = ['fotos', 'nombre', 'categoriaId', 'precio'];
const ID_CAMPO: Record<Campo, string> = {
  fotos: 'pf-fotos',
  nombre: 'pf-nombre',
  categoriaId: 'pf-categoria',
  precio: 'pf-precio',
};

let contadorFotos = 0;
const claveFoto = () => `f${++contadorFotos}`;

function desdeProducto(p: Producto | null): Borrador {
  if (!p) {
    return {
      nombre: '',
      categoriaId: '',
      precio: '',
      descripcion: '',
      codigo: '',
      visible: true,
      colores: [],
      talles: [],
      stock: {},
      fotos: [],
    };
  }
  return {
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    precio: formatoPrecio(p.precio).replace('$ ', ''),
    descripcion: p.descripcion,
    codigo: p.codigo,
    visible: p.visible,
    colores: [...p.colores],
    talles: [...p.talles],
    stock: Object.fromEntries(p.variantes.map((v) => [claveVariante(v.color, v.talle), String(v.cantidad)])),
    fotos: p.fotos.map((id) => ({ clave: claveFoto(), id })),
  };
}

function validar(b: Borrador): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  if (!b.fotos.length) e.fotos = t.errFotos;
  if (!b.nombre.trim()) e.nombre = t.errNombre;
  if (!b.categoriaId) e.categoriaId = t.errCategoria;
  const pr = parsePrecio(b.precio);
  if (isNaN(pr) || pr <= 0) e.precio = t.errPrecio;
  return e;
}

const numero = (s: string | undefined) => {
  const n = parseInt(String(s ?? '').replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

function EditorLista({
  id,
  titulo,
  ejemplo,
  valores,
  alCambiar,
}: {
  id: string;
  titulo: string;
  ejemplo: string;
  valores: string[];
  alCambiar: (v: string[]) => void;
}) {
  const [texto, setTexto] = useState('');
  function sumar() {
    const v = texto.trim();
    if (v && !valores.some((x) => x.toLowerCase() === v.toLowerCase())) alCambiar([...valores, v]);
    setTexto('');
  }
  return (
    <div class="pila-chica">
      <label class="negrita" for={id}>
        {titulo} <span class="opcional">{textos.tienda.opcional}</span>
      </label>
      {valores.length > 0 && (
        <ul class="chips envolver" style={{ listStyle: 'none', margin: 0 }}>
          {valores.map((v, i) => (
            <li key={v} class="chip" aria-pressed="true" style={{ cursor: 'default', paddingRight: '4px' }}>
              {v}
              <button
                type="button"
                aria-label={t.quitarItem(v)}
                onClick={() => alCambiar(valores.filter((_, j) => j !== i))}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: '36px',
                  minHeight: '36px',
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div class="fila" style={{ flexWrap: 'nowrap' }}>
        <input
          id={id}
          class="entrada"
          style={{ minHeight: 'var(--toque)' }}
          placeholder={ejemplo}
          value={texto}
          onInput={(e) => setTexto((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sumar();
            }
          }}
        />
        <button type="button" class="boton secundario chico" onClick={sumar}>
          {t.sumarItem}
        </button>
      </div>
    </div>
  );
}

function Fotos({
  ctx,
  fotos,
  alCambiar,
  error,
}: {
  ctx: ContextoAdmin;
  fotos: FotoBorrador[];
  alCambiar: (f: FotoBorrador[]) => void;
  error?: string;
}) {
  const [preparando, setPreparando] = useState(false);
  const [problema, setProblema] = useState('');
  const [encima, setEncima] = useState(false);
  const ultimas = useRef(fotos);
  ultimas.current = fotos;

  async function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    setPreparando(true);
    setProblema('');
    const nuevas: FotoBorrador[] = [];
    for (const archivo of Array.from(lista)) {
      if (!archivo.type.startsWith('image/')) continue;
      try {
        const blob = await achicarFoto(archivo);
        nuevas.push({ clave: claveFoto(), blob, url: URL.createObjectURL(blob) });
      } catch {
        setProblema(t.fotoNoSirve);
      }
    }
    setPreparando(false);
    alCambiar([...ultimas.current, ...nuevas]);
  }

  return (
    <section class="pila-chica" aria-labelledby="titulo-fotos">
      <h2 id="titulo-fotos" style={{ fontSize: 'var(--texto-medio)' }}>
        {t.fotos}
      </h2>
      <ul class="fotos-producto">
        {fotos.map((f, i) => (
          <li key={f.clave} class="foto-producto">
            {f.url ? (
              <img src={f.url} alt={t.fotoN(i + 1)} />
            ) : (
              <Foto ds={ctx.ds} id={f.id} alt={t.fotoN(i + 1)} clase="cuadrada" />
            )}
            {i === 0 && <span class="marca-principal">{t.principal}</span>}
            <div class="acciones-foto">
              {i > 0 ? (
                <button
                  type="button"
                  aria-label={t.hacerPrincipalN(i + 1)}
                  onClick={() => alCambiar([f, ...fotos.filter((x) => x !== f)])}
                >
                  {t.principal}
                </button>
              ) : (
                <span />
              )}
              <button type="button" aria-label={t.quitarFoto(i + 1)} onClick={() => alCambiar(fotos.filter((x) => x !== f))}>
                {textos.tienda.quitar}
              </button>
            </div>
          </li>
        ))}
        <li>
          <label
            class={`zona-fotos ${encima ? 'encima' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setEncima(true);
            }}
            onDragLeave={() => setEncima(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEncima(false);
              agregar(e.dataTransfer?.files ?? null);
            }}
          >
            {preparando ? <span class="girando chico" /> : <IconoFoto />}
            <span class="negrita">{preparando ? t.preparandoFotos : t.agregarFotos}</span>
            <span class="suave">{t.agregarFotosAyuda}</span>
            <input
              id="pf-fotos"
              type="file"
              accept="image/*"
              multiple
              class="sr"
              aria-invalid={!!error}
              aria-describedby={error ? 'e-fotos' : undefined}
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                agregar(input.files).finally(() => (input.value = ''));
              }}
            />
          </label>
        </li>
      </ul>
      <ErrorDeCampo id="e-fotos" error={error} />
      {problema && <span class="error-campo">{problema}</span>}
      <span class="ayuda">{t.fotosAyuda}</span>
    </section>
  );
}

function VistaPrevia({ ctx, b, filas }: { ctx: ContextoAdmin; b: Borrador; filas: FilaCategoria[] }) {
  const f = b.fotos[0];
  const pr = parsePrecio(b.precio);
  return (
    <section class="panel pila-chica" aria-labelledby="titulo-vista">
      <h2 id="titulo-vista" style={{ fontSize: 'var(--texto-base)' }}>
        {t.asiSeVe}
      </h2>
      <div class="fila" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div style={{ width: '110px', flexShrink: 0 }}>
          {f?.url ? (
            <div class="foto">
              <img src={f.url} alt="" />
            </div>
          ) : (
            <Foto ds={ctx.ds} id={f?.id} inicial="?" />
          )}
        </div>
        <div class="pila-chica" style={{ gap: '2px', minWidth: 0 }}>
          <span class="chico suave">{nombreCategoria(filas, b.categoriaId) || t.categoria}</span>
          <strong>{b.nombre || t.nombreEjemplo}</strong>
          <span class="precio">{isNaN(pr) ? '$ —' : formatoPrecio(pr)}</span>
          {b.colores.length > 0 && (
            <span class="chico suave">
              {t.colores}: {b.colores.join(', ')}
            </span>
          )}
          {b.talles.length > 0 && (
            <span class="chico suave">
              {t.talles}: {b.talles.join(', ')}
            </span>
          )}
          {!b.visible && <span class="pastilla">{t.oculto}</span>}
        </div>
      </div>
    </section>
  );
}

function Editor({
  ctx,
  original,
  filas,
  todos,
}: {
  ctx: ContextoAdmin;
  original: Producto | null;
  filas: FilaCategoria[];
  todos: Producto[];
}) {
  const { ds } = ctx;
  const [b, setB] = useState<Borrador>(() => desdeProducto(original));
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState<{ total: number; hechas: number } | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<unknown>(null);
  const [descarte, setDescarte] = useState<string[] | null>(null);
  const [borrar, setBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const refResumen = useRef<HTMLDivElement>(null);

  // Liberar las vistas previas de fotos nuevas al salir.
  useEffect(() => () => b.fotos.forEach((f) => f.url && URL.revokeObjectURL(f.url)), []);

  function cambiar(parcial: Partial<Borrador>) {
    const nuevo = { ...b, ...parcial };
    setB(nuevo);
    if (intento) setErrores(validar(nuevo));
  }

  const combos = combinaciones(b.colores, b.talles);
  const codigoRepetido = b.codigo.trim()
    ? todos.find((p) => p.id !== original?.id && p.codigo && p.codigo.trim().toLowerCase() === b.codigo.trim().toLowerCase())
    : undefined;

  function stockQueSeDescarta(): string[] {
    if (!original) return [];
    return original.variantes
      .filter((v) => v.cantidad > 0 && !combos.some((c) => c.color === v.color && c.talle === v.talle))
      .map((v) => `${etiquetaVariante(v.color, v.talle) || t.unidades} (${v.cantidad})`);
  }

  async function guardar() {
    setDescarte(null);
    setErrorGuardar(null);
    let fotos = b.fotos;
    const nuevas = fotos.filter((f) => f.blob && !f.id).length;
    setGuardando({ total: nuevas, hechas: 0 });
    try {
      // Subimos las fotos nuevas de a una (se ve el avance).
      let hechas = 0;
      for (const f of fotos) {
        if (f.blob && !f.id) {
          const id = await ds.subirFoto(f.blob);
          fotos = fotos.map((x) => (x === f ? { ...x, id } : x));
          setB((actual) => ({ ...actual, fotos }));
          setGuardando({ total: nuevas, hechas: ++hechas });
        }
      }
      const guardado = await ds.guardarProducto({
        id: original?.id ?? null,
        nombre: b.nombre.trim(),
        categoriaId: b.categoriaId,
        precio: parsePrecio(b.precio),
        descripcion: b.descripcion.trim(),
        codigo: b.codigo.trim(),
        visible: b.visible,
        colores: b.colores,
        talles: b.talles,
        fotos: fotos.map((f) => f.id!),
        stock: combos.map((c) => ({ ...c, cantidad: numero(b.stock[claveVariante(c.color, c.talle)]) })),
      });
      mostrarToast(guardado.visible ? t.productoGuardado : t.productoGuardadoOculto);
      ctx.ir('productos');
    } catch (e) {
      setErrorGuardar(e);
      setGuardando(null);
      window.scrollTo(0, 0);
    }
  }

  function alEnviar(ev: Event) {
    ev.preventDefault();
    setIntento(true);
    const e = validar(b);
    setErrores(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => refResumen.current?.focus());
      return;
    }
    const perdidos = stockQueSeDescarta();
    if (perdidos.length) setDescarte(perdidos);
    else guardar();
  }

  async function eliminar() {
    if (!original) return;
    setBorrando(true);
    try {
      await ds.eliminarProducto(original.id);
      mostrarToast(t.eliminado);
      ctx.ir('productos');
    } catch (e) {
      setBorrando(false);
      mostrarToast(mensajeDeError(e));
    }
  }

  const listaErrores = ORDEN.filter((c) => errores[c]).map((c) => ({ campo: ID_CAMPO[c], texto: errores[c]! }));
  const cs = b.colores.length ? b.colores : [''];
  const ts = b.talles.length ? b.talles : [''];
  const categorias = agruparCategorias(filas);

  if (guardando) {
    return (
      <div class="pila lectura" style={{ margin: '32px auto' }} role="status" aria-busy="true">
        <div class="girando" />
        <h1 style={{ textAlign: 'center' }}>{t.guardandoFotos(guardando.total)}</h1>
        {guardando.total > 0 && (
          <progress class="barra-progreso" max={guardando.total} value={guardando.hechas}>
            {guardando.hechas} de {guardando.total}
          </progress>
        )}
        <p class="suave" style={{ textAlign: 'center' }}>
          {t.datosMoviles}
        </p>
      </div>
    );
  }

  return (
    <form class="pila" noValidate onSubmit={alEnviar}>
      <div class="fila" style={{ flexWrap: 'nowrap' }}>
        <a class="boton-icono" href="#/productos" aria-label={t.volverProductos}>
          <IconoAtras />
        </a>
        <h1>{original ? t.editar : t.nuevoProducto}</h1>
      </div>
      <p class="chico suave">{t.reglaFormulario}</p>

      {errorGuardar != null && (
        <div class="alerta error" role="alert">
          <strong>{t.noSeGuardo}</strong>
          <span>{mensajeDeError(errorGuardar)}</span>
          <span class="chico suave">{t.noSePierde}</span>
        </div>
      )}
      <ResumenErrores titulo={t.faltan(listaErrores.length)} errores={listaErrores} pie={t.noSePierde} refFoco={refResumen} />

      <div class="form-producto">
        <div class="pila columna-fotos">
          <Fotos ctx={ctx} fotos={b.fotos} error={errores.fotos} alCambiar={(fotos) => cambiar({ fotos })} />
          <VistaPrevia ctx={ctx} b={b} filas={filas} />
        </div>

        <div class="pila">
          <div class="campo">
            <label for="pf-nombre">{t.nombreProducto}</label>
            <input
              id="pf-nombre"
              class="entrada"
              value={b.nombre}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'e-nombre' : undefined}
              onInput={(e) => cambiar({ nombre: (e.target as HTMLInputElement).value })}
            />
            <ErrorDeCampo id="e-nombre" error={errores.nombre} />
          </div>

          <div class="campo">
            <label for="pf-categoria">{t.categoria}</label>
            <select
              id="pf-categoria"
              class="entrada"
              value={b.categoriaId}
              aria-invalid={!!errores.categoriaId}
              aria-describedby={['a-categoria', errores.categoriaId ? 'e-categoria' : ''].join(' ').trim()}
              onChange={(e) => cambiar({ categoriaId: (e.target as HTMLSelectElement).value })}
            >
              <option value="">{t.elegiCategoria}</option>
              {categorias.map((c) =>
                c.subcategorias.length ? (
                  <optgroup key={c.nombre} label={c.nombre}>
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
            <ErrorDeCampo id="e-categoria" error={errores.categoriaId} />
            <span id="a-categoria" class="ayuda">
              {ctx.config.whatsappSoporte ? (
                <a
                  href={linkWhatsapp(ctx.config.whatsappSoporte, 'Hola, necesito sumar una categoría a la tienda.')}
                  target="_blank"
                  rel="noopener"
                >
                  {t.categoriaAyuda}
                </a>
              ) : (
                t.categoriaAyuda
              )}
            </span>
          </div>

          <div class="campo">
            <label for="pf-precio">{t.precio}</label>
            <input
              id="pf-precio"
              class="entrada"
              inputMode="numeric"
              placeholder={t.precioEjemplo}
              value={b.precio}
              aria-invalid={!!errores.precio}
              aria-describedby={['a-precio', errores.precio ? 'e-precio' : ''].join(' ').trim()}
              onInput={(e) => cambiar({ precio: (e.target as HTMLInputElement).value })}
            />
            <ErrorDeCampo id="e-precio" error={errores.precio} />
            <span id="a-precio" class="ayuda">
              {t.precioAyuda}
            </span>
          </div>

          <div class="campo">
            <label for="pf-descripcion">
              {t.descripcion} <span class="opcional">{textos.tienda.opcional}</span>
            </label>
            <textarea
              id="pf-descripcion"
              class="entrada"
              rows={3}
              value={b.descripcion}
              onInput={(e) => cambiar({ descripcion: (e.target as HTMLTextAreaElement).value })}
            />
          </div>

          <EditorLista
            id="pf-colores"
            titulo={t.colores}
            ejemplo={t.coloresEjemplo}
            valores={b.colores}
            alCambiar={(colores) => cambiar({ colores })}
          />
          <EditorLista
            id="pf-talles"
            titulo={t.talles}
            ejemplo={t.tallesEjemplo}
            valores={b.talles}
            alCambiar={(talles) => cambiar({ talles })}
          />

          <fieldset class="pila-chica">
            <legend>{b.colores.length || b.talles.length ? t.stockCombinaciones : t.stock}</legend>
            <div class="grilla-stock">
              <table>
                {(b.talles.length > 0 || b.colores.length === 0) && (
                  <thead>
                    <tr>
                      {b.colores.length > 0 && <td />}
                      {ts.map((s) => (
                        <th key={s} scope="col">
                          {s || t.unidades}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {cs.map((c) => (
                    <tr key={c}>
                      {b.colores.length > 0 && <th scope="row">{c}</th>}
                      {ts.map((s) => {
                        const k = claveVariante(c, s);
                        return (
                          <td key={k}>
                            <input
                              type="text"
                              inputMode="numeric"
                              aria-label={t.stockDe(etiquetaVariante(c, s) || t.unidades)}
                              value={b.stock[k] ?? ''}
                              placeholder="0"
                              onInput={(e) =>
                                cambiar({ stock: { ...b.stock, [k]: (e.target as HTMLInputElement).value.replace(/\D/g, '') } })
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>

          <details open={!!b.codigo}>
            <summary>{t.masOpciones}</summary>
            <div class="campo" style={{ paddingTop: '8px' }}>
              <label for="pf-codigo">
                {t.codigo} <span class="opcional">{textos.tienda.opcional}</span>
              </label>
              <input
                id="pf-codigo"
                class="entrada"
                value={b.codigo}
                aria-describedby="a-codigo"
                onInput={(e) => cambiar({ codigo: (e.target as HTMLInputElement).value })}
              />
              <span id="a-codigo" class="ayuda">
                {t.codigoAyuda}
              </span>
              {codigoRepetido && (
                <span class="aviso" role="status">
                  {t.codigoRepetido(b.codigo.trim(), codigoRepetido.nombre)}
                </span>
              )}
            </div>
          </details>

          <label class="fila" style={{ flexWrap: 'nowrap', minHeight: '52px' }}>
            <span class="pila-chica" style={{ gap: 0, flex: 1 }}>
              <strong>{t.mostrar}</strong>
              <span class="ayuda">{t.mostrarAyuda}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              class="interruptor"
              checked={b.visible}
              onChange={(e) => cambiar({ visible: (e.target as HTMLInputElement).checked })}
            />
          </label>

          <div class="fila">
            <button type="submit" class="boton" style={{ flex: 1 }}>
              {t.guardar}
            </button>
            <a class="boton secundario" href="#/productos">
              {t.cancelarForm}
            </a>
          </div>

          {original &&
            (borrar ? (
              <div class="alerta" role="alert">
                <strong>{t.eliminarPregunta(original.nombre)}</strong>
                <span class="chico">{t.eliminarAyuda}</span>
                <div class="fila">
                  <button type="button" class="boton chico" disabled={borrando} onClick={eliminar}>
                    {borrando ? t.guardando : t.eliminarSi}
                  </button>
                  <button type="button" class="boton secundario chico" disabled={borrando} onClick={() => setBorrar(false)}>
                    {t.eliminarNo}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" class="enlace" style={{ alignSelf: 'flex-start' }} onClick={() => setBorrar(true)}>
                {t.eliminar}
              </button>
            ))}
        </div>
      </div>

      <Dialogo abierto={!!descarte} alCerrar={() => setDescarte(null)} titulo={t.stockDescartado}>
        <p>{t.stockDescartadoTexto((descarte ?? []).join(', '))}</p>
        <button type="button" class="boton" onClick={guardar}>
          {t.guardarIgual}
        </button>
        <button type="button" class="boton secundario" onClick={() => setDescarte(null)}>
          {t.revisar}
        </button>
      </Dialogo>
    </form>
  );
}

export function FormularioProducto({ id, ctx }: { id: string | null; ctx: ContextoAdmin }) {
  const { ds } = ctx;
  // Sin recarga automática: si llegan datos nuevos mientras edita, no le pisamos lo escrito.
  const datos = useCarga(() => Promise.all([ds.getProductos({ incluirOcultos: true }), ds.getCategorias()]), [id]);
  const [todos, filas] = datos.datos ?? [undefined, undefined];

  if (datos.cargando && !todos) {
    return (
      <div class="pila" aria-busy="true" aria-label={textos.general.cargando}>
        <div class="esqueleto" style={{ height: '32px', width: '50%' }} />
        <div class="esqueleto" style={{ height: '220px' }} />
        <div class="esqueleto" style={{ height: '52px' }} />
      </div>
    );
  }
  if (datos.error && !todos) return <ErrorCarga error={datos.error} alReintentar={datos.recargar} />;
  if (!todos || !filas) return null;
  const original = id ? (todos.find((p) => p.id === id) ?? null) : null;
  if (id && !original) {
    return (
      <div class="pila">
        <p>{t.productoNoExiste}</p>
        <a class="boton secundario" href="#/productos">
          {t.volverProductos}
        </a>
      </div>
    );
  }
  return <Editor ctx={ctx} original={original} filas={filas} todos={todos} />;
}
