# Cómo retomar

## 1. Links para revisar la última fase (Fase 3)

- **Guía para conectar un cliente (lo principal para leer):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/09-guia-conectar-cliente.md
- **Detalles para aprobar (D-17) y pendientes:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Preguntas para el cliente (nuevo):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/10-preguntas-al-cliente.md
- **Código de Google (Apps Script):** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/apps-script/Codigo.gs
- **Qué cambió en tu localhost (modo de prueba):** en el admin, abrí un pedido de un número con 2 o más pedidos pendientes → aparece "Cancelar los pedidos pendientes de este número". En la tienda: un tercer pedido pendiente del mismo número, o el mismo pedido exacto dos veces, muestra un aviso; y el "+" se frena al llegar a 10 unidades de un producto.

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
3. Fases 1 y 2: aprobadas (D-15 y D-16).
4. La Fase 3 (conexión con Google) está entregada: guía en docs/09-guia-conectar-cliente.md y detalles a aprobar en D-17. Preguntame si ya la revisé y qué cambios quiero. Si tenés acceso, confirmá en las páginas oficiales los datos marcados ⚠️ (docs/08, punto 12).
5. Si quiero probar con Google de verdad, acompañame paso a paso con la guía (necesito una cuenta de Google de prueba y una de Cloudflare).
6. Con mi OK, seguí con la Fase 4 (publicación de la demo) según docs/05-arquitectura-y-fases.md. Explicame en lenguaje claro, hacé commit y push seguido, y esperá mi OK al terminar.
```
