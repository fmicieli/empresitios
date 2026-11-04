// DATOS DE PRUEBA — copia fija del contenido de ejemplo (Brisa) para las pruebas automáticas.
// No se usa en la página: así las pruebas pasan igual en el repo de cada clienta, que cambia config/.

import type { Contenido } from '../tipos';

const contenido: Contenido = {
  inicio: {
    frase: 'Un rato para vos, sin apuro.',
    texto: 'Soy Lucía, masoterapeuta. Atiendo en Palermo y Belgrano con masajes pensados para lo que tu cuerpo necesita ese día.',
    foto: { archivo: 'inicio.jpg', alt: 'Camilla de masajes con toallas dobladas y una planta al lado' },
  },

  sobreMi: {
    titulo: 'Sobre mí',
    parrafos: [
      'Hace diez años que trabajo con masajes. Empecé en un spa de hotel y hoy atiendo en dos espacios chicos, tranquilos y con turnos sin superposición.',
      'Antes de empezar te pregunto cómo llegás: si dormiste mal, si te duele algo, si preferís silencio o charlar. Con eso armo la sesión.',
      'Me formé en masoterapia y sigo sumando cursos de drenaje y reflexología.',
    ],
    foto: { archivo: 'sobre-mi.jpg', alt: 'Lucía sonriendo en su consultorio' },
  },

  propuesta: {
    titulo: 'Cómo trabajo',
    puntos: [
      { titulo: 'Sin apuro', texto: 'Cada turno tiene su tiempo y un margen entre uno y otro.' },
      { titulo: 'A tu medida', texto: 'La presión y el ritmo se ajustan a lo que necesitás ese día.' },
      { titulo: 'Espacios tranquilos', texto: 'Luz baja, música suave y toallas calentitas.' },
    ],
  },

  servicios: {
    titulo: 'Masajes',
    nota: 'Todos incluyen una charla corta antes de empezar.',
    lista: [
      {
        id: 'descontracturante',
        nombre: 'Masaje descontracturante',
        descripcion: 'Para espalda, cuello y hombros cargados.',
        detalle: [
          'Trabajo con presión media a firme sobre las zonas tensas. Ideal si pasás muchas horas sentada o con la compu.',
        ],
        duracion: '1 h',
        precio: 30000,
        destacado: 'El más pedido',
        foto: { archivo: 'descontracturante.jpg', alt: 'Manos haciendo un masaje en la espalda' },
      },
      {
        id: 'relajante',
        nombre: 'Masaje relajante',
        descripcion: 'Movimientos largos y suaves para bajar un cambio.',
        duracion: '1 h',
        precio: 28000,
        foto: { archivo: 'relajante.jpg', alt: 'Aceites y velas sobre una bandeja de madera' },
      },
      {
        id: 'drenaje',
        nombre: 'Drenaje linfático',
        descripcion: 'Técnica suave que ayuda a desinflamar piernas y abdomen.',
        duracion: '50 min',
        foto: { archivo: 'drenaje.jpg', alt: 'Piernas cubiertas con una toalla sobre la camilla' },
      },
      {
        id: 'reflexologia',
        nombre: 'Reflexología',
        descripcion: 'Masaje en los pies que relaja todo el cuerpo.',
        precio: 20000,
        lugares: ['palermo'],
        foto: { archivo: 'reflexologia.jpg', alt: 'Pies apoyados sobre una toalla blanca' },
      },
      {
        id: 'piedras',
        nombre: 'Masaje con piedras calientes',
        descripcion: 'El calor de las piedras afloja los músculos más profundos.',
        duracion: '1 h 15',
        precio: 35000,
        lugares: ['belgrano'],
        foto: { archivo: 'piedras.jpg', alt: 'Piedras negras ordenadas sobre una espalda' },
      },
    ],
  },

  llamado: {
    titulo: 'Gift card',
    texto: 'Regalá un masaje. Elegís el tratamiento y te mando la tarjeta digital para que se la des a quien quieras.',
    pasos: [
      'Me escribís con el masaje que querés regalar.',
      'Pagás por transferencia.',
      'Te mando la tarjeta en PDF, válida por 3 meses.',
    ],
    precio: 28000,
    etiquetaPrecio: 'Desde',
    boton: 'Quiero regalar un masaje',
    mensaje: 'Hola {nombreCorto}, quiero regalar un masaje con una gift card. ¿Cómo seguimos?',
    foto: { archivo: 'gift-card.jpg', alt: 'Tarjeta de regalo con un moño sobre una mesa' },
  },

  formacion: {
    titulo: 'Formación',
    lista: [
      { titulo: 'Masoterapeuta', institucion: 'Instituto de Ejemplo', año: '2016' },
      { titulo: 'Drenaje linfático manual', institucion: 'Escuela de Ejemplo', año: '2019' },
      { titulo: 'Reflexología podal', institucion: 'Centro de Ejemplo', enCurso: true },
    ],
    certificados: [
      { archivo: 'certificado-1.jpg', alt: 'Certificado de masoterapeuta, Instituto de Ejemplo, 2016' },
      { archivo: 'certificado-2.jpg', alt: 'Certificado de drenaje linfático manual, Escuela de Ejemplo, 2019' },
    ],
  },

  // Apagada en config (D-36): solo con permiso escrito de cada persona.
  antesDespues: { titulo: 'Resultados', aviso: 'Fotos publicadas con permiso de cada persona.', lista: [] },

  dondeAtiendo: {
    titulo: 'Dónde atiendo',
    lugares: [
      {
        id: 'palermo',
        nombre: 'Mi consultorio',
        zona: 'Palermo',
        direccion: 'Calle de Ejemplo 1234, Palermo, CABA',
        dias: [
          { dia: 'lunes', horario: '10 a 19 h' },
          { dia: 'miércoles', horario: '10 a 19 h' },
        ],
        foto: { archivo: 'palermo.jpg', alt: 'Consultorio con camilla blanca y ventana grande' },
      },
      {
        id: 'belgrano',
        nombre: 'Estudio Raíz',
        zona: 'Belgrano',
        dias: [
          { dia: 'jueves', horario: '14 a 20 h' },
          { dia: 'sábado', horario: '9 a 13 h' },
        ],
        nota: 'Los sábados, desde diciembre.',
        foto: { archivo: 'belgrano.jpg', alt: 'Sala con camilla y lámpara de luz cálida' },
      },
    ],
  },

  turnos: {
    titulo: 'Turnos y seña',
    pasos: [
      'Me escribís por WhatsApp con el masaje y el lugar.',
      'Te paso los días y horarios libres.',
      'La seña confirma el turno.',
    ],
    sena: 'La seña es de $ 10.000 por transferencia, dentro de las 24 h.',
    cancelacion: 'Si avisás con 24 h, la seña se pasa a otro turno. Sin aviso, se pierde.',
    antes: 'Vení con ropa cómoda. No hace falta traer nada.',
  },

  contacto: {
    titulo: 'Contacto',
    texto: 'Escribime por WhatsApp para turnos o consultas. Respondo de lunes a sábado.',
  },
};

export default contenido;
