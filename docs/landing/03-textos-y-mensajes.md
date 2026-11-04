# 03 · Plantilla 2 · Textos de interfaz y mensajes de WhatsApp

Los textos fijos de la interfaz (los que no cambian por clienta) van en el código de la plantilla, como en la tienda (`compartido/textos/textos.ts`). Los de la clienta van en `contenido.ts`. Tono: rioplatense, de vos, frases cortas.

## Textos de interfaz

| Dónde | Texto |
|---|---|
| Botón principal (encabezado, inicio) | Reservar turno |
| Botón de cada servicio | Reservar turno |
| Lector de pantalla, botón de servicio | Reservar turno: {servicio} |
| Lector de pantalla, links externos | (se abre en otra pestaña) |
| Botón flotante (lector de pantalla) | Escribir por WhatsApp |
| Desplegar detalle | Ver más / Ver menos |
| Menú en el celular | Menú / Cerrar menú |
| Saltar al contenido | Saltar al contenido |
| Duración en la tarjeta | {duración} (con ícono de reloj; el lector de pantalla lee "Duración: 1 h 30") |
| Precio en la tarjeta | $95.000 |
| Etiqueta de destacado | la que cargue Flor (por ejemplo, "Tratamiento estrella") |
| Formación en curso | En curso |
| Lugar sin dirección | Se da al reservar |
| Link al mapa | Cómo llegar |
| Agenda semanal, título | Mi semana |
| Certificado ampliado | Cerrar |

### Paso "¿Dónde te queda mejor?"

| Elemento | Texto |
|---|---|
| Título | ¿Dónde te queda mejor? |
| Subtítulo | {servicio} |
| Opción por lugar | {nombre del lugar}, {zona} · {días} (ej.: "Amaia Wellness Studio, San Fernando · martes y jueves") |
| Opción final | Me da igual |
| Botón | Abrir WhatsApp |
| Botón secundario | Cancelar |
| Error si no eligió | Elegí un lugar o «Me da igual». |

Los días se escriben con "y" ("martes y jueves"; "lunes, miércoles y viernes").

## Mensajes de WhatsApp

`{nombreCorto}` sale de `sitio.config.ts`. Los paréntesis con duración y precio solo aparecen si el servicio los tiene; si tiene uno solo, va solo ese, sin el "·".

### 1. Reservar un servicio, con lugar elegido

> Hola {nombreCorto}, quiero reservar un turno para {servicio} ({duración} · {precio}) en {lugar}, {zona} ({días}). ¿Qué días tenés disponibles?

Ejemplo:

> Hola Valen, quiero reservar un turno para Microneedling con dermapen + limpieza profunda (1 h 30 · $95.000) en Amaia Wellness Studio, San Fernando (martes y jueves). ¿Qué días tenés disponibles?

### 2. Reservar un servicio, "Me da igual" (o sin JavaScript)

> Hola {nombreCorto}, quiero reservar un turno para {servicio} ({duración} · {precio}). Me queda bien cualquier lugar. ¿Qué días tenés disponibles?

Sin JavaScript el mensaje va sin "Me queda bien cualquier lugar."

### 3. Servicio de un solo lugar

Igual que el 1, sin preguntar: el lugar se agrega solo.

### 4. Lugar con dirección privada

Se nombra por su zona: "en mi consultorio de Villa Adelina (miércoles)". El nombre visible lo carga Flor (`nombre: 'Mi consultorio'`, `zona: 'Villa Adelina'`).

### 5. Botón general (encabezado, inicio y flotante)

> Hola {nombreCorto}, quiero consultar por un turno.

### 6. Servicio con llamado propio

El texto de `llamado.mensaje` en `contenido.ts`. Puede usar `{nombreCorto}`. Ejemplo de Estudio V:

> Hola Valen, quiero mi rutina personalizada online. ¿Cómo seguimos?

### Reglas de los mensajes

- Se arman con la misma función de link de la tienda (`linkWhatsapp` en `compartido/datos/reglas.ts`), que codifica el texto para el link `wa.me`.
- **No llevan datos de quien escribe**: no hay nada que pedir (la Fase 1 no tiene formulario). WhatsApp ya muestra su número a la profesional.
- Se prueban con pruebas automáticas, como los de la tienda (`compartido/whatsapp/mensajes.test.ts`): con y sin duración, con y sin precio, con lugar, con "me da igual" y con un solo lugar.
