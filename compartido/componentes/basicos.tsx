// Componentes básicos y accesibles, compartidos por la tienda y el admin.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { DataStore } from '../datos/tipos';
import { ErrorDatos } from '../datos/tipos';
import { textos } from '../textos/textos';
import { IconoAlerta } from './iconos';

// ---------- Carga de datos ----------

export interface EstadoCarga<T> {
  datos: T | undefined;
  cargando: boolean;
  error: unknown;
  recargar: () => void;
}

/**
 * Carga datos de forma asíncrona. `recargarCon` vuelve a pedir los datos
 * cuando la capa de datos avisa un cambio (otra pestaña, una escritura).
 */
export function useCarga<T>(fn: () => Promise<T>, deps: unknown[], recargarCon?: DataStore): EstadoCarga<T> {
  const [datos, setDatos] = useState<T>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [vuelta, setVuelta] = useState(0);
  const primera = useRef(true);

  useEffect(() => {
    let vigente = true;
    // Solo mostramos "cargando" la primera vez; después se actualiza sin parpadeo.
    if (primera.current) setCargando(true);
    fn()
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setError(null);
      })
      .catch((e) => vigente && setError(e))
      .finally(() => {
        if (!vigente) return;
        setCargando(false);
        primera.current = false;
      });
    return () => {
      vigente = false;
    };
  }, [...deps, vuelta]);

  useEffect(() => {
    if (!recargarCon) return;
    const sinSuscribir = recargarCon.alCambiar(() => setVuelta((v) => v + 1));
    const alVolver = () => document.visibilityState === 'visible' && setVuelta((v) => v + 1);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      sinSuscribir();
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargarCon]);

  return {
    datos,
    cargando,
    error,
    recargar: () => {
      primera.current = true;
      setVuelta((v) => v + 1);
    },
  };
}

export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorDatos) return textos.general.errores[e.tipo];
  if (typeof navigator !== 'undefined' && !navigator.onLine) return textos.general.errores.sinConexion;
  return textos.general.errores.servidor;
}

export function ErrorCarga({ error, titulo, alReintentar }: { error: unknown; titulo?: string; alReintentar: () => void }) {
  return (
    <div class="alerta error" role="alert">
      <strong>{titulo ?? mensajeDeError(error)}</strong>
      {titulo && <span>{mensajeDeError(error)}</span>}
      <div>
        <button type="button" class="boton secundario chico" onClick={alReintentar}>
          {textos.general.reintentar}
        </button>
      </div>
    </div>
  );
}

// ---------- Foto ----------

export function Foto({
  ds,
  id,
  alt = '',
  inicial,
  clase = '',
  children,
}: {
  ds: DataStore;
  id?: string;
  alt?: string;
  inicial?: string;
  clase?: string;
  children?: ComponentChildren;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let vigente = true;
    setUrl('');
    if (id)
      ds.urlFoto(id)
        .then((u) => vigente && setUrl(u))
        .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [id]);
  return (
    <div class={`foto ${clase}`}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span class="inicial" aria-hidden="true">
          {inicial?.charAt(0) ?? ''}
        </span>
      )}
      {children}
    </div>
  );
}

// ---------- Campos ----------

export function ErrorDeCampo({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span class="error-campo" id={id}>
      <IconoAlerta /> {error}
    </span>
  );
}

/** Resumen de errores arriba del formulario: "Revisá 2 datos" con links a cada campo. */
export function ResumenErrores({
  titulo,
  errores,
  pie,
  refFoco,
}: {
  titulo: string;
  errores: { campo: string; texto: string }[];
  pie?: string;
  refFoco?: { current: HTMLDivElement | null };
}) {
  if (!errores.length) return null;
  return (
    <div class="alerta error" role="alert" tabIndex={-1} ref={refFoco}>
      <strong>{titulo}</strong>
      <ul>
        {errores.map((e) => (
          <li key={e.campo}>
            <a href={`#${e.campo}`} class="chico">
              {e.texto}
            </a>
          </li>
        ))}
      </ul>
      {pie && <span class="chico suave">{pie}</span>}
    </div>
  );
}

export function Cantidad({
  valor,
  min = 1,
  max,
  alCambiar,
  alQuitar,
  etiqueta,
}: {
  valor: number;
  min?: number;
  max: number;
  alCambiar: (n: number) => void;
  /** Si se pasa, el "−" en el mínimo quita el producto en vez de quedar deshabilitado. */
  alQuitar?: () => void;
  etiqueta?: string;
}) {
  const quita = !!alQuitar && valor <= min;
  return (
    <div class="cantidad" role="group" aria-label={etiqueta ?? 'Cantidad'}>
      <button
        type="button"
        aria-label={quita ? textos.tienda.quitar : textos.tienda.restar}
        disabled={valor <= min && !alQuitar}
        onClick={() => (quita ? alQuitar!() : alCambiar(valor - 1))}
      >
        −
      </button>
      <output class="num" aria-live="polite">
        {valor}
      </output>
      <button type="button" aria-label={textos.tienda.sumar} disabled={valor >= max} onClick={() => alCambiar(valor + 1)}>
        +
      </button>
    </div>
  );
}

// ---------- Diálogo ----------

/** Diálogo nativo (<dialog>): maneja el foco y la tecla Escape. */
export function Dialogo({
  abierto,
  alCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ComponentChildren;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      class="dialogo"
      aria-labelledby="dialogo-titulo"
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && alCerrar()}
    >
      {abierto && (
        <div class="pila">
          <h2 id="dialogo-titulo">{titulo}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

// ---------- Aviso flotante (toast) ----------

interface Toast {
  id: number;
  texto: string;
  accion?: { texto: string; fn: () => void };
}
let toastActual: Toast | null = null;
const oyentesToast = new Set<(t: Toast | null) => void>();
let temporizador: ReturnType<typeof setTimeout> | undefined;

export function mostrarToast(texto: string, accion?: Toast['accion'], duracion = accion ? 8000 : 4000) {
  toastActual = { id: Date.now(), texto, accion };
  oyentesToast.forEach((fn) => fn(toastActual));
  clearTimeout(temporizador);
  temporizador = setTimeout(cerrarToast, duracion);
}

export function cerrarToast() {
  toastActual = null;
  oyentesToast.forEach((fn) => fn(null));
}

export function ZonaToast() {
  const [t, setT] = useState<Toast | null>(toastActual);
  useEffect(() => {
    oyentesToast.add(setT);
    return () => void oyentesToast.delete(setT);
  }, []);
  return (
    <div class="toast-zona" role="status" aria-live="polite">
      {t && (
        <div class="toast" key={t.id}>
          <span>{t.texto}</span>
          {t.accion && (
            <button
              type="button"
              onClick={() => {
                cerrarToast();
                t.accion!.fn();
              }}
            >
              {t.accion.texto}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Portapapeles ----------

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Mueve el foco al título al cambiar de pantalla (para lectores de pantalla y teclado). */
export function useFocoTitulo(dep: unknown) {
  const ref = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    ref.current?.focus();
  }, [dep]);
  return ref;
}
