# Cómo retomar

## 1. Links para revisar la Fase 1

- **Pull request (cambios para revisar y aprobar):** https://github.com/fmicieli/empresitios/pull/1
- **Rama de trabajo:** https://github.com/fmicieli/empresitios/tree/claude/quirky-cray-06mnp8
- **Instrucciones y guía de prueba:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/README.md
- **Pendientes y decisiones:** https://github.com/fmicieli/empresitios/blob/claude/quirky-cray-06mnp8/docs/07-decisiones.md
- **Descargar el proyecto en ZIP:** https://github.com/fmicieli/empresitios/archive/refs/heads/claude/quirky-cray-06mnp8.zip

Para verlo funcionando en tu computadora (con Node.js 22.12 o más nuevo instalado), descomprimí el ZIP, abrí la Terminal en esa carpeta y corré `npm install` y después `npm run dev`. Con eso quedan andando:

- Tienda: http://localhost:4321/
- Admin: http://localhost:4321/admin/
- En el celular (mismo wifi): corré `npm run dev:celular` y abrí en el celular la dirección de la línea "Network".

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
