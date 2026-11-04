# 04 · Plantilla 2 · Estructura de carpetas, arquitectura, fases y riesgos

## Arquitectura en criollo

- Es una **página estática**: Astro arma un HTML con sus fotos al compilar y Cloudflare lo sirve tal cual. No hay servidor propio, ni puente, ni claves secretas, ni Google.
- El poco JavaScript que hay (menú, paso de lugar, certificados, video) va en scripts chicos dentro de cada sección, sin Preact: pesa menos en un Android de gama media (D-37). "Ver más" no usa JavaScript.
- Se publica en **Cloudflare Workers** con solo archivos estáticos, como la demo (D-16, D-18). ⚠️ Los límites del plan gratis para sitios estáticos se confirman en la documentación oficial antes de publicar (Fase 3).

## Estructura de carpetas

```
empresitios/
├── compartido/
│   ├── estilos/            ← tokens.css (de las dos plantillas), base.css, contraste.ts
│   ├── componentes/        ← íconos y componentes básicos (botón, diálogo…)
│   ├── datos/reglas.ts     ← linkWhatsapp, normalizarWhatsapp, formatoPrecio
│   ├── whatsapp/           ← mensajes de la tienda + mensajes de turnos (nuevos, con pruebas)
│   ├── herramientas/       ← chequeos al compilar que usan las dos plantillas (contraste, fotos)
│   └── …                   ← admin, carrito, puente: solo los usa la tienda
├── tienda-whatsapp/        ← plantilla 1 (no cambia)
├── turnos-whatsapp/        ← plantilla 2 (nueva)
│   ├── config/
│   │   ├── sitio.config.ts
│   │   ├── contenido.ts
│   │   └── estilo.css
│   ├── fotos/              ← fotos de la clienta (se achican al compilar)
│   ├── public/             ← logo, favicon y video
│   ├── src/
│   │   ├── pages/index.astro, 404.astro
│   │   ├── secciones/      ← Inicio.astro, Servicios.astro, ElegirLugar.astro, DondeAtiendo.astro…
│   │   ├── componentes/    ← Foto.astro, Icono.astro
│   │   ├── lib/            ← tipos.ts, validar.ts (controles), preparar.ts (links y "Mi semana"), pruebas
│   │   └── turnos.css      ← estilos de las secciones, solo con tokens
│   ├── astro.config.mjs
│   ├── wrangler.jsonc      ← solo archivos estáticos
│   └── package.json
├── apps-script/            ← solo la tienda
└── docs/
    ├── 00 … 12             ← plantilla 1 y documentos comunes
    └── landing/            ← plantilla 2
```

### Qué se mueve a `compartido/` (toca la plantilla 1)

Para que las dos plantillas usen lo mismo, en la Fase 1 hay que pasar dos cosas que hoy están dentro de `tienda-whatsapp/` a `compartido/`:

- el chequeo de colores al compilar: ahora está en `compartido/herramientas/colores-de-marca.ts` y la tienda lo usa desde ahí (D-37);
- los estilos de componentes (`compartido/estilos/base.css`) ya estaban separados: las dos plantillas los usan tal cual.

La tienda tiene que quedar **igual** (se comprueba con `npm test`, `npm run check`, `npm run build` y mirándola en localhost). Cuando se una a `main`, Chacha recibe estos cambios como cualquier mejora de la plantilla.

### Comandos

Los de siempre siguen siendo de la tienda, para no cambiarte la costumbre. Se suman:

```
npm run dev:turnos            # la plantilla 2 en http://localhost:4330/ (otro número que la tienda, para no confundirlas)
npm run dev:turnos:celular    # para verla en el celular (misma red wifi)
npm run build:turnos          # arma el sitio y corre los controles
```

`npm test` y `npm run check` revisan las dos plantillas.

## Marca de ejemplo (ficticia)

Propuesta, a confirmar: **"Brisa · Masajes y bienestar"**, de una masajista ficticia, "Lucía".

- Distinta de Estudio V a propósito, para que se note qué es plantilla y qué es de la clienta.
- Dos lugares (para probar el paso "¿Dónde te queda mejor?"): un consultorio con dirección y otro "Se da al reservar".
- Cinco servicios: uno sin precio, uno sin duración, uno destacado, uno solo de un lugar.
- Un llamado propio ("Gift card").
- Antes y después apagada.
- Gris oscuro del sistema de base como color de marca (como la demo de la tienda), Nunito Sans.
- Fotos de ejemplo: ilustraciones lisas con el nombre de cada foto, generadas para la plantilla (sin derechos de terceros, D-37).

## Fases

### Fase 0 — Especificación (esta)

`docs/landing/01` a `05`, D-36 en `07-decisiones.md`, `CLAUDE.md` adaptado. **Esperar OK de Flor.**

### Fase 1 — Plantilla con la marca de ejemplo (en `empresitios`)

- Todas las secciones de `01-producto-y-secciones.md` con el contenido de Brisa.
- Mensajes de WhatsApp con pruebas automáticas.
- Controles al compilar (`02-modelo-de-contenido.md`).
- Lo compartido pasado a `compartido/` sin cambiar la tienda.
- Revisión de Flor en localhost (compu y celular). Pull request a `main` cuando Flor lo pida.

### Fase 2 — Sitio de Estudio V (repo `fmicieli/estudio-v`, privado)

- Flor crea el repo vacío y le da acceso a Claude (`docs/12-repos-de-clientes.md`, paso 1).
- Se copia la plantilla y se cargan contenido, fotos (renombradas, ver `00-arranque.md`) y estilo: Cormorant Garamond + Jost, crema de fondo, marrón para textos, canela para botones, terracota para detalles (D-36).
- Video del inicio: sin audio, comprimido, solo en computadora.
- Logo: PNG o SVG con el texto pasado a curvas.
- Lo que falte de la clienta queda marcado y la compilación lo avisa.
- Revisión de Flor en localhost.

### Fase 3 — Publicación

- Worker nuevo en Cloudflare conectado a `fmicieli/estudio-v` (como en `docs/11-publicar-demo.md`), que arma la carpeta `turnos-whatsapp`.
- Dominio, si Valen quiere (lo compra a su nombre).
- Prueba final en un Android de gama media.

### Después (no ahora)

- **Formulario corto antes de WhatsApp:** nombre, día y franja preferidos. Arma un mensaje más completo. No se guarda en ningún lado: va directo al WhatsApp (sin datos en la URL de la página, regla 9).
- Opcional: que la clienta edite su contenido sola (por ejemplo, con una planilla o un editor). Sumaría pasos y quizás costo: se evalúa si alguna lo pide.
- Plantilla 2 en la demo pública, para mostrársela a otras profesionales.

## Riesgos

### Legales

- **Antes y después:** son fotos de salud de otras personas. Hace falta **permiso escrito** de cada paciente (Ley 25.326, datos sensibles). Mejor sin cara o con la cara tapada. La sección viene apagada y no compila sin `permisoEscrito: true` en cada par. Guardar los permisos firmados es responsabilidad de la profesional.
- **Promesas de resultados:** la publicidad de estética y salud tiene reglas. Evitar "cura", "elimina", "definitivo", "garantizado". La compilación avisa si aparecen. ⚠️ No verifiqué la norma exacta que aplica; si Valen quiere promocionar algo fuerte, que lo consulte.
- **Microneedling:** conviene que Valentina confirme que su título y matrícula la habilitan para hacerlo. No lo verifiqué.
- **Certificados:** que no se vea DNI, domicilio ni firma ampliable. En el material ya vienen tapados; revisar al publicar cada uno nuevo.
- **Fotos de otros espacios:** las cabinas de Amaia y Arizona muestran el logo de cada lugar. Usarlas como referencia de dónde atiende, no como marca propia. Conviene que Valen les avise a esos espacios que publica las fotos.

### Técnicos

- **Video:** si es pesado, el inicio tarda en el celular. Por eso solo en computadora y comprimido.
- **Contenido a mano:** cada cambio pasa por Flor y una publicación. Si la clienta pide cambios muy seguido, conviene pensar en la opción de que edite sola.
- **Mover cosas a `compartido/`:** si se hace mal, puede romper la tienda. Se controla con las pruebas y mirándola antes de unir.

### Accesibilidad

- **Paleta de Estudio V:** terracota con texto blanco no llega al mínimo. Por eso los botones van en canela (D-36). La canela sobre beige da 3,4:1: en fondos beige el texto va en marrón.
- **Cormorant Garamond** es fina y con poco cuerpo: va solo en títulos grandes, nunca en textos chicos ni botones.
