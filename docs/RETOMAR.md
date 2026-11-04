# Cómo retomar

## 0. Plantilla 2 · Turnos con WhatsApp (Fases 0, 1 y 2 aprobadas el 04/11; Fase 3, publicación, preparada)

### Fase 3 · Publicar Estudio V (preparada el 04/11, la hace Flor)

- **Paso a paso:** `docs/landing/06-publicar.md`: subir el repo con GitHub Desktop, crear el Worker `estudio-v` en Cloudflare (Build `npm run build:turnos`, Deploy `npm run desplegar:turnos`), poner la dirección en `urlSitio` y probar en un Android.
- Mientras haya "[completar]", el sitio no aparece en Google (D-39): se puede publicar para que Valen lo revise.

### Estudio V (Fase 2, aprobada el 04/11)

- **Dónde está:** en tu compu, en `Claude Code/estudio-v` (repo de git propio, rama `main`). Todavía no está en GitHub: se publica desde GitHub Desktop (File → Add local repository → elegí la carpeta → Publish repository, con "Keep this code private" tildado). Eso crea `fmicieli/estudio-v`.
- **Verlo:** en la Terminal, `cd "Claude Code/estudio-v"`, después `npm install` y `npm run dev:turnos`, y abrí http://localhost:4330/ (cortá antes la plantilla si está corriendo: usan el mismo número).
- **Falta que mande Valen:** institución de Dermatocosmiatría, año del curso de ácido glicólico, seña (monto, medio y plazo), política de cancelación, fotos de tratamientos sobre modelo (hoy las tarjetas usan fotos de productos y cabinas), medio de pago de la rutina online, webs de referencia.
- **Falta hacer:** video del inicio sin audio (hace falta instalar ffmpeg), revisar con Valen el valor "Resultados que se construyen" (reemplaza "Resultados reales", D-36), confirmar que su matrícula la habilita para microneedling.

### Plantilla (Fase 1, aprobada)

Rama: `claude/plantilla-2-turnos-whatsapp`. Primera clienta: Estudio V · Skin Lab (repo `fmicieli/estudio-v`, privado, todavía no creado).

- **Producto y secciones:** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/landing/01-producto-y-secciones.md
- **Modelo de contenido:** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/landing/02-modelo-de-contenido.md
- **Textos y mensajes de WhatsApp:** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/landing/03-textos-y-mensajes.md
- **Estructura, fases y riesgos:** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/landing/04-estructura-y-fases.md
- **Preguntas para la clienta:** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/landing/05-preguntas-a-la-clienta.md
- **Decisiones (D-36 a D-39):** https://github.com/fmicieli/empresitios/blob/claude/plantilla-2-turnos-whatsapp/docs/07-decisiones.md
- **Plantilla (Fase 1):** https://github.com/fmicieli/empresitios/tree/claude/plantilla-2-turnos-whatsapp/turnos-whatsapp
- **Verla en tu compu:** traé la rama, corré `npm install` y después `npm run dev:turnos`, y abrí http://localhost:4330/. Qué probar: README, sección "Plantilla 2".

Prompt para seguir con la plantilla 2:

```
Hola, soy Flor. Seguimos la plantilla 2 (turnos con WhatsApp) en empresitios, rama claude/plantilla-2-turnos-whatsapp.
1. Leé CLAUDE.md, docs/landing/ (00 a 05) y D-36 en docs/07-decisiones.md antes de hacer nada.
2. Fase 0 aprobada (04/11). Fase 1 entregada el 04/11 (plantilla con la marca Brisa en turnos-whatsapp/, D-37): preguntame si la revisé en localhost (npm run dev:turnos, http://localhost:4330/).
3. Fases 1 y 2 aprobadas (04/11): Estudio V armado en Claude Code/estudio-v (D-38). Fase 3 preparada (D-39, docs/landing/06-publicar.md): preguntame si publiqué el repo en GitHub, si creé el Worker en Cloudflare y cuál es la dirección, si lo probé en un Android y si Valen mandó lo que falta (lista en RETOMAR). El material de Valen está en el zip "Estudio V - Web para Flor" (en mi Escritorio); no va en el repo.
4. Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar cada fase.
```

---

## Plantilla 1 · Tienda con WhatsApp

## 1. Links para revisar lo último (sistema de diseño de base D-21 y fotos del admin D-22, unidos a main el 14/10)

- **Decisión D-21 (qué se tomó del sistema y qué se adaptó por accesibilidad):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Tokens del sistema (colores, textos, espacios, radios, sombras):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/compartido/estilos/tokens.css
- **Estilos de los componentes:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/compartido/estilos/base.css
- **Archivo de estilo del cliente (fuentes, colores, formas):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/tienda-whatsapp/config/estilo.css
- **Figma de referencia:** https://www.figma.com/design/9mND0DF4l37xKvbAtIlLLY
- **Qué cambió en tu localhost:** Nunito Sans; botones con radio 8 (principal en el color de marca, secundario gris "Neutral"); talles y colores como etiquetas con tilde; campos, tarjetas, avisos, menú y pestañas con el diseño del sistema; íconos Feather; espacios de la escala del sistema. Unido a main el 14/10 (https://github.com/fmicieli/empresitios/pull/6) y publicado en la demo: https://tienda-modelo.atlas-de5cd208129d.workers.dev (recargá con `Cmd + Shift + R`). Incluye también: fotos del producto con X para quitar y orden arrastrando (D-22), botones más altos, campos y talles con línea que se engrosa al elegir, títulos más chicos, estados vacíos centrados.

### Tarjetas de producto (D-21, puntos 12 f a 12 h; unido a main el 14/10, publicado en la demo)

- Sin borde, foto a todo el ancho, precio primero (20 px) y nombre en gris. Se probó un botón en la tarjeta y se sacó.
- Pull request: https://github.com/fmicieli/empresitios/pull/7

### Ejemplo con marca: Chacha (D-23, publicado el 23/10)

- **Tienda publicada:** https://chacha-tienda.atlas-de5cd208129d.workers.dev (modo de prueba: lo que se cambia en el admin queda solo en ese navegador).
- **Repo (privado):** https://github.com/fmicieli/chacha-tienda — pull requests #1, #2 y #3 unidos. Worker propio en Cloudflare (`chacha-tienda`), publica `main`.
- 31 productos (Accesorios y Home), 93 fotos, banner propio de Flor.
- 23/10: logo en el encabezado (56 px), productos sin stock que no se abren y carrito en una columna (D-24, cambios de plantilla). Unido (empresitios #8, chacha #2).
- 24/10: el WhatsApp del pedido lleva el código y el link a la foto de cada producto (D-25), y las fotos se ordenan solas en carpetas de Drive por categoría y producto (D-26). Unido (empresitios #9, chacha #3). D-26 se prueba recién con Google de verdad: medir cuánto tarda guardar un producto.
- 24/10: logo al centro en computadora (opción `logoCentrado`, D-27), botón del banner centrado en el celular, carrito centrado, flechas en las fotos de la ficha (D-28), más destacados, y color de marca marrón casi negro (#3a2a20) con #171717 al pasar el mouse. El logo queda casi negro (decidió Flor).
- 27 al 30/10: WhatsApp de consultas (2324 47-6673) e Instagram reales. Banner de dos fotos con fundido (D-29): 21:9 en computadora con el texto a la izquierda sobre el color de la foto (verde musgo y beige), 16:10 en el celular con el texto debajo; da 3 vueltas y queda fijo. Se carga a mano, no desde el admin. Descripción: pintado a mano solo abanicos y totes; Home es deco seleccionada.
- 30/10: "Pieza única" y flechas en las filas de destacados (D-30).
- **30/10: conectada a Google (D-31).** Lo que funciona:
  - la planilla "Chacha tienda — no borrar" y las fotos en el Drive de fmicieli94@gmail.com (carpeta "Chacha - Tienda / 05 Sistema tienda");
  - el catálogo importado con `importarCatalogo`: 28 de 31 productos;
  - el admin con Google para Flor y Marina (app "En prueba", con las dos como usuarias de prueba);
  - las tres claves secretas en Cloudflare, en "Runtime variables and secrets".

  Probado por Flor: tienda, admin, pedido y cancelación.
- Falta: importar las 3 fundas (FA-01 a FA-03) ejecutando otra vez `importarCatalogo`. Después, limpiar del repo de Chacha las fotos de prueba y el catálogo exportado.
- Siguiente paso propuesto: conectarla a Google (guía 09) para manejar los productos de verdad desde el admin: es la "prueba con Google" pendiente.
- Cómo se crean los repos de clientes y cómo se les traen las mejoras: https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/12-repos-de-clientes.md

### Diseño D-19 y D-20 (unido a main el 14/10, publicado en la demo)

- **Pull request:** https://github.com/fmicieli/empresitios/pull/5
- **Verlo publicado:** https://tienda-modelo.atlas-de5cd208129d.workers.dev (recargá con `Cmd + Shift + R`)

### Fase 4 (aprobada)

- **Demo publicada:** https://tienda-modelo.atlas-de5cd208129d.workers.dev
- **Cómo publicar la demo y checklist por cliente:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/11-publicar-demo.md

### Fase 3 (aprobada)

- **Guía para conectar un cliente:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/09-guia-conectar-cliente.md
- **Preguntas para el cliente:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/10-preguntas-al-cliente.md
- **Código de Google (Apps Script):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/apps-script/Codigo.gs

### Fase 2 (aprobada)

- **Investigación:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/08-investigacion-fase-2.md

### Fase 1 (aprobada)

- **Pull request (cambios para revisar y aprobar):** https://github.com/fmicieli/empresitios/pull/1
- **Rama de trabajo:** https://github.com/fmicieli/empresitios/tree/claude/quirky-cray-06mnp8
- **Instrucciones y guía de prueba:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/README.md
- **Pendientes y decisiones:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Descargar el proyecto en ZIP:** https://github.com/fmicieli/empresitios/archive/refs/heads/claude/quirky-cray-06mnp8.zip

### Ver los cambios en tu computadora (localhost)

La copia del proyecto está en `Claude Code/Empresitios`, bajada con GitHub Desktop en la rama `claude/quirky-cray-06mnp8`.

**Atajo (un solo comando):** con la tienda cortada (`Ctrl + C`), corré `npm run actualizar` en la Terminal. Trae los cambios, instala lo que haga falta y levanta la tienda. (Antes descarta los cambios automáticos que `npm install` hace en `package-lock.json` en tu Mac, que si no frenan la actualización con el error "Your local changes … would be overwritten".) Si dice que no encuentra `git`, aceptá la instalación que te ofrece la Mac ("herramientas de línea de comandos") o usá los pasos de abajo.

**Cada vez que Claude avisa que subió cambios (paso a paso):**
1. En la Terminal donde corre la tienda, cortala con `Ctrl + C`.
2. En GitHub Desktop, tocá **Fetch origin** y después **Pull origin**.
3. En la Terminal, corré `npm install`. Solo hace falta si cambiaron las herramientas, pero no molesta correrlo siempre.
4. Corré `npm run dev`.
5. Abrí la dirección de la línea **Local** que muestra la Terminal (normalmente http://localhost:4321/; el admin está en `/admin/`) y recargá con `Cmd + Shift + R`.

Si aparece otra dirección (4322, 4323…), es porque quedó otra Terminal corriendo una versión anterior: cerrá todas y empezá de nuevo.

## 2. Prompt para continuar

Copiá y pegá esto en una sesión nueva de claude.ai/code, con el repo `fmicieli/empresitios` y la rama `claude/quirky-cray-06mnp8`:

```
Hola, soy Flor. Seguimos el proyecto de la plantilla "Tienda con WhatsApp".

1. Leé CLAUDE.md, docs/RETOMAR.md y docs/07-decisiones.md (sobre todo la sección "Pendientes") antes de hacer nada.
2. Trabajá siempre en la rama claude/quirky-cray-06mnp8 y subí los cambios a GitHub (commit + push) cada vez que termines una parte, para que no se pierda nada.
3. Fases 1, 2 y 3: aprobadas (D-15, D-16 y D-17).
4. Fase 4 aprobada: la demo está publicada en https://tienda-modelo.atlas-de5cd208129d.workers.dev. Cloudflare publica solo la rama main: cada cambio llega por pull request y yo lo uno.
5. El diseño D-19/D-20 está unido a main y publicado (PR #5). El sistema de diseño de base (D-21, Simple Design System con Nunito Sans) y las fotos del admin (D-22) están unidos a main y publicados (PR #6). Las tarjetas de producto (D-21, 12 f a 12 h) también están publicadas (PR #7). Preguntame si lo revisé en la demo publicada. Quedan abiertas tres preguntas mías: (a) en la lista de productos del admin, ¿mostrar el stock por combinación o el total más cuántas combinaciones están agotadas?; (b) si sigo viendo el stock sumado al cargar un producto nuevo (te mando captura); (c) en qué formato quiero el muestrario de estilos de inspiración (página, documento o Figma).
6. Ejemplo con marca (D-23): Chacha, mi emprendimiento, publicada en https://chacha-tienda.atlas-de5cd208129d.workers.dev (repo privado fmicieli/chacha-tienda: agregalo a la sesión). Ya tiene logo (D-24), foto en el WhatsApp (D-25) fotos ordenadas en Drive (D-26, se prueba al conectar Google), logo al centro (D-27), flechas en las fotos (D-28) marrón casi negro, WhatsApp e Instagram reales y banner de fotos con texto (D-29); "Pieza única" y flechas en destacados (D-30). Conectada a Google el 30/10 (D-31): funcionan la tienda, el admin (Flor y Marina) y los pedidos. Faltan importar 3 fundas y limpiar las fotos de prueba del repo. Los arreglos se hacen en empresitios y se traen a Chacha (docs/12-repos-de-clientes.md).
7. Si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (docs/08, punto 12, y docs/11).
8. La prueba con Google de verdad ya se hizo con Chacha (30/10, ver "Pendientes" en docs/07). Preguntame qué sigue (ver "Después (no ahora)" en docs/05). Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
