// Arma, al compilar, todo lo que la página necesita a partir de la configuración y el contenido:
// links de WhatsApp de cada botón, opciones de lugar y la agenda semanal ("Mi semana").
// Función pura: se prueba en turnos.test.ts.

import { linkWhatsapp, normalizarWhatsapp } from '../../../compartido/datos/reglas';
import { DIAS, mensajeGeneral, mensajePropio, mensajeReserva, textoDias, type Dia } from '../../../compartido/whatsapp/turnos';
import type { ConfigSitio, Contenido, Lugar, Servicio } from './tipos';

export interface OpcionLugar {
  etiqueta: string;
  href: string;
}

export interface ServicioListo extends Servicio {
  /** Link sin lugar: funciona sin JavaScript. */
  href: string;
  /** Dos o más: se abre "¿Dónde te queda mejor?". Vacío: el link va directo. */
  opciones: OpcionLugar[];
  /** Link de "Me da igual". */
  hrefCualquiera: string;
}

export interface FilaSemana {
  dia: Dia;
  lugar: string;
  horario: string;
}

/** Número para wa.me. Vacío en un sitio de ejemplo: WhatsApp pide elegir a quién mandarlo. */
export function numeroWhatsapp(config: ConfigSitio): string {
  const n = normalizarWhatsapp(config.whatsapp);
  return n.ok ? n.internacional : '';
}

/** "Amaia Wellness Studio, San Fernando · martes y jueves" */
export function etiquetaLugar(l: Lugar): string {
  const nombre = [l.nombre, l.zona].filter(Boolean).join(', ');
  const dias = textoDias(l.dias.map((d) => d.dia));
  return dias ? `${nombre} · ${dias}` : nombre;
}

export function lugaresDeServicio(s: Servicio, lugares: Lugar[]): Lugar[] {
  if (!s.lugares?.length) return lugares;
  return lugares.filter((l) => s.lugares!.includes(l.id));
}

export function prepararServicios(config: ConfigSitio, contenido: Contenido): ServicioListo[] {
  const numero = numeroWhatsapp(config);
  const lugares = config.secciones.dondeAtiendo ? contenido.dondeAtiendo.lugares : [];
  const lista = [...contenido.servicios.lista].sort((a, b) => Number(!!b.destacado) - Number(!!a.destacado));
  return lista.map((s) => {
    const suyos = lugaresDeServicio(s, lugares);
    const aMensaje = (l: Lugar) => ({ nombre: l.nombre, zona: l.zona, dias: l.dias.map((d) => d.dia) });
    const unico = suyos.length === 1 ? suyos[0] : undefined;
    const link = (texto: string) => linkWhatsapp(numero, texto);
    return {
      ...s,
      // Con un solo lugar, el mensaje lo nombra sin preguntar.
      href: link(mensajeReserva(config.nombreCorto, s, unico ? { lugar: aMensaje(unico) } : {})),
      opciones:
        suyos.length > 1
          ? suyos.map((l) => ({
              etiqueta: etiquetaLugar(l),
              href: link(mensajeReserva(config.nombreCorto, s, { lugar: aMensaje(l) })),
            }))
          : [],
      hrefCualquiera: link(mensajeReserva(config.nombreCorto, s, { cualquiera: true })),
    };
  });
}

export function hrefGeneral(config: ConfigSitio): string {
  return linkWhatsapp(numeroWhatsapp(config), mensajeGeneral(config.nombreCorto));
}

export function hrefLlamado(config: ConfigSitio, contenido: Contenido): string {
  return linkWhatsapp(numeroWhatsapp(config), mensajePropio(contenido.llamado.mensaje, config.nombreCorto));
}

/** "Mi semana": una fila por día y lugar, ordenada de lunes a domingo. */
export function semana(lugares: Lugar[]): FilaSemana[] {
  const filas = lugares.flatMap((l) =>
    l.dias.map((d) => ({ dia: d.dia, lugar: [l.nombre, l.zona].filter(Boolean).join(', '), horario: d.horario })),
  );
  return filas.sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia));
}

/** Link de Google Maps a partir de la dirección (sin claves ni mapa insertado, D-36). */
export function linkMaps(direccion: string): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion);
}

export function mayuscula(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
