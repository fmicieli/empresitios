# 02 · Plantilla 2 · Modelo de contenido y configuración

Todo lo que cambia por clienta vive en **tres archivos** dentro de `turnos-whatsapp/config/` y en las fotos de `turnos-whatsapp/public/fotos/`. El resto del código no tiene ningún texto ni dato de la clienta (regla 1).

| Archivo | Qué tiene | Quién lo cambia |
|---|---|---|
| `sitio.config.ts` | datos fijos del sitio: nombre, WhatsApp, redes, color de marca, secciones prendidas, opciones (video, mail) | Flor, al armar el sitio |
| `contenido.ts` | lo que la clienta pide cambiar seguido: textos, servicios, precios, lugares, horarios, formación | Flor, cuando la clienta le pide cambios |
| `estilo.css` | fuentes, colores y formas (igual que en la tienda, D-19) | Flor, al armar el sitio |

Se separan configuración y contenido para que un cambio de precio no toque el archivo con el WhatsApp y las opciones. En la tienda el contenido viene de la planilla; acá viene de `contenido.ts`. La regla 2 (configuración en un solo archivo) se mantiene: `sitio.config.ts`.

Los dos archivos `.ts` tienen la forma marcada por tipos, así que si falta un dato obligatorio o tiene otro formato, la compilación lo dice antes de publicar (ver "Controles al compilar").

## `sitio.config.ts`

```ts
export default {
  nombre: 'Estudio V · Skin Lab',          // se ve en el encabezado (si no hay logo), en la pestaña y al compartir
  nombreCorto: 'Valen',                    // cómo la saludan en el WhatsApp: "Hola Valen, …"
  profesional: 'Valentina Osácar',         // para el pie y la descripción al compartir
  matricula: 'Matrícula 12794',            // opcional, va en el pie
  descripcion: 'Cosmetóloga y cosmiatra …',// texto corto para Google y al compartir el link
  urlSitio: 'https://estudiov.com.ar',     // para el link al compartir

  whatsapp: '2324 69-2208',                // se normaliza solo (D-02); la compilación avisa si no se puede
  instagram: 'estudiov.skinlab',           // sin @
  mail: '',                                // opcional; vacío = no se muestra (D-36)

  logo: { archivo: 'logo.svg', alt: 'Estudio V · Skin Lab' },  // opcional
  colorMarca: '#8A5A42',                   // botones (D-36: canela en Estudio V)

  secciones: {                             // las obligatorias no figuran acá
    sobreMi: true, propuesta: true, llamado: true, formacion: true,
    antesDespues: false, dondeAtiendo: true, turnos: true,
  },

  inicio: {
    video: { archivo: 'inicio.mp4', poster: 'inicio.jpg' },  // opcional; solo computadora (D-36)
  },

  creditos: { texto: 'Sitio hecho por Flor Micieli', url: '' },  // opcional
};
```

## `contenido.ts`

Cada foto se escribe como `{ archivo, alt }`. `archivo` es el nombre dentro de `public/fotos/`. `alt` es lo que escucha alguien con lector de pantalla; si la foto es decorativa, `alt: ''`.

```ts
export default {
  inicio: {
    frase: 'Tu piel también habla, y hay que saber escucharla.',
    texto: 'Soy Valentina Osácar, cosmetóloga, cosmiatra y futura dermatocosmiatra. …',
    foto: { archivo: 'valen-retrato-1.jpg', alt: 'Valentina en su consultorio, junto a la camilla' },
  },

  sobreMi: {
    titulo: 'Sobre mí',
    parrafos: ['Soy Valentina Osácar, Valen para todas. …', '…'],
    foto: { archivo: 'valen-retrato-2.jpg', alt: '…' },
  },

  propuesta: {
    titulo: 'Cómo trabajo',
    puntos: [
      { titulo: 'Menos es más', texto: 'Una rutina básica de 4 productos alcanza …' },
      // 3 o 4 puntos
    ],
  },

  servicios: {
    titulo: 'Tratamientos',
    nota: 'Todos incluyen tu rutina de cuidado personalizada en PDF.',  // opcional
    lista: [
      {
        id: 'microneedling',               // corto, sin espacios; no se ve, sirve para el link #microneedling
        nombre: 'Microneedling con dermapen + limpieza profunda',
        descripcion: 'Estimula la piel para que se renueve: textura, marcas y luminosidad.',
        detalle: ['Con el dermapen hago microperforaciones …'],  // opcional: "Ver más"
        duracion: '1 h 30',                // opcional
        precio: 95000,                     // opcional; número sin puntos. Se muestra "$95.000"
        destacado: 'Tratamiento estrella', // opcional: el texto de la etiqueta
        lugares: [],                       // opcional: ids de lugares. Vacío o sin poner = todos
        foto: { archivo: 'microneedling.jpg', alt: '…' },
      },
    ],
  },

  llamado: {                               // servicio con llamado propio (opcional)
    titulo: 'Rutina personalizada online',
    texto: 'Para quienes no pueden venir al consultorio.',
    pasos: ['Videollamada: me contás qué productos tenés y usás.', 'Armo tu rutina y te la mando en PDF.', 'A los 15 días vemos cómo la aplicás y qué resultados ves.'],
    precio: 20000,                         // opcional
    etiquetaPrecio: 'Precio de lanzamiento',  // opcional
    boton: 'Quiero mi rutina',
    mensaje: 'Hola {nombreCorto}, quiero mi rutina personalizada online. ¿Cómo seguimos?',
    foto: { archivo: 'valen-selfie.jpg', alt: '…' },  // opcional
  },

  formacion: {
    titulo: 'Formación',
    lista: [
      { titulo: 'Cosmetóloga y cosmiatra', institucion: 'ProDermic Escuela de Estética, sede Martínez', año: '2025', nota: 'Matrícula 12794' },
      { titulo: 'Dermatocosmiatría', institucion: '…', enCurso: true },
    ],
    certificados: [{ archivo: 'cert-cosmiatria.jpg', alt: 'Título de Cosmetóloga y Cosmiatra, ProDermic, 2025' }],
  },

  antesDespues: {                          // apagada en Estudio V (D-36)
    titulo: 'Resultados',
    aviso: 'Fotos publicadas con permiso de cada paciente.',
    lista: [
      { antes: { archivo: '…', alt: '…' }, despues: { archivo: '…', alt: '…' }, texto: '3 sesiones de microneedling', permisoEscrito: true },
    ],
  },

  dondeAtiendo: {
    titulo: 'Dónde atiendo',
    lugares: [
      {
        id: 'amaia',
        nombre: 'Amaia Wellness Studio',
        zona: 'San Fernando',
        direccion: 'Uruguay 3751, San Fernando',  // vacío = "Se da al reservar" y sin link a Maps
        dias: [
          { dia: 'martes', horario: '9 a 13 y 14 a 20 h' },
          { dia: 'jueves', horario: '9 a 14 h (último turno 13 h)' },
        ],
        foto: { archivo: 'amaia-cabina-1.jpg', alt: '…' },
      },
      // …
    ],
  },

  turnos: {
    titulo: 'Turnos y seña',
    pasos: ['Me escribís por WhatsApp con el tratamiento.', 'Te paso los días y horarios libres.', 'La seña confirma el turno.'],
    sena: '…',            // monto y medio de pago (Estudio V: falta que lo mande)
    cancelacion: '…',     // política de cancelación (falta)
  },
};
```

### Reglas del contenido

- **Precio:** número sin puntos ni signo (`95000`). La página muestra `$95.000`. Si es "desde", se escribe en `etiquetaPrecio` o se deja el precio vacío y se aclara en la descripción.
- **Duración:** texto libre corto (`'1 h'`, `'1 h 30'`, `'45 min'`). Va tal cual en la tarjeta y en el mensaje.
- **Días:** en minúscula (`lunes` … `domingo`). La agenda semanal los ordena sola.
- **Destacado:** el texto de la etiqueta. Los destacados van primero, en el orden en que estén.
- **Lugares de un servicio:** si un servicio se da en un solo lugar, el paso "¿Dónde te queda mejor?" se saltea y el mensaje nombra ese lugar.
- **Antes y después:** cada par necesita `permisoEscrito: true`. Si falta, la compilación frena (ver "Riesgos" en `04-estructura-y-fases.md`).

## Fotos

- Van en `turnos-whatsapp/public/fotos/` con nombres claros en minúscula y sin espacios (`amaia-cabina-1.jpg`).
- Se suben en buena calidad (2000 px de lado está bien). La compilación las achica y arma los tamaños para cada pantalla.
- Proporciones sugeridas: inicio 4:5 en el celular y 16:9 en computadora (se recorta solo, centrado; se puede elegir el punto de recorte); tarjetas de servicio 4:3; lugares 3:2; certificados sin recorte.
- El video del inicio se prepara una vez, sin audio y comprimido (Claude lo hace con una herramienta en la compu; Flor no tiene que hacer nada).

## Controles al compilar

Cuando se arma el sitio (`npm run build:turnos`), se revisa y se avisa en castellano qué corregir:

| Control | Qué hace si falla |
|---|---|
| Contraste de colores (el mismo de la tienda, D-19) | avisa qué par de colores falla |
| Foto que no existe en `public/fotos/` | frena y dice el nombre del archivo |
| Foto sin `alt` (falta el campo; `''` vale para decorativas) | frena |
| WhatsApp que no se puede normalizar (D-02) | frena |
| Un servicio pide un lugar que no existe | frena |
| Antes y después sin `permisoEscrito: true` | frena |
| Palabras de promesa en textos ("cura", "elimina", "garantizado", "100 %", "definitivo") | **avisa** pero no frena: es para revisar con la clienta |
| Datos que la clienta tiene que completar (`[completar]`, `…`) | **avisa** |
