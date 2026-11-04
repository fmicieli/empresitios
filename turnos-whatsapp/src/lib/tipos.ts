// Forma de la configuración y del contenido de cada clienta (docs/landing/02-modelo-de-contenido.md).
// Viven acá, en la plantilla, y no en config/, para que los archivos de cada clienta tengan solo sus datos.

import type { Dia } from '../../../compartido/whatsapp/turnos';

/** Una foto de turnos-whatsapp/fotos/. `alt: ''` = decorativa. */
export interface FotoContenido {
  archivo: string;
  alt: string;
  /** Punto de recorte, como en CSS: 'center', 'top', '50% 30%'… (por defecto, centro). */
  recorte?: string;
}

export interface ConfigSitio {
  nombre: string;
  /** Cómo la saludan en WhatsApp: "Hola Valen, …". */
  nombreCorto: string;
  profesional: string;
  /** Opcional: va en el pie (por ejemplo, "Matrícula 12794"). */
  matricula?: string;
  /** Texto corto para buscadores y al compartir el link. */
  descripcion: string;
  /** Link público, por ejemplo "https://estudiov.com.ar". Vacío mientras no tenga dominio. */
  urlSitio: string;
  /**
   * WhatsApp para turnos, en cualquier formato argentino (se normaliza, D-02).
   * Vacío solo en un sitio de ejemplo: WhatsApp pide elegir a quién mandar el mensaje.
   */
  whatsapp: string;
  /** Usuario de Instagram, sin @. Vacío = no se muestra. */
  instagram: string;
  /** Vacío = no se muestra (D-36). */
  mail: string;
  /**
   * Imagen que se ve al compartir el link (WhatsApp, Instagram…): JPG o PNG de 1200 × 630 px en public/.
   * Solo se usa si hay urlSitio, porque los que leen la vista previa piden la dirección completa.
   */
  imagenCompartir?: string;
  /** Logo en public/ (por ejemplo "logo.svg"). Sin logo se muestra el nombre. */
  logo?: { archivo: string; alt: string; alto?: number };
  colorMarca: string;
  colorSobreMarca: string;
  secciones: {
    sobreMi: boolean;
    propuesta: boolean;
    llamado: boolean;
    formacion: boolean;
    antesDespues: boolean;
    dondeAtiendo: boolean;
    turnos: boolean;
  };
  inicio: {
    /** Video de fondo solo en computadora (D-36): mp4 sin audio en public/. */
    video?: { archivo: string };
  };
  /** Sitio de ejemplo: franja arriba, sin indexar en buscadores. */
  ejemplo: boolean;
  creditos?: { texto: string; url?: string };
}

export interface Servicio {
  /** Corto, sin espacios ni tildes: se usa en el link #id. */
  id: string;
  nombre: string;
  descripcion: string;
  /** "Ver más": párrafos. */
  detalle?: string[];
  duracion?: string;
  /** Número sin puntos: 95000. */
  precio?: number;
  /** Texto de la etiqueta, por ejemplo "Tratamiento estrella". */
  destacado?: string;
  /** Ids de lugares. Vacío o sin poner = todos. */
  lugares?: string[];
  foto: FotoContenido;
}

export interface Lugar {
  id: string;
  nombre: string;
  zona?: string;
  /** Vacía = "Se da al reservar", sin link a Maps. */
  direccion?: string;
  dias: { dia: Dia; horario: string }[];
  /** Opcional, texto chico debajo: "Desde noviembre". */
  nota?: string;
  foto?: FotoContenido;
}

export interface Contenido {
  inicio: { frase: string; texto: string; foto: FotoContenido };
  sobreMi: { titulo: string; parrafos: string[]; foto?: FotoContenido };
  propuesta: { titulo: string; puntos: { titulo: string; texto: string }[] };
  servicios: { titulo: string; nota?: string; lista: Servicio[] };
  llamado: {
    titulo: string;
    texto: string;
    pasos?: string[];
    precio?: number;
    etiquetaPrecio?: string;
    boton: string;
    /** Puede usar {nombreCorto}. */
    mensaje: string;
    foto?: FotoContenido;
  };
  formacion: {
    titulo: string;
    lista: { titulo: string; institucion?: string; año?: string; enCurso?: boolean; nota?: string }[];
    certificados?: FotoContenido[];
  };
  antesDespues: {
    titulo: string;
    aviso: string;
    lista: { antes: FotoContenido; despues: FotoContenido; texto?: string; permisoEscrito: boolean }[];
  };
  dondeAtiendo: { titulo: string; lugares: Lugar[] };
  turnos: { titulo: string; pasos: string[]; sena?: string; cancelacion?: string; antes?: string };
  contacto: { titulo: string; texto?: string };
}
