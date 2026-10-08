# Cómo retomar

## 1. Links para revisar la última fase (Fase 2)

- **Investigación de la Fase 2:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/08-investigacion-fase-2.md

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
3. Fase 1: terminada y revisada (decisiones en D-15). Si el PR #1 todavía no está aprobado, recordámelo.
4. La Fase 2 está entregada en docs/08-investigacion-fase-2.md. Mis decisiones sobre el punto 13 son: [COMPLETAR]. Antes de la Fase 3, si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (punto 12).
5. Con eso, arrancá la Fase 3 (conexión con Google) según docs/05-arquitectura-y-fases.md y lo decidido. Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
