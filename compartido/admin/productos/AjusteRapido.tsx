// Ajuste rápido de stock: se guarda solo, sin botón (docs/03-admin.md).

import { useEffect, useRef, useState } from 'preact/hooks';
import { mensajeDeError } from '../../componentes/basicos';
import { IconoCheck } from '../../componentes/iconos';
import { claveVariante } from '../../datos/reglas';
import type { DataStore, Pedido, Producto } from '../../datos/tipos';
import { textos } from '../../textos/textos';

const t = textos.admin;
const ESPERA_MS = 900; // espera después del último toque antes de guardar

type EstadoGuardado = 'quieto' | 'esperando' | 'guardando' | 'guardado' | 'error';

export function AjusteRapido({ ds, producto, pendientes }: { ds: DataStore; producto: Producto; pendientes: Pedido[] }) {
  const cs = producto.colores.length ? producto.colores : [''];
  const [color, setColor] = useState(cs[0]);
  // Borrador local: lo que el dueño ve y toca. No se pisa con datos que llegan mientras edita.
  const [borrador, setBorrador] = useState<Record<string, number>>(() =>
    Object.fromEntries(producto.variantes.map((v) => [claveVariante(v.color, v.talle), v.cantidad])),
  );
  const [estado, setEstado] = useState<EstadoGuardado>('quieto');
  const [errorTexto, setErrorTexto] = useState('');
  const sucios = useRef(new Set<string>());
  const temporizador = useRef<ReturnType<typeof setTimeout>>();
  const borradorRef = useRef(borrador);
  borradorRef.current = borrador;
  /** Valores que se mandaron a guardar en la última vuelta. */
  const enviado = useRef<Record<string, number>>({});

  // Si no hay cambios propios en curso, tomar los datos nuevos (por ejemplo, una venta confirmada).
  useEffect(() => {
    if (sucios.current.size === 0 && estado !== 'guardando') {
      setBorrador(Object.fromEntries(producto.variantes.map((v) => [claveVariante(v.color, v.talle), v.cantidad])));
    }
  }, [producto]);

  // Si se cierra el producto con cambios sin guardar, se guardan en el momento.
  useEffect(
    () => () => {
      clearTimeout(temporizador.current);
      if (sucios.current.size) {
        enviado.current = { ...borradorRef.current };
        guardar();
      }
    },
    [],
  );

  async function guardar() {
    const claves = [...sucios.current];
    if (!claves.length) return;
    setEstado('guardando');
    const cambios = claves.map((k) => {
      const [c, s] = k.split('|');
      return { color: c, talle: s, cantidad: borradorRef.current[k] ?? 0 };
    });
    try {
      await ds.ajustarStock(producto.id, cambios);
      // Si tocó algo más mientras guardábamos, queda pendiente para la próxima vuelta.
      claves.forEach((k) => {
        if (enviado.current[k] === borradorRef.current[k]) sucios.current.delete(k);
      });
      setEstado(sucios.current.size ? 'esperando' : 'guardado');
      if (sucios.current.size) programar();
    } catch (e) {
      setErrorTexto(mensajeDeError(e));
      setEstado('error');
    }
  }

  function programar() {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      enviado.current = { ...borradorRef.current };
      guardar();
    }, ESPERA_MS);
  }

  function paso(k: string, d: number) {
    const nuevo = Math.max(0, (borrador[k] ?? 0) + d);
    setBorrador({ ...borrador, [k]: nuevo });
    sucios.current.add(k);
    setEstado('esperando');
    programar();
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
                disabled={valor <= 0}
                onClick={() => paso(k, -1)}
              >
                −
              </button>
              <output class="valor-stock num" aria-labelledby={`et-${producto.id}-${k}`} aria-live="polite">
                {valor}
              </output>
              <button type="button" class="paso" aria-label={`Sumar uno a ${etiqueta}`} onClick={() => paso(k, 1)}>
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
      <div class="fila-extremos">
        <span role="status" class="chico">
          {estado === 'guardando' || estado === 'esperando' ? (
            <span class="suave">{t.guardando}</span>
          ) : estado === 'guardado' ? (
            <span class="estado-ok">
              <IconoCheck /> {t.guardado}
            </span>
          ) : estado === 'error' ? (
            <span class="estado-error">
              {t.noSeGuardo} · {errorTexto}{' '}
              <button
                type="button"
                class="enlace"
                onClick={() => {
                  enviado.current = { ...borradorRef.current };
                  guardar();
                }}
              >
                {t.reintentar}
              </button>
            </span>
          ) : null}
        </span>
        <a class="enlace" href={`#/productos/${encodeURIComponent(producto.id)}`}>
          {t.editarProducto}
        </a>
      </div>
    </div>
  );
}
