// Admin del comercio: ingreso, navegación y módulos.
// Es una mini-aplicación independiente (D-06): se puede montar en el sitio
// (Fase 1) o servir desde Google (si así lo decide la Fase 2).

import { useEffect, useState } from 'preact/hooks';
import { mensajeDeError, useCarga, ZonaToast } from '../../componentes/basicos';
import { IconoChat, IconoTienda } from '../../componentes/iconos';
import { linkWhatsapp } from '../../datos/reglas';
import type { DataStore } from '../../datos/tipos';
import { textos } from '../../textos/textos';
import { BotonGoogle } from './BotonGoogle';
import type { ConfigAdmin, ContextoAdmin, ModuloAdmin } from './tipos';
import { irA, useEsEscritorio, useRuta } from './utiles';

const t = textos.admin;

function Ingreso({ config, ds, alEntrar }: { config: ConfigAdmin; ds: DataStore; alEntrar: () => void }) {
  const simulado = !ds.sesion;
  const [estado, setEstado] = useState<'esperando' | 'verificando'>('esperando');
  const [error, setError] = useState('');

  async function recibir(credencial: string) {
    setEstado('verificando');
    setError('');
    try {
      await ds.sesion!.iniciar(credencial);
    } catch (e) {
      setError(mensajeDeError(e));
      setEstado('esperando');
    }
  }

  return (
    <main class="ingreso">
      <div class="ingreso-logo" aria-hidden="true">
        {config.nombre.charAt(0)}
      </div>
      <div class="pila-chica">
        <h1>{t.ingresoTitulo}</h1>
        <p class="suave">{t.ingresoSubtitulo}</p>
      </div>
      {simulado ? (
        <button type="button" class="boton" onClick={alEntrar}>
          {t.entrarSimulado}
        </button>
      ) : !config.googleClientId ? (
        <p class="estado-error" role="alert">
          {t.faltaConfigurarGoogle}
        </p>
      ) : estado === 'verificando' ? (
        <p role="status">{t.verificandoCuenta}</p>
      ) : (
        <BotonGoogle clientId={config.googleClientId} alRecibir={recibir} alFallar={() => setError(t.googleNoCargo)} />
      )}
      {error && (
        <p class="estado-error" role="alert">
          {error}
        </p>
      )}
      <p class="chico suave">{simulado ? t.ingresoSimuladoAyuda : t.ingresoAyuda}</p>
      <p class="chico suave">{t.tipInicio}</p>
      {config.whatsappSoporte && (
        <a
          class="enlace"
          style={{ justifyContent: 'center' }}
          href={linkWhatsapp(config.whatsappSoporte)}
          target="_blank"
          rel="noopener"
        >
          <IconoChat /> {t.ayudaWhatsapp}
        </a>
      )}
    </main>
  );
}

function Contador({ n }: { n: number | undefined }) {
  if (!n) return null;
  return <span class="contador num">{n}</span>;
}

export function AdminApp({ ds, config, modulos }: { ds: DataStore; config: ConfigAdmin; modulos: ModuloAdmin[] }) {
  const claveSesion = `${config.clave}:admin-sesion`;
  const [sesion, setSesion] = useState(() => {
    if (ds.sesion) return ds.sesion.correo() !== null;
    try {
      return sessionStorage.getItem(claveSesion) === '1';
    } catch {
      return false;
    }
  });

  // Con datos reales, la sesión la maneja la capa de datos: si el pase de Google vence, vuelve al ingreso.
  useEffect(() => ds.sesion?.alCambiar(() => setSesion(ds.sesion!.correo() !== null)), [ds]);
  const ruta = useRuta();
  const esEscritorio = useEsEscritorio();
  const actual = modulos.find((m) => m.id === ruta[0]) ?? modulos[0];

  // Contadores (por ejemplo, pedidos pendientes) que se actualizan solos.
  const contadores = useCarga(() => Promise.all(modulos.map((m) => (m.contador ? m.contador(ds) : Promise.resolve(0)))), [], ds);

  useEffect(() => {
    document.title = `${actual.titulo} · ${config.nombre}`;
  }, [actual.id]);

  if (!sesion) {
    return (
      <Ingreso
        config={config}
        ds={ds}
        alEntrar={() => {
          try {
            sessionStorage.setItem(claveSesion, '1');
          } catch {
            /* no pasa nada */
          }
          setSesion(true);
        }}
      />
    );
  }

  const ctx: ContextoAdmin = { ds, config, ir: irA, esEscritorio };
  const urlTienda = config.urlTienda || '/';
  const enlaces = modulos.map((m, i) => ({ m, n: contadores.datos?.[i] }));

  const salir = ds.sesion && (
    <button type="button" class="enlace boton-salir" onClick={() => ds.sesion!.cerrar()}>
      {t.salir}
    </button>
  );

  const contenido = (
    <main class="admin-contenido" id="contenido">
      <actual.Pantalla ruta={ruta.slice(1)} ctx={ctx} />
    </main>
  );

  if (esEscritorio) {
    return (
      <div class="admin admin-escritorio">
        <nav class="admin-nav-lateral" aria-label={t.navegacion}>
          <span class="nombre-comercio">{config.nombre}</span>
          {enlaces.map(({ m, n }) => (
            <a key={m.id} href={`#/${m.id}`} aria-current={m === actual ? 'page' : undefined}>
              <m.Icono /> <span style={{ flex: 1 }}>{m.titulo}</span> <Contador n={n} />
            </a>
          ))}
          <a class="abajo" href={urlTienda} target="_blank" rel="noopener">
            <IconoTienda /> {t.verMiTienda}
          </a>
          {salir}
        </nav>
        {contenido}
        <ZonaToast />
      </div>
    );
  }

  return (
    <div class="admin">
      <header class="admin-encabezado">
        <div class="admin-encabezado-interior">
          <strong>{config.nombre}</strong>
          <a class="enlace" href={urlTienda} target="_blank" rel="noopener">
            <IconoTienda tam={18} /> {t.verMiTienda}
          </a>
          {salir}
        </div>
      </header>
      {contenido}
      <nav class="admin-nav-inferior" aria-label={t.navegacion}>
        {enlaces.map(({ m, n }) => (
          <a key={m.id} href={`#/${m.id}`} aria-current={m === actual ? 'page' : undefined}>
            <span class="fila" style={{ gap: '6px' }}>
              <m.Icono /> <Contador n={n} />
            </span>
            {m.titulo}
          </a>
        ))}
      </nav>
      <ZonaToast />
    </div>
  );
}
