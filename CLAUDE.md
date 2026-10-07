# CLAUDE.md — Plantillas para comercios · Tienda con WhatsApp

Este archivo es el contexto permanente del repositorio. Leelo al empezar cada sesión. El detalle está en `docs/`.

## Quién soy y cómo trabajamos

- Soy Flor, diseñadora UX/UI freelance en Buenos Aires. No soy desarrolladora: explicame las decisiones técnicas en lenguaje claro y sin dar nada por sabido.
- Respondeme siempre en español. La interfaz va en español rioplatense (vos), con frases cortas y directas.
- Avisame siempre de riesgos técnicos, de seguridad, legales o de condiciones de uso de una herramienta.
- Verificá en documentación oficial cualquier límite, cuota o precio antes de afirmarlo.
- Si una decisión de este documento te parece técnicamente mala, decímelo antes de cambiarla. No cambies decisiones de producto sin consultarme.
- Trabajá por fases (ver `docs/05-arquitectura-y-fases.md`). Al terminar cada fase: explicame cómo probarla, hacé commit con un mensaje claro y esperá mi OK.
- Ante una duda de producto que no esté en `docs/`, preguntame antes de inventar.

## Al empezar cada sesión

Lo primero que respondés, antes de cualquier otra cosa, son **los links para revisar la última fase terminada** y **el prompt para continuar**, tal como están en `docs/RETOMAR.md` (actualizalos si cambiaron). Al cerrar una fase o una sesión, actualizá `docs/RETOMAR.md` y subilo a GitHub.

Flor revisa en su computadora (localhost) antes de aprobar cada fase. Cada vez que subas cambios, avisale y recordale cómo traerlos: GitHub Desktop → Fetch origin → Pull origin, después `npm install` y `npm run dev` (pasos en `docs/RETOMAR.md`).

## Qué estamos construyendo

Plantillas web funcionales que adapto a cada comercio argentino. Cobro un proyecto inicial más un mantenimiento mensual. Esta es la **plantilla 1: tienda online con cierre por WhatsApp**, con **admin propio** para el comercio. Ver `docs/01-producto.md`.

## Stack (decidido)

- **Astro**, publicado en **Cloudflare Pages**.
- **Google Sheets + Google Apps Script** como base de datos detrás del admin, en la cuenta de Google del comercio. **Google Drive** del comercio para las fotos.
- Sin Supabase en esta plantilla (sumaría un costo mensual al cliente). Sin pasarelas de pago.
- Costo para el cliente: solo el dominio.

## Estructura del repositorio

```
plantillas/
├── CLAUDE.md
├── docs/                 ← especificación (leer antes de codear)
├── compartido/           ← admin, carrito, componentes, tokens de estilo, capa de datos
├── tienda-whatsapp/      ← esta plantilla (demo: tienda de ropa ficticia)
└── apps-script/          ← código de Google Apps Script y planilla modelo
```

Plantillas futuras (no construir ahora): tienda con pago online, reservas con pago, turnos con login, menú de restaurante. El admin de `compartido/` se va a reutilizar en ellas: diseñalo modular.

## Reglas que no se rompen

1. **El contenido nunca va dentro del código.** Productos, categorías, pedidos y textos de la tienda vienen de la capa de datos o de la configuración.
2. **Configuración por cliente en un solo archivo** (`tienda-whatsapp/config/tienda.config.*`): nombre, WhatsApp, estilo, color de marca, redes, horarios, dirección del local, texto de privacidad. (Las horas de reserva viven en la planilla porque las usa el servidor: ver `docs/07-decisiones.md`, D-01.)
3. **Estilos en tokens** en un solo archivo. Por ahora, estilo neutro de bocetos; el diseño final se aplica cambiando tokens, no componentes.
4. **Capa de datos detrás de una interfaz** con implementaciones intercambiables (`local` para testear, `appsScript` para producción). El resto del código no sabe cuál se usa.
5. **Los errores se arreglan en la plantilla, nunca en el repo de un cliente.** En el repo de un cliente solo cambian configuración, estilo y contenido.
6. **La adaptación por cliente es de estilo, no de estructura.**
7. **Accesibilidad básica siempre:** elementos reales (`button`, `a`, `input` con `label`), foco visible, áreas táctiles de 44 px o más, errores que digan cómo corregir, estado no comunicado solo con color.
8. **Mobile-first.** El comprador llega desde Instagram con un Android de gama media. El dueño del comercio puede ser poco técnico y no tan joven.
9. Nada de datos personales en URLs ni en logs. Pedir solo los datos necesarios (Ley 25.326).

## Índice de docs

- `docs/00-plan-fase-0.md` — plan de la Fase 0 y puntos a revisar.
- `docs/01-producto.md` — qué es, para quién, propuesta de valor, decisiones y por qué.
- `docs/02-tienda.md` — pantallas y comportamiento del sitio del comprador.
- `docs/03-admin.md` — pantallas y comportamiento del admin del comercio.
- `docs/04-modelo-de-datos.md` — planilla de Google, estados, reglas de stock y reservas.
- `docs/05-arquitectura-y-fases.md` — arquitectura, fases de trabajo y preguntas técnicas abiertas.
- `docs/06-textos.md` — textos de interfaz y mensaje de WhatsApp.
- `docs/RETOMAR.md` — links para revisar lo hecho y prompt para continuar.
- `docs/07-decisiones.md` — registro de decisiones posteriores a la especificación (manda sobre los demás).
- `docs/referencia/prototipo-tienda.html` — prototipo navegable de un solo archivo con el comportamiento esperado (referencia de flujos y textos, no base de código).
