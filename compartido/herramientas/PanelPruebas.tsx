// Herramientas de prueba: solo existen con la capa de datos "local".
// No forman parte del producto: sirven para probar los flujos.

import { useEffect, useState } from 'preact/hooks';
import { Dialogo, mostrarToast } from '../componentes/basicos';
import type { DataStoreLocal } from '../datos';
import type { AjustesPrueba } from '../datos/local';
import { normalizarWhatsapp } from '../datos/reglas';
import { textos } from '../textos/textos';

const t = textos.pruebas;

export function PanelPruebas({
  ds,
  abierto,
  alCerrar,
  horasActuales,
  alRestaurar,
}: {
  ds: DataStoreLocal;
  abierto: boolean;
  alCerrar: () => void;
  horasActuales: number;
  alRestaurar?: () => void;
}) {
  const h = ds.herramientas;
  const [aj, setAj] = useState<AjustesPrueba>(() => h.getAjustes());
  const [wa, setWa] = useState(() => {
    const n = h.getAjustes().whatsappTienda;
    return n ? n.replace(/^549/, '') : '';
  });
  const [horas, setHoras] = useState(String(horasActuales));
  const [error, setError] = useState('');
  useEffect(() => setHoras(String(horasActuales)), [horasActuales]);
  const pendientes = abierto ? h.contarPendientes() : 0;

  function guardar() {
    let numero = '';
    if (wa.trim()) {
      const r = normalizarWhatsapp(wa);
      if (!r.ok) {
        setError(textos.tienda.errWhatsapp);
        return;
      }
      numero = r.internacional;
    }
    const hs = parseInt(horas, 10);
    if (hs >= 1 && hs <= 72) h.setHorasReserva(hs);
    h.setAjustes({ ...aj, whatsappTienda: numero });
    setError('');
    alCerrar();
    mostrarToast(t.guardado);
  }

  return (
    <Dialogo abierto={abierto} alCerrar={alCerrar} titulo={t.titulo}>
      <p class="chico suave">{t.ayuda}</p>
      <div class="campo">
        <label for="t-wa">{t.whatsapp}</label>
        <input
          id="t-wa"
          class="entrada"
          type="tel"
          inputMode="tel"
          placeholder="Ej.: 11 5555 0000"
          value={wa}
          aria-invalid={!!error}
          aria-describedby="t-wa-ayuda"
          onInput={(e) => setWa((e.target as HTMLInputElement).value)}
        />
        {error && <span class="error-campo">{error}</span>}
        <span id="t-wa-ayuda" class="ayuda">{t.whatsappAyuda}</span>
      </div>
      <div class="campo">
        <label for="t-horas">{t.horas}</label>
        <input id="t-horas" class="entrada" type="number" min={1} max={72} value={horas} onInput={(e) => setHoras((e.target as HTMLInputElement).value)} />
      </div>
      <div class="campo">
        <label for="t-demora">{t.demora}</label>
        <select id="t-demora" class="entrada" value={aj.demora} onChange={(e) => setAj({ ...aj, demora: (e.target as HTMLSelectElement).value as AjustesPrueba['demora'] })}>
          <option value="realista">{t.demoraRealista}</option>
          <option value="ninguna">{t.demoraNinguna}</option>
        </select>
      </div>
      <div class="campo">
        <label for="t-error">{t.error}</label>
        <select
          id="t-error"
          class="entrada"
          value={aj.proximoError ?? ''}
          onChange={(e) => {
            const v = (e.target as HTMLSelectElement).value;
            setAj({ ...aj, proximoError: v ? (v as AjustesPrueba['proximoError']) : null });
          }}
        >
          <option value="">{t.errorNinguno}</option>
          <option value="sinConexion">{t.errorSinConexion}</option>
          <option value="servidor">{t.errorServidor}</option>
        </select>
      </div>
      <button type="button" class="boton chico" onClick={guardar}>{t.guardar}</button>
      <hr class="separador" />
      <button
        type="button"
        class="boton secundario chico"
        disabled={!pendientes}
        onClick={() => {
          h.adelantarReloj(horasActuales + 0.1);
          alCerrar();
          mostrarToast(t.adelantado(horasActuales));
        }}
      >
        {t.adelantar(horasActuales, pendientes)}
      </button>
      <button
        type="button"
        class="boton secundario chico"
        onClick={async () => {
          await h.restaurar();
          alRestaurar?.();
          alCerrar();
          mostrarToast(t.restaurado);
        }}
      >
        {t.restaurar}
      </button>
      <button type="button" class="enlace" onClick={alCerrar}>{textos.general.cerrar}</button>
    </Dialogo>
  );
}
