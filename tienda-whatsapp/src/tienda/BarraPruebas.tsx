// Franja superior del modo de prueba: accesos a tienda/admin y herramientas.

import { useEffect, useState } from 'preact/hooks';
import { IconoHerramienta } from '@compartido/componentes/iconos';
import { esLocal } from '@compartido/datos';
import { PanelPruebas } from '@compartido/herramientas/PanelPruebas';
import { textos } from '@compartido/textos/textos';
import { carrito, ds } from '../lib/contexto';

export default function BarraPruebas() {
  const [abierto, setAbierto] = useState(false);
  const [horas, setHoras] = useState(24);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    if (abierto)
      ds.getConfig()
        .then((c) => setHoras(c.horasReserva))
        .catch(() => {});
  }, [abierto]);

  if (!esLocal(ds)) return null;
  const enAdmin = location.pathname.startsWith('/admin');
  return (
    <div class="barra-pruebas" role="region" aria-label="Modo de prueba">
      <div class="barra-pruebas-interior">
        <strong>Modo de prueba</strong>
        <a href="/" aria-current={!enAdmin ? 'page' : undefined}>
          {textos.pruebas.irTienda}
        </a>
        <a href="/admin/" aria-current={enAdmin ? 'page' : undefined}>
          {textos.pruebas.irAdmin}
        </a>
        <button
          type="button"
          class="enlace"
          style={{ marginLeft: 'auto', padding: 0 }}
          onClick={() => {
            setVuelta((v) => v + 1);
            setAbierto(true);
          }}
        >
          <IconoHerramienta /> {textos.pruebas.boton}
        </button>
      </div>
      <PanelPruebas
        key={vuelta}
        ds={ds}
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        horasActuales={horas}
        alRestaurar={() => carrito.vaciar()}
      />
    </div>
  );
}
