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
    colorMarca: string;
    colorSobreMarca: string;
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
    logo: '',
    colorMarca: '#000000',
    colorSobreMarca: '#ffffff',
  },
  datos: 'local',
  googleClientId: '',
  turnstileSiteKey: '',
  clave: 'tienda-modelo',
};

export default config;
