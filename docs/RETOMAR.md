# Cómo retomar

## 1. Links para revisar la Fase 1

- **Pull request (cambios para revisar y aprobar):** https://github.com/fmicieli/empresitios/pull/1
- **Rama de trabajo:** https://github.com/fmicieli/empresitios/tree/claude/quirky-cray-06mnp8
- **Instrucciones y guía de prueba:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/README.md
- **Pendientes y decisiones:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Descargar el proyecto en ZIP:** https://github.com/fmicieli/empresitios/archive/refs/heads/claude/quirky-cray-06mnp8.zip

### Ver los cambios en tu computadora (localhost)

La copia del proyecto está en `Claude Code/Empresitios`, bajada con GitHub Desktop en la rama `claude/quirky-cray-06mnp8`.

**Cada vez que Claude avisa que subió cambios:**
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
3. Fase 1: ya está terminada y en revisión en el PR #1. Te paso mis respuestas a los pendientes 1 a 3: [COMPLETAR o escribir "todavía no lo decidí"].
4. Arrancá la Fase 2 (investigación técnica) según docs/05-arquitectura-y-fases.md, incluidos los puntos 8 a 10 que agregué. Es sin código de producción: entregala por escrito en docs/08-investigacion-fase-2.md, con fuentes oficiales y fecha de consulta. Verificá cada límite, cuota o precio en la documentación oficial (Google, Cloudflare). Si no podés acceder a alguna fuente, avisame en vez de suponer.
5. Al terminar, explicame las recomendaciones en lenguaje claro, hacé commit y push, y esperá mi OK antes de la Fase 3.
```
