// CONFIGURACIÓN DE LA CLIENTA — datos fijos del sitio (CLAUDE.md, regla 2; docs/landing/02-modelo-de-contenido.md).
// El contenido que cambia seguido (servicios, precios, lugares, textos) va en contenido.ts.
// Esta es la marca de ejemplo de la plantilla: "Brisa · Masajes y bienestar" (ficticia).

import type { ConfigSitio } from '../src/lib/tipos';

const config: ConfigSitio = {
  nombre: 'Brisa · Masajes y bienestar',
  nombreCorto: 'Lu',
  profesional: 'Lucía Ejemplo',
  matricula: 'Masoterapeuta',
  descripcion: 'Masajes descontracturantes, relajantes y drenaje linfático en Palermo y Belgrano. Reservá tu turno por WhatsApp.',
  urlSitio: '',

  // Vacío porque es un ejemplo: al tocar "Reservar turno", WhatsApp pide elegir a quién mandarlo.
  whatsapp: '',
  instagram: 'brisa.ejemplo',
  mail: '',

  logo: { archivo: 'logo.svg', alt: 'Brisa · Masajes y bienestar', alto: 40 },
  colorMarca: '#2c2c2c',
  colorSobreMarca: '#f5f5f5',

  secciones: {
    sobreMi: true,
    propuesta: true,
    llamado: true,
    formacion: true,
    antesDespues: false,
    dondeAtiendo: true,
    turnos: true,
  },

  inicio: {},

  ejemplo: true,
  creditos: { texto: 'Sitio de ejemplo de Empresitios' },
};

export default config;
