// Ajuste rápido de stock (docs/03-admin.md, D-12): se suma o resta con − / + y se
// confirma con "Guardar cambios". Tocar afuera, o la tecla Escape, también cierra
// el desplegable; si quedaron cambios sin guardar, se guardan antes de cerrar.

import { useEffect, useRef, useState } from 'preact/hooks';
import { mensajeDeError, mostrarToast } from '../../componentes/basicos';
import { claveVariante } from '../../datos/reglas';
import type { DataStore, Pedido, Producto } from '../../datos/tipos';
import { textos } from '../../textos/textos';

const t = textos.admin;

type EstadoGuardado = 'quieto' | 'guardando' | 'error';

export function AjusteRapido({
  ds,
  producto,
  pendientes,
  alCerrar,
}: {
  ds: DataStore;
  producto: Producto;
  pendientes: Pedido[];
  alCerrar: () => void;
}) {
  const cs = producto.colores.length ? producto.colores : [''];
  const [color, setColor] = useState(cs[0]);
  const desdeProducto = () => Object.fromEntries(producto.variantes.map((v) => [claveVariante(v.color, v.talle), v.cantidad]));
  // Borrador local: lo que el dueño ve y toca. No se pisa con datos que llegan mientras edita.
  const [borrador, setBorrador] = useState<Record<string, number>>(desdeProducto);
  const [sucios, setSucios] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<EstadoGuardado>('quieto');
  const [errorTexto, setErrorTexto] = useState('');

  // Si no hay cambios propios, tomar los datos nuevos (por ejemplo, una venta confirmada).
  useEffect(() => {
    if (sucios.size === 0 && estado !== 'guardando') setBorrador(desdeProducto());
  }, [producto]);

  async function guardarYCerrar() {
    if (estado === 'guardando') return;
    if (!sucios.size) return alCerrar();
    setEstado('guardando');
    const cambios = [...sucios].map((k) => {
      const [c, s] = k.split('|');
      return { color: c, talle: s, cantidad: borrador[k] ?? 0 };
    });
    try {
      await ds.ajustarStock(producto.id, cambios);
      pendiente.current.sucios = new Set();
      setSucios(new Set());
      setEstado('quieto');
      mostrarToast(t.guardadoProducto(producto.nombre));
      alCerrar();
    } catch (e) {
      setErrorTexto(mensajeDeError(e));
      setEstado('error');
    }
  }

  // Tocar afuera del producto, o la tecla Escape, cierra (guardando lo pendiente).
  const guardarRef = useRef(guardarYCerrar);
  guardarRef.current = guardarYCerrar;
  const pendiente = useRef({ sucios, borrador });
  pendiente.current = { sucios, borrador };

  // Si se cierra de otra forma (por ejemplo, tocando de nuevo el producto) con cambios
  // sin guardar, se guardan igual: nunca se pierde lo que tocó el dueño.
  useEffect(
    () => () => {
      const { sucios: sinGuardar, borrador: b } = pendiente.current;
      if (!sinGuardar.size) return;
      const cambios = [...sinGuardar].map((k) => {
        const [c, s] = k.split('|');
        return { color: c, talle: s, cantidad: b[k] ?? 0 };
      });
      ds.ajustarStock(producto.id, cambios)
        .then(() => mostrarToast(t.guardadoProducto(producto.nombre)))
        .catch((e) => mostrarToast(`${t.noSeGuardo}: ${mensajeDeError(e)}`));
    },
    [],
  );
  useEffect(() => {
    const afuera = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest(`[data-producto="${CSS.escape(producto.id)}"]`) || el?.closest('dialog, .toast-zona')) return;
      guardarRef.current();
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && guardarRef.current();
    document.addEventListener('pointerdown', afuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', afuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [producto.id]);

  function paso(k: string, d: number) {
    setBorrador({ ...borrador, [k]: Math.max(0, (borrador[k] ?? 0) + d) });
    setSucios(new Set(sucios).add(k));
    if (estado === 'error') setEstado('quieto');
  }

  const reservas = (c: string, s: string) => {
    const nums: number[] = [];
    let n = 0;
    for (const p of pendientes) {
      const cant = p.items
        .filter((i) => i.productoId === producto.id && i.color === c && i.talle === s)
        .reduce((a, i) => a + i.cantidad, 0);
      if (cant) {
        n += cant;
        nums.push(p.numero);
      }
    }
    return { n, nums };
  };

  const ts = producto.talles.length ? producto.talles : [''];
  const totalColor = (c: string) => ts.reduce((a, s) => a + (borrador[claveVariante(c, s)] ?? 0), 0);
  const guardando = estado === 'guardando';

  return (
    <div class="ajuste">
      {producto.colores.length > 1 && (
        <div class="pestanas" role="group" aria-label="Color">
          {producto.colores.map((c) => (
            <button key={c} type="button" aria-pressed={c === color} onClick={() => setColor(c)}>
              {t.colorTab(c, totalColor(c))}
            </button>
          ))}
        </div>
      )}
      {ts.map((s) => {
        const k = claveVariante(color, s);
        const valor = borrador[k] ?? 0;
        const r = reservas(color, s);
        const etiqueta = s ? `Talle ${s}` : color || t.unidades;
        const lista = r.nums.map((n) => `#${n}`).join(', ');
        return (
          <div key={k} class="pila-chica" style={{ gap: '4px' }}>
            <div class="linea-stock">
              <span class="etiqueta-stock" id={`et-${producto.id}-${k}`}>
                {etiqueta}
              </span>
              <button
                type="button"
                class="paso"
                aria-label={`Restar uno a ${etiqueta}`}
                disabled={valor <= 0 || guardando}
                onClick={() => paso(k, -1)}
              >
                −
              </button>
              <output class="valor-stock num" aria-labelledby={`et-${producto.id}-${k}`} aria-live="polite">
                {valor}
              </output>
              <button
                type="button"
                class="paso"
                aria-label={`Sumar uno a ${etiqueta}`}
                disabled={guardando}
                onClick={() => paso(k, 1)}
              >
                +
              </button>
            </div>
            {r.n > 0 &&
              (valor < r.n ? (
                <div class="aviso" role="alert">
                  {t.reservaAfectada(r.n, lista)} <a href={`#/pedidos/${r.nums[0]}`}>{t.verPedido(r.nums[0])}</a>
                </div>
              ) : (
                <span class="chico suave">{t.reservadas(r.n, lista)}</span>
              ))}
          </div>
        );
      })}
      {estado === 'error' && (
        <p class="estado-error chico" role="alert">
          {t.noSeGuardo} · {errorTexto}
        </p>
      )}
      <button type="button" class="boton chico" disabled={guardando} onClick={guardarYCerrar}>
        {guardando ? t.guardando : estado === 'error' ? t.reintentar : t.guardarCambios}
      </button>
      <a class="enlace" style={{ alignSelf: 'flex-start' }} href={`#/productos/${encodeURIComponent(producto.id)}`}>
        {t.editarProducto}
      </a>
    </div>
  );
}
