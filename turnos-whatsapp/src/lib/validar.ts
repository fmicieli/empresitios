// Controles al compilar (docs/landing/02-modelo-de-contenido.md, "Controles al compilar").
// Función pura: recibe la configuración, el contenido y los archivos que hay; devuelve errores (frenan) y avisos.
// Se prueba en turnos.test.ts.

import { normalizarWhatsapp } from '../../../compartido/datos/reglas';
import { DIAS } from '../../../compartido/whatsapp/turnos';
import type { ConfigSitio, Contenido, FotoContenido } from './tipos';

export interface Resultado {
  errores: string[];
  avisos: string[];
}

/** Palabras que prometen resultados: la publicidad de estética y salud tiene reglas (04-estructura-y-fases.md, Riesgos). */
const PROMESAS = [
  'cura',
  'curar',
  'elimina',
  'eliminar',
  'garantizado',
  'garantizada',
  'garantiza',
  '100 %',
  '100%',
  'definitivo',
  'definitiva',
  'milagro',
];

/** Marcas de "falta completar" que pueden quedar del brief. */
const PENDIENTE = /\[completar\]/i;

/** ¿Quedó algún "[completar]" en el contenido? Mientras quede, el sitio no se indexa en buscadores (D-39). */
export function tienePendientes(contenido: Contenido): boolean {
  return PENDIENTE.test(JSON.stringify(contenido));
}

export function validar(config: ConfigSitio, contenido: Contenido, fotos: Set<string>, publicos: Set<string>): Resultado {
  const errores: string[] = [];
  const avisos: string[] = [];
  const s = config.secciones;

  // WhatsApp
  if (config.whatsapp) {
    if (!normalizarWhatsapp(config.whatsapp).ok) {
      errores.push(
        `El WhatsApp "${config.whatsapp}" de sitio.config.ts no es un celular argentino válido. Ejemplo: 11 5555-0000.`,
      );
    }
  } else if (!config.ejemplo) {
    errores.push('Falta el WhatsApp en sitio.config.ts. Sin él no llegan los pedidos de turno.');
  }

  // Fotos
  const revisarFoto = (f: FotoContenido | undefined, donde: string, obligatoria = false) => {
    if (!f) {
      if (obligatoria) errores.push(`Falta la foto de ${donde}.`);
      return;
    }
    if (!fotos.has(f.archivo))
      errores.push(`No está la foto "${f.archivo}" (${donde}) en turnos-whatsapp/fotos/. Revisá el nombre.`);
    if (typeof f.alt !== 'string')
      errores.push(`La foto "${f.archivo}" (${donde}) no tiene "alt". Si es decorativa, poné alt: ''.`);
  };
  revisarFoto(contenido.inicio.foto, 'Inicio', true);
  if (s.sobreMi) revisarFoto(contenido.sobreMi.foto, 'Sobre mí');
  if (s.llamado) revisarFoto(contenido.llamado.foto, contenido.llamado.titulo);
  contenido.servicios.lista.forEach((sv) => revisarFoto(sv.foto, `servicio "${sv.nombre}"`, true));
  if (s.formacion) contenido.formacion.certificados?.forEach((c, i) => revisarFoto(c, `certificado ${i + 1}`));
  if (s.dondeAtiendo) contenido.dondeAtiendo.lugares.forEach((l) => revisarFoto(l.foto, `lugar "${l.nombre}"`));

  if (config.logo && !publicos.has(config.logo.archivo)) {
    errores.push(`No está el logo "${config.logo.archivo}" en turnos-whatsapp/public/.`);
  }
  if (config.inicio.video && !publicos.has(config.inicio.video.archivo)) {
    errores.push(`No está el video "${config.inicio.video.archivo}" en turnos-whatsapp/public/.`);
  }

  if (config.imagenCompartir) {
    if (!publicos.has(config.imagenCompartir))
      errores.push(`No está la imagen para compartir "${config.imagenCompartir}" en turnos-whatsapp/public/.`);
    else if (!/\.(jpe?g|png)$/i.test(config.imagenCompartir))
      errores.push(`La imagen para compartir tiene que ser JPG o PNG (WhatsApp no muestra otras).`);
    if (!config.urlSitio)
      avisos.push(
        'Hay imagen para compartir pero falta urlSitio en sitio.config.ts: sin la dirección, no se ve en la vista previa del link.',
      );
  }

  // Servicios y lugares
  if (!contenido.servicios.lista.length) errores.push('No hay servicios en contenido.ts.');
  const idsLugar = new Set(contenido.dondeAtiendo.lugares.map((l) => l.id));
  const idsServicio = new Set<string>();
  for (const sv of contenido.servicios.lista) {
    if (!/^[a-z0-9-]+$/.test(sv.id))
      errores.push(`El id "${sv.id}" del servicio "${sv.nombre}" solo puede tener minúsculas, números y guiones.`);
    if (idsServicio.has(sv.id)) errores.push(`Hay dos servicios con el id "${sv.id}".`);
    idsServicio.add(sv.id);
    for (const l of sv.lugares ?? []) {
      if (!idsLugar.has(l)) errores.push(`El servicio "${sv.nombre}" pide el lugar "${l}", que no está en dondeAtiendo.lugares.`);
    }
    if (sv.precio !== undefined && (!Number.isFinite(sv.precio) || sv.precio <= 0)) {
      errores.push(`El precio de "${sv.nombre}" tiene que ser un número sin puntos, por ejemplo 95000.`);
    }
  }
  for (const l of contenido.dondeAtiendo.lugares) {
    for (const d of l.dias) {
      if (!DIAS.includes(d.dia)) errores.push(`El día "${d.dia}" de "${l.nombre}" no existe. Usá: ${DIAS.join(', ')}.`);
    }
  }

  // Antes y después: solo con permiso escrito (D-36)
  if (s.antesDespues) {
    contenido.antesDespues.lista.forEach((p, i) => {
      if (p.permisoEscrito !== true) {
        errores.push(
          `Antes y después, par ${i + 1}: falta permisoEscrito: true. Solo se publica con permiso escrito de la persona.`,
        );
      }
      revisarFoto(p.antes, `antes y después ${i + 1} (antes)`, true);
      revisarFoto(p.despues, `antes y después ${i + 1} (después)`, true);
    });
  }

  // Avisos: promesas y datos sin completar en todos los textos del contenido
  const textos: { donde: string; texto: string }[] = [];
  const juntar = (valor: unknown, donde: string) => {
    if (typeof valor === 'string') textos.push({ donde, texto: valor });
    else if (Array.isArray(valor)) valor.forEach((v, i) => juntar(v, `${donde} ${i + 1}`));
    else if (valor && typeof valor === 'object') {
      for (const [k, v] of Object.entries(valor)) if (k !== 'archivo' && k !== 'id') juntar(v, `${donde} › ${k}`);
    }
  };
  juntar(contenido, 'contenido');
  for (const { donde, texto } of textos) {
    const bajo = texto.toLowerCase();
    const promesa = PROMESAS.find((p) =>
      new RegExp(`(^|[^a-záéíóúñ])${p.replace(/[%]/g, '\\%')}($|[^a-záéíóúñ])`, 'i').test(bajo),
    );
    if (promesa) avisos.push(`"${promesa}" en ${donde}: suena a promesa de resultado. Revisalo con la clienta.`);
    if (PENDIENTE.test(texto)) avisos.push(`Falta completar ${donde}.`);
  }

  return { errores, avisos };
}
