# Publicar la demo y checklist por cliente (Fase 4)

## Qué es la demo

Es la plantilla publicada en internet con la tienda ficticia "Tienda Modelo", en **modo de prueba** (D-18):

- Cada visitante tiene su propia copia de la tienda en su navegador. Puede comprar, entrar al admin (ingreso simulado), confirmar pedidos y cargar productos sin afectar a nadie.
- No usa Google ni guarda datos de nadie en un servidor.
- **No tiene WhatsApp por defecto.** Quien la prueba carga su número en "Herramientas de prueba". Si toca un botón de WhatsApp sin haberlo cargado, la demo se lo explica y le ofrece cargarlo.
- No aparece en buscadores (`noindex`).
- Al compartir el link por WhatsApp o Instagram, la vista previa muestra la imagen `compartir.png` y, en las fichas, el nombre y el precio del producto.

Costo: **cero**. Usa el plan gratis de Cloudflare Workers y la dirección `.workers.dev` (⚠️ límites del plan gratis sin confirmar en la página oficial: `08-investigacion-fase-2.md`, punto 12.3).

---

## Publicarla (una sola vez, unos 15 minutos)

Lo hacés vos, con tu cuenta. Yo no puedo crear cuentas ni entrar a las tuyas.

### 1. Pasar los cambios a `main`

Cloudflare publica la rama `main` (D-18). Antes de conectarlo, aprobá y uní el pull request https://github.com/fmicieli/empresitios/pull/2 (**Merge pull request**). Desde ahí, lo que esté en `main` es lo publicado.

### 2. Crear la cuenta de Cloudflare

1. Entrá a https://dash.cloudflare.com/sign-up y creá una cuenta con tu correo de trabajo. Es gratis y no pide tarjeta (⚠️ confirmalo al registrarte).
2. Activá la verificación en dos pasos (**Perfil → Autenticación**). Esa cuenta va a tener las tiendas de tus clientes.

### 3. Conectar el repo

⚠️ Los nombres de los menús de Cloudflare cambian seguido. Si algo no coincide, buscá el más parecido y avisame.

1. En el panel: **Workers y Pages → Crear → Importar un repositorio**.
2. Conectá tu cuenta de GitHub y elegí `fmicieli/empresitios`. Cuando pregunte, dale acceso **solo a ese repositorio**.
3. Completá:
   - **Nombre del proyecto:** `tienda-modelo`. Tiene que ser igual al `"name"` de `tienda-whatsapp/wrangler.jsonc`.
   - **Rama de producción:** `main`.
   - **Directorio raíz:** vacío (la raíz del repo).
   - **Comando de compilación:** `npm run build`
   - **Comando de implementación:** `npm run desplegar`
4. **Guardar e implementar.** La primera vez tarda unos minutos. Al terminar, te da la dirección, del estilo `https://tienda-modelo.TU-SUBDOMINIO.workers.dev`.

No hace falta cargar ningún secreto: la demo no usa Google.

### 4. Probarla

Desde el celular:

- [ ] Abre la portada, con la barra "Modo de prueba" arriba.
- [ ] Un botón de WhatsApp sin número muestra el aviso y "Cargar número" abre las herramientas.
- [ ] Con tu número cargado, una compra abre WhatsApp con el mensaje del pedido.
- [ ] El admin (`/admin/`) entra con el ingreso simulado y muestra el pedido.
- [ ] Una dirección inventada (por ejemplo `/hola/`) muestra "No encontramos esta página".
- [ ] Mandá el link de la portada y el de un producto a un chat tuyo de WhatsApp: la vista previa muestra la imagen y, en el producto, nombre y precio (WhatsApp a veces guarda la primera vista previa; si cambiaste algo, probá con otro chat).

### 5. Después

Cada vez que se une un cambio a `main`, Cloudflare vuelve a publicar solo. No tenés que hacer nada más.

---

## Checklist por cliente

Qué se cambia en el repo de cada cliente (regla 5: los errores se arreglan en la plantilla, no acá). Las respuestas salen del cuestionario `10-preguntas-al-cliente.md`; la conexión con Google y Cloudflare está paso a paso en `09-guia-conectar-cliente.md`.

### Configuración (`tienda-whatsapp/config/tienda.config.ts`)

- [ ] `nombre` y `descripcion`
- [ ] `url`: el dominio del cliente
- [ ] `whatsapp`: el que recibe los pedidos. **Obligatorio**: si está vacío, la tienda conectada no se publica (lo frena la compilación).
- [ ] `whatsappSoporte`: el tuyo
- [ ] `direccionLocal`, `horarios`, `redes`
- [ ] `textoPrivacidad`, con revisión legal
- [ ] `estilo`: logo, color de marca y color del texto sobre la marca
- [ ] `imagenCompartir`: imagen de 1200 × 630 px en `public/` (PNG o JPG)
- [ ] `datos: 'appsScript'`, `googleClientId`, `turnstileSiteKey`
- [ ] `clave`: un identificador sin espacios, distinto por cliente (por ejemplo `tienda-lola`)

### Otros archivos

- [ ] `tienda-whatsapp/wrangler.jsonc` → `"name"`: el nombre del proyecto en Cloudflare
- [ ] `compartido/estilos/tokens.css` → tipografía, colores y bordes del estilo elegido (regla 3)
- [ ] `tienda-whatsapp/public/` → logo, favicon y `compartir.png` del cliente; borrar `fotos-demo/`

### Planilla (pestaña `Config`)

- [ ] `correosAdmin`
- [ ] `horasReserva`, `maxUnidadesPorProducto`, `maxUnidadesPorPedido`, `maxPendientesPorWhatsapp`, `bloquearPedidosRepetidos`
- [ ] Pestaña `Categorias`

### Cloudflare

- [ ] Proyecto conectado al repo del cliente, rama `main`
- [ ] Secretos: `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRETO`, `TURNSTILE_SECRETO`
- [ ] Dominio propio conectado y regla de límite de pedidos (guía `09`, paso 7)

### Antes de entregar

- [ ] La lista de pruebas de la guía `09`, paso 8
- [ ] La vista previa del link en WhatsApp con la foto de un producto real
