# Plantilla 2 · Landing de servicios con reserva por WhatsApp — arranque

Este documento es el punto de partida (02/11/2026). Lo escribió la sesión de la tienda. Desde acá sigue la sesión nueva, que arranca la Fase 0 y lo completa.

## Qué es

Una landing de una sola página para profesionales que dan servicios con turno: estética, cosmiatría, uñas, peluquería, masajes, nutrición, etc. Muestra quién es la profesional, sus servicios y dónde atiende. Cada servicio tiene un botón "Reservar turno" que abre WhatsApp con un mensaje armado para ese servicio.

Primera clienta: **Estudio V · Skin Lab** (Valentina Osácar, cosmetóloga y cosmiatra). Su material está en un .zip que Flor adjunta en la sesión; no va en este repositorio.

## Decisiones ya tomadas por Flor (02/11/2026)

1. **El contenido lo carga Flor a mano** (servicios, precios, textos), cuando la clienta le pide cambios. No hay admin ni Google ni base de datos. El costo para la clienta es solo el dominio.
2. **La reserva termina en WhatsApp.** Fase 1: el botón abre WhatsApp con el servicio elegido. Fase siguiente de la plantilla: un formulario corto antes (nombre, día y franja preferidos) que arma un mensaje más completo.
3. **Cada servicio tiene** nombre, foto, descripción y botón de reservar. Propuesta de Claude, a confirmar: **duración y precio opcionales**, y un servicio puede marcarse como "destacado". Estudio V publica las dos cosas.

## Reglas que siguen valiendo

Las del `CLAUDE.md`, con estas adaptaciones:

- El contenido nunca va en el código: va en un archivo de contenido por cliente.
- Configuración por cliente en un solo lugar.
- El estilo se cambia con tokens.
- Accesibilidad básica.
- Mobile-first.
- Sin datos personales en URLs ni en registros.
- Los errores se arreglan en la plantilla y se pasan al repo del cliente (`docs/12-repos-de-clientes.md`).

Se reutiliza de `compartido/`:

- tokens y componentes del sistema de diseño (D-21);
- el chequeo de contraste al compilar;
- el armado de links de WhatsApp (`linkWhatsapp` en `compartido/datos/reglas.ts`);
- los íconos.

Se publica en Cloudflare Workers, como la tienda (solo archivos, sin puente ni secretos).

**Para resolver en la Fase 0:** el `CLAUDE.md` habla de la plantilla 1. Hay que adaptarlo para que valga para las dos plantillas, sin cambiar decisiones sin consultar a Flor.

## Secciones que salen del brief de Estudio V (propuesta genérica para la plantilla)

| Sección | Qué tiene | ¿Opcional? |
|---|---|---|
| Inicio | frase principal, foto de la profesional o del espacio, botón "Reservar turno" | no |
| Sobre mí | versión corta en el inicio y versión completa | sí |
| Propuesta / valores | 3 o 4 puntos cortos | sí |
| Servicios | tarjetas: nombre, foto, descripción, duración y precio (opcionales), "destacado", botón de reservar | no |
| Servicio online u otro llamado | servicio con su propio texto de botón y mensaje (Estudio V: "Quiero mi rutina", $20.000) | sí |
| Formación | lista de títulos y cursos (institución, año) e imágenes de certificados | sí |
| Dónde atiendo | agenda semanal: día, lugar, dirección (o "se da al reservar"), horario, link a Google Maps, foto | sí |
| Turnos y seña | cómo se reserva, seña y política de cancelación | sí |
| Contacto | WhatsApp, Instagram, mail; botón flotante de WhatsApp en toda la página | no |

## Mensajes de WhatsApp (borrador)

- **Reservar un servicio:** "Hola {nombre corto}, quiero reservar un turno para {servicio} ({duración} · {precio}). ¿Qué días tenés disponibles?" Sin duración ni precio, va solo el nombre.
- **Botón general** (inicio y flotante): "Hola {nombre corto}, quiero consultar por un turno."
- **Servicio con llamado propio** (rutina online): texto configurable por servicio.
- Un servicio puede tener días o lugares específicos. Queda para la Fase 0 decidir si el mensaje dice dónde atiende.

## Lo que se vio en el material de Estudio V

**Bien:**

- brief completo con textos para copiar;
- logo en todas sus versiones (PNG y SVG);
- paleta;
- fotos de la profesional y de los tres espacios;
- certificados con datos ya tapados;
- placas "Mi semana" como referencia de estilo.

**A resolver:**

1. **Fotos con el nombre cambiado** en el zip:
   - `Amaia/amaia-logo-recepcion.jpg` es la bandeja de productos con roller de jade;
   - `Productos/booster-pdrn-nad.jpg` es el logo de Amaia;
   - `Productos/set-skincare.jpg` es la selfie de Valen;
   - `Valen/valen-selfie.jpg` es el frasco del booster.

   Hay que renombrarlas al usarlas.
2. **Contraste de la paleta:**
   - texto blanco sobre terracota (`#B07A5A`) da 3,6:1, y terracota sobre crema 3,4:1. Para texto normal hace falta 4,5:1.
   - Propuesta: botones en canela (`#8A5A42`, 5,4:1 con crema) y terracota solo para detalles y títulos grandes. El chequeo de contraste lo va a marcar al compilar.
   - Lo decide Flor.
3. **Videos:** los tres tienen sonido. Para usarlos de fondo hay que sacarles el audio y que no se reproduzcan con "reducir movimiento". Ojo con el peso en un Android de gama media: conviene una imagen fija en el celular.
4. **Logo en SVG:** usa texto con fuentes. Para la web conviene el PNG o un SVG con el texto pasado a curvas.
5. **Fuentes:** Cormorant Garamond (títulos) y Jost (texto). Se instalan con Fontsource, como Nunito Sans.

**Falta que mande la clienta** (en el brief dice [completar]):

- institución y año de dermatocosmiatría;
- año del curso de ácido glicólico y otros cursos;
- monto, medio, plazo y política de cancelación de la seña;
- medio de pago de la rutina online;
- PDF de rutina de ejemplo;
- webs de referencia;
- fotos de tratamientos sobre modelo;
- fotos de antes y después.

## Riesgos para avisarle a Flor

- **Antes y después:** son imágenes de salud de otras personas. Hace falta permiso escrito de cada paciente para publicarlas (Ley 25.326). Mejor sin cara o con la cara tapada.
- **Promesas de resultados:** el brief está bien medido ("mejora la textura", "estimula"). Evitar frases como "elimina" o "cura", porque la publicidad de estética y salud tiene reglas.
- **Microneedling:** conviene que Valentina confirme que su matrícula la habilita para ese procedimiento. Claude no lo verificó.
- **Mail personal en la web:** puede recibir spam. Alternativa: solo WhatsApp e Instagram.

## Fases propuestas

- **Fase 0:**
  - especificación de la plantilla 2 en `docs/landing/` (secciones, modelo de contenido, textos, mensajes, estructura de carpetas);
  - cuestionario para próximas clientas;
  - `CLAUDE.md` adaptado.

  Esperar OK de Flor.
- **Fase 1:** la plantilla en `landing-servicios/` (nombre a confirmar), con una marca ficticia y contenido de ejemplo. Revisión en localhost.
- **Fase 2:** el repo de Estudio V (privado, lo crea Flor), con su contenido, fotos y estilo. Revisión en localhost.
- **Fase 3:** publicación en Cloudflare (y dominio, si quiere).
- **Después:** formulario corto antes de WhatsApp. Opcional: contenido editable por la clienta.
