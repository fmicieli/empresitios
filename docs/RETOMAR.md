# Cómo retomar

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
- **Repo (privado):** https://github.com/fmicieli/chacha-tienda — pull request #1 unido. Worker propio en Cloudflare (`chacha-tienda`), publica `main`.
- 31 productos (Accesorios y Home), 93 fotos, banner propio de Flor.
- Falta: logo, Instagram, decidir el botón del banner (hoy "Ver accesorios") y si las piezas únicas dicen "Pieza única" en vez de "Queda 1" (cambio de plantilla).
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
6. Ejemplo con marca (D-23): Chacha, mi emprendimiento, publicada en https://chacha-tienda.atlas-de5cd208129d.workers.dev (repo privado fmicieli/chacha-tienda: agregalo a la sesión). Falta el logo y el Instagram; preguntame si quiero conectarla a Google. Los arreglos se hacen en empresitios y se traen a Chacha (docs/12-repos-de-clientes.md).
7. Si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (docs/08, punto 12, y docs/11).
8. La prueba con Google de verdad queda para el final, con la lista de pruebas (docs/09, paso 8). Después, preguntame qué sigue (ver "Después (no ahora)" en docs/05). Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
