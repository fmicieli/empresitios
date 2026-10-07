// Carrito: líneas con stock en vivo, avisos de agotado y subtotal.

import { useEffect, useState } from 'preact/hooks';
import { useCarrito } from '@compartido/carrito/carrito';
import { Cantidad, ErrorCarga, Foto, useCarga } from '@compartido/componentes/basicos';
import { etiquetaVariante, evaluarCarrito, formatoPrecio } from '@compartido/datos/reglas';
import { textos } from '@compartido/textos/textos';
import { carrito, ds } from '../lib/contexto';
import { Marco } from './Marco';

const t = textos.tienda;
export const CLAVE_AVISO_CARRITO = 'aviso-carrito';

export default function CarritoPagina() {
  const items = useCarrito(carrito);
  const datos = useCarga(() => ds.getProductos(), [], ds);
  const [aviso, setAviso] = useState('');

  // Si venimos de "Datos" porque algo se agotó al enviar, lo avisamos.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE_AVISO_CARRITO)) {
        setAviso(t.carritoCambio);
        sessionStorage.removeItem(CLAVE_AVISO_CARRITO);
      }
    } catch {
      /* no pasa nada */
    }
  }, []);

  const lineas = datos.datos ? evaluarCarrito(items, datos.datos) : [];
  const hayProblemas = lineas.some((l) => l.estado !== 'ok');
  const subtotal = lineas.reduce((a, l) => a + l.subtotal, 0);

  return (
    <Marco>
      <div class="pila lectura" style={{ paddingTop: '16px' }}>
        <h1>{t.tuCarrito}</h1>
        {aviso && (
          <div class="alerta" role="alert">
            <strong>{aviso}</strong>
          </div>
        )}

        {!items.length ? (
          <>
            <p class="suave">{t.carritoVacio}</p>
            <a class="boton secundario" href="/">
              {t.verProductos}
            </a>
          </>
        ) : datos.cargando && !datos.datos ? (
          <div aria-busy="true" aria-label={textos.general.cargando} class="pila">
            {items.map((_, i) => (
              <div key={i} class="esqueleto" style={{ height: '96px' }} />
            ))}
          </div>
        ) : datos.error && !datos.datos ? (
          <ErrorCarga error={datos.error} alReintentar={datos.recargar} />
        ) : (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {lineas.map((l, i) => {
                const p = l.producto;
                const problema = l.estado !== 'ok';
                const nombre = p?.nombre ?? 'Producto';
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
                            max={Math.max(l.libre, 1)}
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
            {hayProblemas ? (
              <>
                <button type="button" class="boton" disabled>
                  {t.continuar}
                </button>
                <p class="chico suave">{t.resolverAntes}</p>
              </>
            ) : (
              <a class="boton" href="/datos/">
                {t.continuar}
              </a>
            )}
          </>
        )}
      </div>
    </Marco>
  );
}
