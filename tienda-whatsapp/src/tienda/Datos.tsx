// Datos del comprador → Enviando → (error con "Intentar de nuevo") → Pedido registrado.

import { useEffect, useRef, useState } from 'preact/hooks';
import { unidades, useCarrito } from '@compartido/carrito/carrito';
import { ErrorDeCampo, mensajeDeError, ResumenErrores, useCarga } from '@compartido/componentes/basicos';
import { IconoChat, IconoCheck } from '@compartido/componentes/iconos';
import { evaluarCarrito, formatoPrecio, normalizarWhatsapp } from '@compartido/datos/reglas';
import type { Entrega, Pago } from '@compartido/datos/tipos';
import { textos } from '@compartido/textos/textos';
import { mensajePedido } from '@compartido/whatsapp/mensajes';
import { borradorComprador, carrito, config, ds, ultimoPedido, whatsappTienda } from '../lib/contexto';
import { CLAVE_AVISO_CARRITO } from './CarritoPagina';
import { Marco } from './Marco';

const t = textos.tienda;

interface Formulario {
  nombre: string;
  whatsapp: string;
  entrega: Entrega;
  direccion: string;
  localidad: string;
  pago: Pago;
  nota: string;
}
type Campo = 'nombre' | 'whatsapp' | 'direccion' | 'localidad';

const VACIO: Formulario = { nombre: '', whatsapp: '', entrega: 'envio', direccion: '', localidad: '', pago: 'transferencia', nota: '' };

function validar(f: Formulario): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  if (!f.nombre.trim()) e.nombre = t.errNombre;
  if (!normalizarWhatsapp(f.whatsapp).ok) e.whatsapp = t.errWhatsapp;
  if (f.entrega === 'envio') {
    if (!f.direccion.trim()) e.direccion = t.errDireccion;
    if (!f.localidad.trim()) e.localidad = t.errLocalidad;
  }
  return e;
}

const ORDEN: Campo[] = ['nombre', 'whatsapp', 'direccion', 'localidad'];
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Enviando({ paso, horas }: { paso: number; horas: number }) {
  const pasos = [t.paso1, t.paso2(horas), t.paso3];
  return (
    <div class="pila centrado lectura" style={{ margin: '48px auto 0' }} role="status" aria-busy="true">
      <div class="girando" />
      <h1>{t.enviandoTitulo}</h1>
      <p class="suave">{t.enviandoAyuda}</p>
      <ol class="pasos">
        {pasos.map((texto, i) => (
          <li key={i}>
            <span class={`punto ${i < paso ? 'hecho' : i === paso ? 'ahora' : ''}`}>{i < paso && <IconoCheck />}</span>
            <span>
              {texto}
              {i < paso && <span class="sr"> (listo)</span>}
            </span>
          </li>
        ))}
      </ol>
      <p class="chico suave">{t.noCierres}</p>
    </div>
  );
}

export default function Datos() {
  const items = useCarrito(carrito);
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getConfig()]), [], ds);
  const [productos, cfg] = datos.datos ?? [undefined, undefined];

  const [f, setF] = useState<Formulario>(() => ({ ...VACIO, ...(borradorComprador.leer<Formulario>() ?? {}) }));
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [intento, setIntento] = useState(false);
  const [estado, setEstado] = useState<'formulario' | 'enviando' | 'error'>('formulario');
  const [paso, setPaso] = useState(0);
  const [errorEnvio, setErrorEnvio] = useState<unknown>(null);
  const refResumen = useRef<HTMLDivElement>(null);

  useEffect(() => borradorComprador.guardar(f), [f]);

  // Si el carrito está vacío no hay nada que completar.
  useEffect(() => {
    if (!items.length && estado === 'formulario') location.replace('/carrito/');
  }, [items.length]);

  const wa = normalizarWhatsapp(f.whatsapp);
  const lineas = productos ? evaluarCarrito(items, productos) : [];
  const total = lineas.reduce((a, l) => a + l.subtotal, 0);
  const horas = cfg?.horasReserva ?? 24;

  function cambiar<K extends keyof Formulario>(k: K, v: Formulario[K]) {
    const nuevo = { ...f, [k]: v };
    setF(nuevo);
    if (intento) setErrores(validar(nuevo));
  }

  function aCarrito() {
    try {
      sessionStorage.setItem(CLAVE_AVISO_CARRITO, '1');
    } catch {
      /* no pasa nada */
    }
    location.assign('/carrito/');
  }

  async function enviar() {
    setEstado('enviando');
    setPaso(0);
    window.scrollTo(0, 0);
    try {
      // 1. Revisamos que haya stock (con datos frescos).
      const frescos = await ds.getProductos();
      if (evaluarCarrito(items, frescos).some((l) => l.estado !== 'ok')) return aCarrito();
      setPaso(1);

      // 2. Reservamos: el servidor vuelve a verificar, numera y reserva de una sola vez.
      const normal = normalizarWhatsapp(f.whatsapp);
      const r = await ds.crearPedido({
        items,
        comprador: {
          nombre: f.nombre.trim(),
          whatsapp: f.whatsapp.trim(),
          whatsappNormalizado: normal.ok ? normal.diezDigitos : '',
          entrega: f.entrega,
          direccion: f.entrega === 'envio' ? f.direccion.trim() : '',
          localidad: f.entrega === 'envio' ? f.localidad.trim() : '',
          pago: f.pago,
          nota: f.nota.trim(),
        },
      });
      if (!r.ok) return aCarrito();
      setPaso(2);

      // 3. Preparamos el mensaje.
      const mensaje = mensajePedido(r.pedido);
      ultimoPedido.guardar({ pedido: r.pedido, horasReserva: r.horasReserva, mensaje, whatsapp: whatsappTienda(), abierto: false });
      await espera(500);
      carrito.vaciar();
      borradorComprador.borrar();
      location.assign('/pedido/');
    } catch (e) {
      setErrorEnvio(e);
      setEstado('error');
    }
  }

  function alEnviar(ev: Event) {
    ev.preventDefault();
    setIntento(true);
    const e = validar(f);
    setErrores(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => refResumen.current?.focus());
      return;
    }
    enviar();
  }

  if (estado === 'enviando') {
    return (
      <Marco>
        <Enviando paso={paso} horas={horas} />
      </Marco>
    );
  }

  if (estado === 'error') {
    return (
      <Marco>
        <div class="pila lectura" style={{ paddingTop: '32px' }}>
          <div class="alerta error" role="alert">
            <h1 style={{ fontSize: 'var(--titulo-2)' }}>{t.errorEnvioTitulo}</h1>
            <span>{mensajeDeError(errorEnvio)}</span>
            <span class="suave chico">{t.errorEnvioAyuda}</span>
          </div>
          <button type="button" class="boton" onClick={enviar}>{textos.general.reintentar}</button>
          <button type="button" class="boton secundario" onClick={() => setEstado('formulario')}>{textos.general.volver}</button>
        </div>
      </Marco>
    );
  }

  const listaErrores = ORDEN.filter((c) => errores[c]).map((c) => ({ campo: `f-${c}`, texto: errores[c]! }));
  const desc = (c: Campo, extra?: string) => [errores[c] ? `e-${c}` : '', extra ?? ''].filter(Boolean).join(' ') || undefined;

  return (
    <Marco>
      <form class="pila lectura" style={{ paddingTop: '16px' }} noValidate onSubmit={alEnviar}>
        <h1>{t.tusDatos}</h1>
        <ResumenErrores titulo={t.revisa(listaErrores.length)} errores={listaErrores} refFoco={refResumen} />

        <div class="campo">
          <label for="f-nombre">{t.nombre}</label>
          <input
            id="f-nombre"
            class="entrada"
            type="text"
            autocomplete="name"
            value={f.nombre}
            aria-invalid={!!errores.nombre}
            aria-describedby={desc('nombre')}
            onInput={(e) => cambiar('nombre', (e.target as HTMLInputElement).value)}
          />
          <ErrorDeCampo id="e-nombre" error={errores.nombre} />
        </div>

        <div class="campo">
          <label for="f-whatsapp">{t.whatsapp}</label>
          <input
            id="f-whatsapp"
            class="entrada"
            type="tel"
            inputMode="tel"
            autocomplete="tel"
            value={f.whatsapp}
            aria-invalid={!!errores.whatsapp}
            aria-describedby={desc('whatsapp', 'a-whatsapp')}
            onInput={(e) => cambiar('whatsapp', (e.target as HTMLInputElement).value)}
          />
          <ErrorDeCampo id="e-whatsapp" error={errores.whatsapp} />
          <span id="a-whatsapp" aria-live="polite">
            {wa.ok ? <span class="ok-campo">{t.whatsappQuedo(wa.paraMostrar)}</span> : <span class="ayuda">{t.whatsappAyuda}</span>}
          </span>
        </div>

        <fieldset>
          <legend>{t.comoRecibis}</legend>
          <div class="pila-chica">
            <label class="opcion">
              <input type="radio" name="entrega" value="envio" checked={f.entrega === 'envio'} onChange={() => cambiar('entrega', 'envio')} />
              <span class="pila-chica" style={{ gap: 0 }}>
                <strong>{t.envio}</strong>
                <span class="suave chico">{t.envioAyuda}</span>
              </span>
            </label>
            <label class="opcion">
              <input type="radio" name="entrega" value="retiro" checked={f.entrega === 'retiro'} onChange={() => cambiar('entrega', 'retiro')} />
              <span class="pila-chica" style={{ gap: 0 }}>
                <strong>{t.retiro}</strong>
                <span class="suave chico">{t.retiroAyuda(config.direccionLocal)}</span>
              </span>
            </label>
          </div>
        </fieldset>

        {f.entrega === 'envio' && (
          <>
            <div class="campo">
              <label for="f-direccion">{t.direccion}</label>
              <input
                id="f-direccion"
                class="entrada"
                type="text"
                autocomplete="street-address"
                placeholder={t.direccionEjemplo}
                value={f.direccion}
                aria-invalid={!!errores.direccion}
                aria-describedby={desc('direccion')}
                onInput={(e) => cambiar('direccion', (e.target as HTMLInputElement).value)}
              />
              <ErrorDeCampo id="e-direccion" error={errores.direccion} />
            </div>
            <div class="campo">
              <label for="f-localidad">{t.localidad}</label>
              <input
                id="f-localidad"
                class="entrada"
                type="text"
                autocomplete="address-level2"
                value={f.localidad}
                aria-invalid={!!errores.localidad}
                aria-describedby={desc('localidad')}
                onInput={(e) => cambiar('localidad', (e.target as HTMLInputElement).value)}
              />
              <ErrorDeCampo id="e-localidad" error={errores.localidad} />
            </div>
          </>
        )}

        <fieldset>
          <legend>{t.comoPagas}</legend>
          <div class="dos-botones">
            <label class="opcion">
              <input type="radio" name="pago" value="transferencia" checked={f.pago === 'transferencia'} onChange={() => cambiar('pago', 'transferencia')} />
              {t.transferencia}
            </label>
            <label class="opcion">
              <input type="radio" name="pago" value="efectivo" checked={f.pago === 'efectivo'} onChange={() => cambiar('pago', 'efectivo')} />
              {t.efectivo}
            </label>
          </div>
        </fieldset>

        <div class="campo">
          <label for="f-nota">
            {t.nota} <span class="opcional">{t.opcional}</span>
          </label>
          <textarea
            id="f-nota"
            class="entrada"
            rows={2}
            placeholder={t.notaEjemplo}
            value={f.nota}
            onInput={(e) => cambiar('nota', (e.target as HTMLTextAreaElement).value)}
          />
        </div>

        <div class="panel">
          <strong class="num">{productos ? t.resumen(unidades(items), formatoPrecio(total)) : textos.general.cargando}</strong>
        </div>

        <button type="submit" class="boton" disabled={!productos}>
          <IconoChat /> {t.enviarPedido}
        </button>
        <p class="chico suave">{config.textoPrivacidad}</p>
      </form>
    </Marco>
  );
}
