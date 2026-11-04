// DATOS DE PRUEBA — copia fija de la marca de ejemplo (Brisa) para las pruebas automáticas.
// No se usa en la página: así las pruebas pasan igual en el repo de cada clienta, que cambia config/.

import type { ConfigSitio } from '../tipos';

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
