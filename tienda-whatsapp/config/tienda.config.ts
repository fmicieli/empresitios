// CONFIGURACIÓN DEL CLIENTE — el único archivo que se cambia por comercio
// (junto con los tokens de estilo y el contenido). Ver CLAUDE.md, regla 2,
// y docs/07-decisiones.md (D-01): las horas de reserva viven en la planilla.

export interface ConfigTienda {
  /** Nombre que se ve en el encabezado y en el título de la página. */
  nombre: string;
  /** Descripción corta para buscadores y al compartir el link. */
  descripcion: string;
  /**
   * Link público de la tienda, por ejemplo "https://tiendamodelo.com.ar", para "Copiar link de mi tienda".
   * Vacío = el link desde donde se abre el admin.
   */
  url: string;
  /** Imagen para la vista previa al compartir el link, en public/ (1200 × 630 px, PNG o JPG). Vacío = sin imagen. */
  imagenCompartir: string;
  /**
   * WhatsApp de la tienda en formato internacional, solo números: 549 + código de área + número.
   * Vacío solo en la demo: quien la prueba carga su número en "Herramientas de prueba".
   */
  whatsapp: string;
  /** WhatsApp de quien mantiene el sitio (ayuda del admin y "¿Falta una categoría?"). */
  whatsappSoporte: string;
  direccionLocal: string;
  horarios: string;
  redes: { nombre: string; url: string }[];
  textoPrivacidad: string;
  estilo: {
    /** Logo en public/ (por ejemplo "/logo.svg"). Vacío = se muestra el nombre. */
    logo: string;
    /** En computadora: true = logo al centro y categorías a la izquierda; false = logo a la izquierda (D-27). En el celular siempre va al centro. */
    logoCentrado: boolean;
    colorMarca: string;
    colorSobreMarca: string;
  };
  /** Portada de la tienda. */
  inicio: {
    /** Banner de arriba de todo. Imagen en public/ (horizontal, por ejemplo 1200 × 900 px). Vacío = solo texto. */
    banner: {
      imagen: string;
      titulo: string;
      texto: string;
      /** Botón del banner. Link vacío = sin botón. Ejemplo: "/?cat=Mujer" (una categoría) o "/producto/?id=p1". */
      boton: { texto: string; link: string };
      /**
       * Banner de fotos que pasan con un fundido (D-29). Con al menos una foto, reemplaza al banner de arriba:
       * el título de arriba queda oculto (solo para lectores de pantalla y buscadores) y no hay botón.
       * Cada foto en public/: "escritorio" 4:3 (por ejemplo 1600 × 1200) y "celular", más liviana (por ejemplo 900 px de ancho).
       * "alt": qué se ve en la foto, para quien usa lector de pantalla.
       * "titulo" y "texto" (opcionales): van sobre "fondo", un color sacado del borde izquierdo de la foto (#rrggbb).
       *   Con texto: en computadora el banner es 21:9, el texto a la izquierda y la foto entera a la derecha;
       *   en el celular, la foto en 16:10 y el texto debajo. Sin texto: la foto ocupa todo (4:3 y 16:10).
       * "tinta" (opcional, #rrggbb): color del texto. Vacío = blanco u oscuro, el que mejor se lea sobre el fondo.
       *   Al compilar se avisa si "tinta" no se lee bien sobre "fondo".
       * Vacío = banner de texto de arriba.
       */
      fotos: {
        escritorio: string;
        celular: string;
        alt: string;
        titulo?: string;
        texto?: string;
        fondo?: string;
        tinta?: string;
      }[];
    };
  };
  /** De dónde salen los datos: "local" (prueba, en el navegador) o "appsScript" (Google, ver docs/09). */
  datos: 'local' | 'appsScript';
  /** ID de cliente de Google para "Iniciar sesión con Google" en el admin (público, no es secreto). */
  googleClientId: string;
  /** Clave de sitio de Turnstile, el anti-robots de Cloudflare (pública). Vacío = sin anti-robots. */
  turnstileSiteKey: string;
  /** Identificador interno para lo que se guarda en el navegador. Sin espacios. */
  clave: string;
}

const config: ConfigTienda = {
  nombre: 'Tienda Modelo',
  descripcion: 'Ropa y accesorios. Elegí, pedí y coordiná por WhatsApp.',
  url: '',
  imagenCompartir: '/compartir.png',
  whatsapp: '',
  whatsappSoporte: '',
  direccionLocal: 'Calle Modelo 123, CABA',
  horarios: 'Lun a Vie de 10 a 19 · Sáb de 10 a 14',
  redes: [{ nombre: 'Instagram', url: 'https://instagram.com/' }],
  textoPrivacidad: 'Usamos estos datos solo para gestionar tu pedido. (Texto pendiente de revisión legal.)',
  estilo: {
    logo: '/logo.svg',
    logoCentrado: false,
    colorMarca: '#2c2c2c',
    colorSobreMarca: '#f5f5f5',
  },
  inicio: {
    banner: {
      imagen: '/banner.png',
      titulo: 'Nueva temporada',
      texto: 'Ropa cómoda para todos los días. Elegí, pedí y coordiná por WhatsApp.',
      boton: { texto: 'Ver lo nuevo de Mujer', link: '/?cat=Mujer' },
      fotos: [],
    },
  },
  datos: 'local',
  googleClientId: '',
  turnstileSiteKey: '',
  clave: 'tienda-modelo',
};

export default config;
