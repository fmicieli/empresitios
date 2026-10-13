// Carrito y "Tus datos" en una sola pantalla (D-14): productos con stock en vivo y,
// al lado (escritorio) o debajo (celular), el formulario con "Enviar pedido por WhatsApp".

import { useEffect, useState } from 'preact/hooks';
import { useCarrito } from '@compartido/carrito/carrito';
import { Cantidad, ErrorCarga, Foto, useCarga } from '@compartido/componentes/basicos';
import { IconoCheck } from '@compartido/componentes/iconos';
import { etiquetaVariante, evaluarCarrito, formatoPrecio, lugarEnPedido } from '@compartido/datos/reglas';
import { textos } from '@compartido/textos/textos';
import { carrito, ds, ultimoPedido } from '../lib/contexto';
import { FormularioComprador, type PedidoEnviado } from './FormularioComprador';
import { Marco } from './Marco';

const t = textos.tienda;

function Enviado({ p }: { p: PedidoEnviado }) {
  return (
    <div class="pila lectura" style={{ paddingTop: '24px' }}>
      <h1>{t.tuCarrito}</h1>
      <div class="panel pila" role="status">
        <p class="fila" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <span class="punto-ok chico-ok" aria-hidden="true">
            <IconoCheck />
          </span>
          <span>{t.listo(p.numero)}</span>
        </p>
        {p.sinNumeroDePrueba ? (
          <p class="aviso">{textos.pruebas.sinNumero}</p>
        ) : (
          <a class="enlace chico" href={p.link} target="_blank" rel="noopener">
            {t.siNoSeAbrio}
          </a>
        )}
      </div>
      <a class="boton secundario" href="/">
        {t.seguirComprando}
      </a>
    </div>
  );
}

export default function CarritoPagina() {
  const items = useCarrito(carrito);
  const datos = useCarga(() => Promise.all([ds.getProductos(), ds.getConfig()]), [], ds);
  const [productos, cfg] = datos.datos ?? [undefined, undefined];
  const [enviado, setEnviado] = useState(() => ultimoPedido.leer<PedidoEnviado>());
  const [aviso, setAviso] = useState('');

  // Si después de enviar vuelve a cargar productos, el aviso de "¡Listo!" ya no corresponde.
  useEffect(() => {
    if (items.length && enviado) {
      ultimoPedido.borrar();
      setEnviado(null);
    }
  }, [items.length]);

  if (enviado && !items.length) {
    return (
      <Marco>
        <Enviado p={enviado} />
      </Marco>
    );
  }

  const lineas = productos ? evaluarCarrito(items, productos) : [];
  const hayProblemas = lineas.some((l) => l.estado !== 'ok');
  const subtotal = lineas.reduce((a, l) => a + l.subtotal, 0);

  return (
    <Marco>
      <div class="pila" style={{ paddingTop: '16px' }}>
        <h1>{t.tuCarrito}</h1>
        {aviso && (
          <div class="alerta error" role="alert">
            <strong>{aviso}</strong>
          </div>
        )}

        {!items.length ? (
          <div class="pila lectura">
            <p class="suave">{t.carritoVacio}</p>
            <a class="boton secundario" href="/" style={{ alignSelf: 'flex-start' }}>
              {t.verProductos}
            </a>
          </div>
        ) : datos.cargando && !productos ? (
          <div aria-busy="true" aria-label={textos.general.cargando} class="pila lectura">
            {items.map((_, i) => (
              <div key={i} class="esqueleto" style={{ height: '96px' }} />
            ))}
          </div>
        ) : datos.error && !productos ? (
          <ErrorCarga error={datos.error} alReintentar={datos.recargar} />
        ) : (
          <div class="carrito-y-datos">
            <section class="pila" aria-label={t.tuCarrito}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lineas.map((l, i) => {
                  const p = l.producto;
                  const problema = l.estado !== 'ok';
                  const nombre = p?.nombre ?? 'Producto';
                  // Topes contra pedidos falsos (D-16): el "+" se deshabilita al llegar al máximo por pedido.
                  const maxPorTope = l.item.cantidad + lugarEnPedido(items, l.item.productoId, cfg);
                  const llegoAlTope = !problema && maxPorTope < l.libre && l.item.cantidad >= maxPorTope;
                  return (
                    <li key={`${l.item.productoId}|${l.item.color}|${l.item.talle}`} class="linea-carrito">
                      <div class="miniatura-carrito">
                        <Foto ds={ds} id={p?.fotos[0]} inicial={nombre} />
                      </div>
                      <div class="pila-chica" style={{ flex: 1, minWidth: 0 }}>
                        <div class="fila-extremos" style={{ alignItems: 'flex-start' }}>
                          <strong class={problema ? 'suave' : ''}>{nombre}</strong>
                          <span class={`precio ${problema ? 'suave tachado' : ''}`}>
                            {formatoPrecio((p?.precio ?? 0) * l.item.cantidad)}
                          </span>
                        </div>
                        {etiquetaVariante(l.item.color, l.item.talle) && (
                          <span class="suave chico">{etiquetaVariante(l.item.color, l.item.talle)}</span>
                        )}
                        {problema && (
                          <div class="alerta" role="alert">
                            <strong>
                              {l.estado === 'agotado' ? t.agotado : l.estado === 'parcial' ? t.parcial(l.libre) : t.noDisponible}
                            </strong>
                            <span class="chico">
                              {l.estado === 'agotado'
                                ? t.agotadoAyuda
                                : l.estado === 'parcial'
                                  ? t.parcialAyuda
                                  : t.noDisponibleAyuda}
                            </span>
                            <div class="fila">
                              {l.estado !== 'noDisponible' && p && (
                                <a class="enlace" href={`/producto/?id=${encodeURIComponent(p.id)}`}>
                                  {t.verOtrasOpciones}
                                </a>
                              )}
                              <button type="button" class="enlace" onClick={() => carrito.quitar(i)}>
                                {t.quitar}
                              </button>
                            </div>
                          </div>
                        )}
                        {l.estado !== 'noDisponible' && l.estado !== 'agotado' && (
                          <div class="fila-extremos">
                            <Cantidad
                              valor={l.item.cantidad}
                              max={Math.max(Math.min(l.libre, maxPorTope), 1)}
                              alCambiar={(n) => carrito.cambiarCantidad(i, n)}
                              alQuitar={() => carrito.quitar(i)}
                              etiqueta={`Cantidad de ${nombre}`}
                            />
                            {!problema && (
                              <button type="button" class="enlace" onClick={() => carrito.quitar(i)}>
                                {t.quitar}
                              </button>
                            )}
                          </div>
                        )}
                        {llegoAlTope && <span class="suave chico">{t.topeUnidades}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div class="fila-extremos total">
                <span>{t.subtotal}</span>
                <span class="num">{formatoPrecio(subtotal)}</span>
              </div>
              <p class="suave chico">{t.avisoEnvio}</p>
            </section>
            <FormularioComprador
              items={items}
              productos={productos!}
              horas={cfg?.horasReserva ?? 24}
              hayProblemas={hayProblemas}
              alCambioStock={() => {
                setAviso(t.carritoCambio);
                datos.recargar();
                window.scrollTo(0, 0);
              }}
              alEnviado={(p) => {
                ultimoPedido.guardar(p);
                setEnviado(p);
                window.scrollTo(0, 0);
              }}
            />
          </div>
        )}
      </div>
    </Marco>
  );
}
