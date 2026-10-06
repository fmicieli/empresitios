# 00 · Plan de la Fase 0

Fecha: 6 de octubre de 2026. Estado: **aprobado por Flor** el 6/10/2026. Las respuestas a los puntos a revisar están en `07-decisiones.md`.

Este documento responde a la Fase 0 de `05-arquitectura-y-fases.md`: estructura, dependencias, capa de datos, admin en `compartido/`, orden de la Fase 1, y lo que encontré contradictorio, incompleto o riesgoso en la documentación.

> Nota: el repositorio se llama `empresitios`. Su raíz cumple el papel de la carpeta `plantillas/` de `CLAUDE.md`.

---

## 1. Estructura de carpetas

```
empresitios/
├── CLAUDE.md
├── package.json                 ← "espacio de trabajo": une compartido/ y tienda-whatsapp/
├── docs/
├── compartido/                  ← todo lo reutilizable entre plantillas
│   ├── estilos/
│   │   └── tokens.css           ← colores, tipografías, radios, espacios (UN solo archivo)
│   ├── textos/
│   │   └── textos.ts            ← todos los textos de interfaz de 06-textos.md
│   ├── datos/                   ← capa de datos
│   │   ├── interfaz.ts          ← el "contrato" dataStore (qué se puede pedir)
│   │   ├── reglas.ts            ← stock libre, reservas, vencimientos, normalizaciones
│   │   ├── local/               ← implementación de prueba (navegador)
│   │   ├── appsScript/          ← implementación real (Fase 3)
│   │   └── index.ts             ← elige cuál usar según la configuración
│   ├── carrito/                 ← carrito guardado en el navegador del comprador
│   ├── whatsapp/                ← armado de mensajes y links wa.me
│   ├── componentes/             ← botones, campos, avisos, chips, diálogos…
│   └── admin/                   ← el admin completo, por módulos
│       ├── nucleo/              ← ingreso, navegación, avisos con "Deshacer"
│       ├── pedidos/             ← módulo Pedidos
│       └── productos/           ← módulo Productos
├── tienda-whatsapp/             ← esta plantilla (demo: tienda de ropa ficticia)
│   ├── config/
│   │   └── tienda.config.ts     ← TODO lo que cambia por cliente
│   ├── datos-ejemplo/           ← la tienda de ropa ficticia
│   ├── public/                  ← fotos de ejemplo, ícono
│   └── src/pages/               ← páginas: catálogo, ficha, carrito, datos, confirmación, /admin
└── apps-script/                 ← (Fase 3) código de Google Apps Script y planilla modelo
```

Idea general: **`tienda-whatsapp/` casi no tiene lógica**. Arma las páginas usando piezas de `compartido/` y su archivo de configuración. Una plantilla futura (reservas, turnos) reutiliza `compartido/` y suma sus propios módulos al admin.

## 2. Dependencias

Pocas, conocidas y gratuitas. Cada una tiene un motivo:

| Herramienta | Para qué | Por qué esta |
| --- | --- | --- |
| **Astro 7** (decidido) | Arma el sitio y lo publica como archivos estáticos | Rápido en celulares de gama media: manda poco código |
| **Preact** | Las partes interactivas (carrito, ficha, formulario, admin) | Es como React pero pesa ~4 KB. El carrito, el stock en vivo y el admin necesitan interactividad; escribirla "a mano" sería más difícil de mantener |
| **TypeScript** | Que el código avise errores antes de que lleguen al comprador | Viene integrado en Astro, no suma nada a instalar |
| **Vitest** (solo para desarrollo) | Pruebas automáticas de las reglas de stock, reservas y números | Esas reglas son lo más delicado; quiero poder comprobarlas en segundos cada vez que algo cambie |

Más adelante (no en Fase 1): `clasp` (herramienta oficial de Google para subir código a Apps Script) y quizás un empaquetador del admin en un solo archivo (ver riesgo **R1**).

Requisito para correrlo en tu compu: Node.js 22.12 o más nuevo (lo pide Astro 7). Te dejo los pasos de instalación con la Fase 1.

## 3. Capa de datos

Todo el sitio habla con **un solo objeto, `dataStore`**, que cumple el contrato de `05-arquitectura-y-fases.md`. La tienda y el admin nunca saben si atrás hay datos de prueba o Google.

```
Pantallas (tienda y admin)
        │  usan solo
        ▼
   dataStore  ── contrato fijo (interfaz.ts)
        │
   ┌────┴─────────────┐
 local            appsScript
(Fase 1)          (Fase 3)
navegador         Google Sheets + Drive
```

- **`reglas.ts`**: las reglas de `04-modelo-de-datos.md` escritas una sola vez (stock libre = stock − reservado, ignorar pendientes vencidos, nunca negativo, normalizar precio y WhatsApp, búsqueda sin tildes). Se prueban con Vitest. En la Fase 3 las mismas reglas se reescriben en Apps Script, y las pruebas sirven para comparar que den lo mismo.
- **`local`**: guarda la "planilla" en el navegador (las mismas pestañas: Config, Categorias, Productos, Stock, Pedidos, PedidoItems, Registro), con **demora simulada de 1 a 3 s** y la opción de **simular errores** (sin conexión, error del servidor) para diseñar esos estados.
- **`appsScript`** (Fase 3): llama a Google. Su forma exacta depende de lo que salga de la Fase 2.
- El contrato suma dos cosas que faltan en la propuesta: `getProducto(id)` y `verificarCarrito(items)` (para marcar líneas agotadas antes de "Continuar").

## 4. El admin en `compartido/`

- Se arma como **una mini-aplicación independiente** (una sola página con navegación interna), no como páginas sueltas de Astro. Motivo en **R1**: muy probablemente en producción el admin lo tenga que servir Google y no Cloudflare. Si es independiente, se puede montar en los dos lugares sin reescribirlo.
- **Módulos**: `nucleo` (ingreso, barra inferior / menú lateral, avisos con "Deshacer") + un módulo por sección (`pedidos`, `productos`). Cada plantilla elige qué módulos activa. Reservas o turnos serían módulos nuevos.
- En la Fase 1 se ve en `/admin` del mismo sitio, con ingreso simulado. Así comparte los datos del navegador con la tienda.

## 5. Orden de trabajo de la Fase 1

Cada paso termina con algo que podés abrir y probar.

1. **Base**: proyecto Astro, `tokens.css` con el estilo neutro del prototipo, `textos.ts`, `tienda.config.ts`, componentes básicos accesibles (botón, campo con etiqueta y error, chip, aviso).
2. **Capa de datos `local` + reglas + datos de ejemplo** (tienda de ropa con los casos de `05`: talle agotado, 1 unidad, sin colores, sin stock, con código, colores sin talles) y sus pruebas automáticas.
3. **Tienda: catálogo, menú y búsqueda.**
4. **Tienda: ficha de producto y carrito** (con líneas agotadas, precios cambiados, productos ocultos).
5. **Tienda: datos del comprador, enviando, pedido registrado y mensaje de WhatsApp**, incluido el estado de error con "Intentar de nuevo".
6. **Admin: ingreso simulado, navegación y Pedidos** (lista, filtros, detalle, confirmar/cancelar con "Deshacer", vencidos sin stock).
7. **Admin: Productos** (lista, ajuste rápido con guardado automático, formulario con fotos achicadas en el navegador, vista previa, eliminar).
8. **Panel de herramientas de prueba** (solo en desarrollo): volver a datos de ejemplo, adelantar el reloj para vencer reservas, cargar el WhatsApp de la tienda, forzar errores.
9. **Repaso de accesibilidad y mobile** (foco, 44 px, lectores de pantalla en lo básico) e **instrucciones** para correrlo y probarlo desde el celular en la misma red wifi.

---

## 6. Cosas para revisar antes de seguir

Ordenadas por importancia. Las marcadas **(decidís vos)** son de producto: no las cambio sin tu OK. Las de límites y cuotas de Google las verifico con documentación oficial en la Fase 2; acá van como sospechas, no como afirmaciones.

### R1 · Dónde vive el admin (riesgo técnico alto)
La documentación quiere que el admin esté en `compartido/` (o sea, dentro del sitio de Cloudflare) **y** que solo entre la cuenta del negocio publicando el Apps Script "con acceso exclusivo". Sospecho que esas dos cosas no se combinan bien: si el script solo acepta a su dueño, un sitio en otro dominio no puede hablarle desde el navegador; lo más probable es que **el admin lo tenga que servir el propio Apps Script** (dentro de una página de Google).
Efectos posibles: una barra de aviso de Google arriba del admin, una dirección fea (`script.google.com/…`) y problemas conocidos cuando el celular tiene varias cuentas de Google abiertas a la vez.
**Recomendación:** construir el admin como mini-aplicación independiente (punto 4) para que funcione en cualquiera de los dos lugares, y decidir en la Fase 2 con pruebas reales.

### R2 · La tienda también necesita hablar con Google, y en público
La tienda (cualquier comprador, sin cuenta) tiene que leer stock y crear pedidos. Eso no puede pasar por un script "solo para el dueño". Hacen falta **dos puertas**: una pública y muy limitada para la tienda, y una privada para el admin. La documentación habla de una sola publicación. Lo resuelvo en la Fase 2; te lo marco porque cambia la guía de alta de cada cliente (dos publicaciones en vez de una).

### R3 · Pedidos falsos que bloquean el stock (riesgo alto)
Como el pedido reserva stock 24 h sin pedir nada verificable, alguien puede mandar pedidos falsos y "vaciar" la tienda por un día. Está en la Fase 2, pero es lo más delicado del producto. Ideas a evaluar: tope de pedidos pendientes por número de WhatsApp y por conexión, tope de unidades por pedido, un control anti-robots invisible de Cloudflare (Turnstile, a verificar si es gratis y sin fricción) y un botón en el admin para "liberar todo lo de este número".

### R4 · Fotos nuevas y "Ya aparece en la tienda"
La Fase 2 propone leer fotos "al publicar" y servirlas optimizadas sin pasar por Drive. Pero el dueño carga un producto desde el admin y el aviso dice "Ya aparece en la tienda": si las fotos se preparan al publicar, **no aparecería hasta la próxima publicación**.
**Recomendación:** que el navegador del dueño, al subir, ya genere la foto en WebP en 2 tamaños, y que la tienda las tome de Drive a través de una función de Cloudflare con caché. Lo confirmo en la Fase 2.

### R5 · Configuración en dos lugares (contradicción) **(decidís vos)**
`CLAUDE.md` dice que WhatsApp, horarios, dirección, horas de reserva y texto de privacidad van en `tienda.config`. `04-modelo-de-datos.md` los pone en la pestaña `Config` de la planilla. Si están en los dos, tarde o temprano no coinciden.
**Recomendación:** en la planilla solo lo que el servidor necesita para funcionar (`horasReserva`, `proximoNumero`, `whatsappTienda` para el control anti-spam). Todo lo demás, en `tienda.config`. Cambiar el horario implicaría una publicación nueva (la hacés vos, no el comercio). ¿Te sirve así, o querés que el comercio pueda cambiar horarios/dirección sin pedírtelo?

### R6 · Categoría guardada como texto
`Productos.categoria` guarda "Mujer › Remeras". Si mañana cambiás "Mujer" por "Ellas", los productos quedan huérfanos.
**Recomendación (cambio técnico, no de producto):** darle a cada fila de `Categorias` un `id` que nunca cambia y guardar ese id en el producto. En la pantalla se sigue viendo "Mujer › Remeras".

### R7 · El WhatsApp del comprador **(decidís vos)**
- "Al menos 8 dígitos" deja pasar números incompletos. Un celular argentino completo tiene 10 dígitos (código de área + número), sin el 0 ni el 15.
- Sacar el "15" automáticamente es poco confiable: los códigos de área tienen 2, 3 o 4 dígitos, así que no siempre se sabe dónde está el 15.
- `wa.me` para celulares argentinos necesita `549…`; "si empieza con 54, dejarlo" deja pasar `54 11…` sin el 9.

**Recomendación:** un solo campo como está, pero validando que, sacando +54, 9, 0 y 15 donde se pueda detectar, queden **10 dígitos**; si no, el error ya escrito ("Escribí tu WhatsApp con código de área, por ejemplo 11 5555 0000."). Guardar lo que escribió y el normalizado, como propone la doc. Alternativa: dos campos (código de área / número), más seguro pero con más fricción. ¿Cuál preferís?

### R8 · "Deshacer" y el stock que se recorta a 0 (caso borde)
Si se confirma "igual" un pedido vencido y el stock se recorta a 0, después "Deshacer" o "Cancelar" suman la cantidad completa y **el stock queda más alto que antes**.
**Recomendación:** guardar en `Registro` cuánto se descontó de verdad en cada variante y devolver exactamente eso.

### R9 · Abrir WhatsApp automáticamente
Abrir `wa.me` solo, después de esperar al servidor, a veces lo bloquea el navegador (sobre todo en iPhone) o saca al comprador de la tienda. El botón de respaldo ya está previsto; además voy a guardar el pedido confirmado en el navegador para que, si vuelve atrás, vea de nuevo su número y no lo pierda.

### R10 · Fase 1: qué se comparte y qué no
Con datos locales, tienda y admin comparten datos **solo en el mismo navegador del mismo dispositivo**. Si comprás desde el celular, el pedido no aparece en el admin abierto en la compu. Es lo esperado hasta la Fase 3; te lo aclaro para que no parezca un error al testear.

### R11 · Legales
- El texto de privacidad está pendiente de revisión legal (ya está en la doc). Sumo: la Ley 25.326 pide inscribir las bases de datos personales ante la AAIP; conviene que lo consulte un abogado para tus clientes.
- La pantalla "app no verificada" de Google: si pasa a usarse con muchas cuentas, Google puede pedir verificación. Lo reviso en la Fase 2.

### R12 · Cloudflare Pages
Cloudflare viene empujando su producto "Workers" por sobre "Pages" para sitios nuevos. Antes de la Fase 4 verifico en su documentación oficial cuál conviene hoy y que siga siendo gratis con uso comercial.

### Datos que me faltan (no frenan la Fase 1)
- Fotos de ejemplo: uso fotos neutras (placeholders) generadas; si tenés fotos propias libres de derechos, mejor.
- Nombre de la tienda ficticia: propongo **"Tienda Modelo"**, salvo que prefieras otro.
