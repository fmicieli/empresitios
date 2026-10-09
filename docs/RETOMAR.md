# Cómo retomar

## 1. Links para revisar la última fase (Fase 4)

- **Cómo publicar la demo y checklist por cliente (lo principal):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/11-publicar-demo.md
- **Pull request para pasar todo a `main` (lo que publica Cloudflare):** https://github.com/fmicieli/empresitios/pull/2
- **Decisiones (D-18) y pendientes:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Qué cambió en tu localhost:** los botones de WhatsApp de la tienda, sin número cargado, muestran "Es una demo…" con el botón "Cargar número". Una dirección inventada (por ejemplo `/hola/`) muestra "No encontramos esta página".

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

**Atajo (un solo comando):** con la tienda cortada (`Ctrl + C`), corré `npm run actualizar` en la Terminal. Trae los cambios, instala lo que haga falta y levanta la tienda. Si dice que no encuentra `git`, aceptá la instalación que te ofrece la Mac ("herramientas de línea de comandos") o usá los pasos de abajo.

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
4. La Fase 4 (publicación de la demo) está entregada: docs/11-publicar-demo.md y D-18. Preguntame si ya uní el pull request a main y si publiqué la demo en Cloudflare; si me trabé, acompañame paso a paso.
5. Si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (docs/08, punto 12, y docs/11).
6. La prueba con Google de verdad queda para el final, con la lista de pruebas (docs/09, paso 8). Después, preguntame qué sigue (ver "Después (no ahora)" en docs/05). Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
