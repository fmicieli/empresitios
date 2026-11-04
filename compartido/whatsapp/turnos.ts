// Mensajes de WhatsApp de la plantilla de turnos (docs/landing/03-textos-y-mensajes.md, D-36).
// Funciones puras: se prueban en turnos.test.ts.

import { formatoPrecio } from '../datos/reglas';

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export type Dia = (typeof DIAS)[number];

/** ["martes", "jueves"] → "martes y jueves"; tres o más: "lunes, miércoles y viernes". Ordena por día de la semana. */
export function textoDias(dias: readonly string[]): string {
  const unicos = [...new Set(dias)].sort((a, b) => DIAS.indexOf(a as Dia) - DIAS.indexOf(b as Dia));
  if (unicos.length <= 1) return unicos[0] ?? '';
  return unicos.slice(0, -1).join(', ') + ' y ' + unicos[unicos.length - 1];
}

/** "(1 h 30 · $ 95.000)", "(1 h)", "($ 65.000)" o "" si no tiene ninguno. */
export function detalleServicio(duracion?: string, precio?: number): string {
  const partes = [duracion?.trim(), precio ? formatoPrecio(precio) : ''].filter(Boolean);
  return partes.length ? ` (${partes.join(' · ')})` : '';
}

export interface LugarMensaje {
  nombre: string;
  zona?: string;
  dias: readonly string[];
}

/** "Amaia Wellness Studio, San Fernando (martes y jueves)" */
export function textoLugar(l: LugarMensaje): string {
  const nombre = [l.nombre, l.zona].filter(Boolean).join(', ');
  const dias = textoDias(l.dias);
  return dias ? `${nombre} (${dias})` : nombre;
}

export interface ServicioMensaje {
  nombre: string;
  duracion?: string;
  precio?: number;
}

/**
 * Mensaje para reservar un servicio.
 * - `lugar`: el elegido (o el único del servicio).
 * - `cualquiera`: eligió "Me da igual".
 * - Sin ninguno de los dos: el mensaje sin lugar (sin JavaScript).
 */
export function mensajeReserva(
  nombreCorto: string,
  s: ServicioMensaje,
  opciones: { lugar?: LugarMensaje; cualquiera?: boolean } = {},
): string {
  const donde = opciones.lugar ? ` en ${textoLugar(opciones.lugar)}` : '';
  const igual = !opciones.lugar && opciones.cualquiera ? ' Me queda bien cualquier lugar.' : '';
  return `Hola ${nombreCorto}, quiero reservar un turno para ${s.nombre}${detalleServicio(s.duracion, s.precio)}${donde}.${igual} ¿Qué días tenés disponibles?`;
}

/** Botón general (encabezado, inicio y flotante). */
export function mensajeGeneral(nombreCorto: string): string {
  return `Hola ${nombreCorto}, quiero consultar por un turno.`;
}

/** Mensaje propio de un servicio con llamado propio: reemplaza {nombreCorto}. */
export function mensajePropio(plantilla: string, nombreCorto: string): string {
  return plantilla.replaceAll('{nombreCorto}', nombreCorto);
}
