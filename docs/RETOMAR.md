# Cómo retomar

## 1. Links para revisar lo último (diseño de la tienda: D-19 y D-20)

- **Decisiones de diseño (D-19, D-20) y pendientes:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Archivo de estilo del cliente (fuentes, colores, formas):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/tienda-whatsapp/config/estilo.css
- **Configuración del banner (inicio.banner):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/tienda-whatsapp/config/tienda.config.ts
- **Pull request con todo esto (unir después de revisar):** https://github.com/fmicieli/empresitios/pull/5
- **Qué cambió en tu localhost:** inicio con banner y filas de destacados por categoría; breadcrumb en categorías, búsqueda y ficha; buscador chico en el encabezado (lupa en el celular); Mujer con 3 niveles (Mujer / Indumentaria / Remeras); colores derivados de la marca; Roboto; logo de ejemplo; casilla "Destacado en el inicio" en el admin. Los datos de prueba del navegador se reinician una vez.

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
5. El estilo por cliente (D-19) está entregado: preguntame si ya lo revisé, y si quiero el muestrario de estilos de inspiración (el admin sigue el mismo estilo que la tienda: decidido).
6. Si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (docs/08, punto 12, y docs/11).
7. La prueba con Google de verdad queda para el final, con la lista de pruebas (docs/09, paso 8). Después, preguntame qué sigue (ver "Después (no ahora)" en docs/05). Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
