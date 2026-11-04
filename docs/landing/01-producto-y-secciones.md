# 01 · Plantilla 2 · Turnos con WhatsApp — producto y secciones

Plantilla en la carpeta `turnos-whatsapp/` (D-36). Decisiones de esta especificación: `docs/07-decisiones.md`, D-36. Punto de partida: `00-arranque.md`.

## Qué es

Una landing de **una sola página** para profesionales que atienden con turno: cosmiatría, estética, uñas, peluquería, masajes, nutrición, etc.

- Muestra quién es la profesional, qué servicios da, dónde atiende y cómo se reserva.
- Cada servicio tiene un botón **"Reservar turno"** que abre WhatsApp con un mensaje armado para ese servicio (y el lugar elegido, si atiende en más de uno).
- **Sin admin, sin Google, sin base de datos.** El contenido lo carga Flor en un archivo cuando la clienta le pide cambios. Costo para la clienta: solo el dominio.
- No guarda datos de quien visita: no hay formularios que se envíen a un servidor, ni registros, ni estadísticas en la Fase 1.

## Para quién

- **Quien visita:** llega desde Instagram con un Android de gama media. Quiere saber qué hace la profesional, cuánto sale y dónde queda, y pedir turno en pocos toques.
- **La profesional:** no toca la web. Recibe los pedidos de turno en su WhatsApp, ya con el servicio y el lugar escritos.

## Recorrido principal

1. Entra a la página y ve la frase principal, la foto y "Reservar turno".
2. Baja a Servicios, lee la tarjeta y toca "Reservar turno".
3. Si la profesional atiende en **más de un lugar** y el servicio se da en más de uno, se abre un paso corto: **"¿Dónde te queda mejor?"** (ver abajo). Si hay un solo lugar, se saltea.
4. Se abre WhatsApp en una pestaña nueva con el mensaje listo. Lo manda ella.

## Secciones

Van en este orden. Las opcionales se prenden o apagan en `config/sitio.config.ts`. El menú de arriba muestra solo las secciones prendidas.

| # | Sección | Qué tiene | ¿Opcional? |
|---|---|---|---|
| 1 | **Encabezado** | logo, links a las secciones (en el celular, menú desplegable), botón "Reservar turno" | no |
| 2 | **Inicio** | frase principal, texto corto de presentación, foto (o video, ver abajo), botón "Reservar turno" que baja a Servicios | no |
| 3 | **Sobre mí** | foto y texto completo (párrafos) | sí |
| 4 | **Propuesta** | 3 o 4 puntos cortos (título y una o dos frases) | sí |
| 5 | **Servicios** | tarjetas de servicio (ver abajo) y una nota general opcional ("Todos incluyen tu rutina en PDF") | no |
| 6 | **Servicio con llamado propio** | un bloque destacado para un servicio distinto (Estudio V: rutina online). Título, pasos numerados, precio opcional, botón con texto propio | sí |
| 7 | **Formación** | lista de títulos y cursos (nombre, institución, año, "en curso") y fotos de certificados que se agrandan al tocarlas | sí |
| 8 | **Antes y después** | pares de fotos con una línea de texto. **Solo con permiso escrito de cada paciente** (ver "Riesgos") | sí, viene apagada |
| 9 | **Dónde atiendo** | agenda semanal y una tarjeta por lugar: nombre, zona, dirección (o "Se da al reservar"), días y horarios, link "Cómo llegar" a Google Maps, foto | sí |
| 10 | **Turnos y seña** | cómo se reserva, seña, plazo y cancelación, en pasos cortos | sí |
| 11 | **Contacto** | WhatsApp e Instagram (el mail es opcional, ver D-36) | no |
| — | **Pie** | nombre, matrícula (opcional), redes, "Sitio hecho por…" (opcional) | no |
| — | **Botón flotante de WhatsApp** | en toda la página, abajo a la derecha; abre el mensaje general | no |

### Inicio: foto o video

- Por defecto, una **foto**.
- Opcional: un **video de fondo** (D-36):
  - solo en computadora (pantallas de 768 px o más);
  - sin sonido (se le saca la pista de audio al prepararlo, no alcanza con silenciarlo);
  - no se reproduce si la persona activó "reducir movimiento" en su teléfono o computadora: queda la foto;
  - con botón de pausa visible (es obligatorio por accesibilidad si se mueve más de 5 segundos);
  - liviano: hasta unos 2 MB, comprimido y sin audio;
  - en el celular siempre va la foto, para no gastarle datos ni batería.
- El texto del inicio nunca va encima de una parte de la foto o del video que no deje leerlo: va sobre un fondo de color o al costado.

### Tarjeta de servicio

- **Siempre:** nombre, foto, descripción corta, botón "Reservar turno".
- **Opcionales** (D-36): duración, precio, descripción larga ("Ver más", se despliega en la misma tarjeta), etiqueta de **destacado**.
- Si falta la duración o el precio, no se muestra nada en su lugar (ni "Consultar") y el mensaje de WhatsApp no lo menciona.
- **Destacado:** un servicio (o más) puede marcarse con una etiqueta de texto, por ejemplo "Tratamiento estrella". Va primero en la lista y la etiqueta es texto, no solo un color (regla 7).
- **Lugares:** por defecto un servicio se da en todos los lugares. Se puede limitar a algunos (por ejemplo, "solo en el consultorio propio").
- En el celular las tarjetas van en una columna; en computadora, en dos o tres.

### Paso "¿Dónde te queda mejor?"

Aparece al tocar "Reservar turno" cuando el servicio se da en dos lugares o más (D-36).

- Es una ventana chica (en el celular sube desde abajo) con el nombre del servicio arriba.
- Una opción por lugar, con sus días: "Amaia Wellness Studio, San Fernando · martes y jueves".
- Una última opción: **"Me da igual"**.
- Arranca sin nada elegido y el botón **"Abrir WhatsApp"** pide elegir una opción. Si se toca sin elegir: "Elegí un lugar o «Me da igual»."
- Se cierra con "Cancelar", con la X o con la tecla Escape, y el foco vuelve al botón que la abrió.
- **Sin JavaScript** (o si algo falla al cargar), el botón "Reservar turno" igual funciona: abre WhatsApp con el mensaje del servicio sin el lugar. Es un link de verdad que la ventana mejora.
- El botón general (inicio, encabezado y flotante) **no** pide lugar: abre el mensaje general.

### Servicio con llamado propio

- Para un servicio que no sigue el circuito de turno presencial (Estudio V: "Rutina personalizada online", $20.000).
- Tiene su propio texto de botón ("Quiero mi rutina") y su propio mensaje de WhatsApp.
- Es online, así que **nunca pide lugar**.
- Puede, además, ofrecer un link a Instagram (el brief menciona "o Instagram con la palabra RUTINA"). Propuesta: solo WhatsApp, para no partir los pedidos en dos lugares. A confirmar con Valen.

### Dónde atiendo

- **Agenda semanal** arriba: una fila por día que atiende (lunes a domingo, solo los que tienen algo), con el lugar y el horario. Se arma sola desde los lugares, no se carga dos veces.
- Debajo, **una tarjeta por lugar**.
- "Cómo llegar" es un **link** a Google Maps, no un mapa insertado: un mapa insertado pesa mucho en el celular y le pasa datos de la visita a Google. El link se arma con la dirección; no hace falta ninguna clave.
- Si la dirección es privada ("Se da al reservar"), no hay link.
- Si un lugar empieza o termina en una fecha ("desde noviembre"), se escribe en el horario como texto. La página no esconde ni muestra lugares según la fecha: eso lo cambia Flor.

### Formación

- Lista ordenada como la cargue Flor (sugerido: primero el título principal, después los cursos de la especialidad y al final los complementarios).
- "En curso" va como texto al lado del nombre.
- Fotos de certificados en miniatura. Al tocarlas se ven grandes en una ventana que se cierra con X o Escape. Cada una necesita un texto alternativo ("Título de Cosmetóloga y Cosmiatra, ProDermic, 2025").

## Accesibilidad (regla 7, aplicada a esta plantilla)

- Botones y links reales; áreas táctiles de 44 px o más; foco visible.
- Un solo título principal (`h1`, la frase del inicio) y títulos de sección en orden.
- Link "Saltar al contenido" al principio.
- Todas las fotos con texto alternativo en el contenido (la compilación avisa si falta). Las fotos decorativas se marcan como tales.
- Contraste mínimo AA, revisado al compilar con el mismo chequeo de la tienda (D-19, punto 5).
- Nada se mueve solo sin poder pausarlo; "reducir movimiento" se respeta (video, desplazamientos suaves).
- Los links que abren WhatsApp o Maps en otra pestaña lo dicen para lectores de pantalla ("se abre en otra pestaña").

## Rendimiento

- Página estática, sin servidor. El JavaScript es solo para el menú del celular, el paso "¿Dónde te queda mejor?", "Ver más" y la ventana de certificados.
- Fotos optimizadas al compilar: varios tamaños y formato moderno (WebP o AVIF). La primera foto se carga enseguida; el resto, recién al acercarse.
- Fuentes guardadas en el sitio (Fontsource), como en la tienda (D-19, punto 4).

## Lo que no hace (en la Fase 1)

- No muestra turnos libres ni reserva sola: el turno se arregla por WhatsApp.
- No cobra la seña: la seña se explica en texto y se coordina por WhatsApp.
- No tiene formulario (llega en la fase siguiente, ver `04-estructura-y-fases.md`).
- No tiene admin: los cambios los hace Flor.
