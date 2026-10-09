# Guía: conectar la tienda de un cliente con Google y Cloudflare

Paso a paso para pasar una tienda de **modo de prueba** (datos en el navegador) a **datos reales** (planilla de Google del comercio). Está pensada para hacerla vos, sin programar. Calculá entre una y dos horas la primera vez.

> ⚠️ Los nombres de botones y menús de Google y Cloudflare cambian seguido. Si algo no coincide, buscá el más parecido y avisame para corregir la guía. Los límites de los planes gratis están en `08-investigacion-fase-2.md` (punto 12: algunos falta confirmarlos en las páginas oficiales).

## Cómo funciona (en una frase)

La tienda y el **puente** viven en Cloudflare. El puente es el único que habla con Google: le pide el catálogo a la planilla, le pasa los pedidos y verifica quién entra al admin. Google guarda todo en la planilla y las fotos en Drive del comercio.

```
Comprador / dueña ──► Cloudflare (tienda + puente) ──► Apps Script ──► Planilla + Drive
```

## Qué vas a necesitar

| Qué | De quién | Costo |
|---|---|---|
| Cuenta de Google **del negocio** (idealmente una nueva, solo para la tienda) | Del comercio | Gratis |
| Cuenta de Cloudflare | Tuya (la que usás para todos tus clientes) o del comercio | Gratis |
| Proyecto de Google Cloud para el botón "Iniciar sesión con Google" | En la cuenta del negocio | Gratis |
| Dominio (opcional al principio: sirve la dirección `.workers.dev`) | Del comercio | Lo único que se paga |

## Datos que vas a ir juntando

Anotalos en un lugar seguro (un gestor de contraseñas, no un chat ni un mail). Los marcados 🔒 son **secretos**: con ellos alguien podría escribir en la planilla.

| Dato | Dónde se carga |
|---|---|
| 🔒 Dirección de la aplicación web de Apps Script (termina en `/exec`) | Cloudflare → secreto `APPS_SCRIPT_URL` |
| 🔒 Clave secreta de la planilla | Cloudflare → secreto `APPS_SCRIPT_SECRETO` |
| 🔒 Clave secreta de Turnstile | Cloudflare → secreto `TURNSTILE_SECRETO` |
| Clave de sitio de Turnstile (pública) | `tienda-whatsapp/config/tienda.config.ts` → `turnstileSiteKey` |
| ID de cliente de Google (público) | `tienda-whatsapp/config/tienda.config.ts` → `googleClientId` |

Los secretos **nunca** van en GitHub, ni en el archivo de configuración, ni por WhatsApp.

---

## Paso 1 · La planilla y el código de Google

1. Entrá a Google con la cuenta **del negocio**.
2. Creá una planilla nueva en Google Sheets. Ponele un nombre claro, por ejemplo "Tienda — no borrar".
3. En la planilla: **Extensiones → Apps Script**. Se abre el editor de código.
4. Borrá lo que haya y pegá todo el contenido de `apps-script/Codigo.gs` (en GitHub, botón **Copy raw file**). Guardá con el ícono del disquete.
5. Arriba, en la lista de funciones, elegí **configurarPlanilla** y tocá **Ejecutar**.
6. Google pide permisos. Va a aparecer **"Google no verificó esta app"**: es normal, porque el código es tuyo y no está publicado en una tienda de Google. Tocá **Configuración avanzada → Ir a (nombre del proyecto) (no seguro) → Permitir**.
   - Los permisos que pide: ver y editar esta planilla, crear la carpeta de fotos en Drive, conectarse a servicios externos y ejecutarse sola cada 10 minutos (para vencer reservas).
7. Abajo, en el **Registro de ejecución**, aparece: "Listo. Clave secreta para Cloudflare…". Copiá esa clave 🔒. Si la perdés, ejecutá **verClaveSecreta**.
8. Volvé a la planilla: ahora tiene las pestañas `Config`, `Categorias`, `Productos`, `Stock`, `Pedidos`, `PedidoItems` y `Registro`, y en Drive hay una carpeta nueva para las fotos.
9. Cargá las **categorías** en la pestaña `Categorias` (las define quien mantiene el sitio, ver `04-modelo-de-datos.md`). El resto (productos, stock, fotos) lo carga el comercio desde el admin.
10. En `Config`, revisá `correosAdmin`: tiene el correo del negocio. Si otra persona tiene que entrar al admin, agregá su correo separado por coma.

## Paso 2 · Publicar el código como aplicación web

1. En el editor de Apps Script: **Implementar → Nueva implementación**.
2. En el engranaje de "Tipo", elegí **Aplicación web**.
3. Completá:
   - **Ejecutar como:** Yo (la cuenta del negocio).
   - **Quién tiene acceso:** Cualquier persona.
4. **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`) 🔒.

> Por qué "cualquier persona": el puente de Cloudflare no tiene cuenta de Google. Igual, sin la clave secreta, el código no responde nada.

**Si después cambiás el código** (por ejemplo, porque arreglamos algo en la plantilla): pegá el código nuevo y andá a **Implementar → Administrar implementaciones → lápiz → Versión: nueva versión → Implementar**. Así se mantiene la misma URL.

## Paso 3 · Botón "Iniciar sesión con Google" (ID de cliente)

1. Entrá a https://console.cloud.google.com con la cuenta del negocio.
2. Creá un proyecto nuevo (por ejemplo, "Tienda admin").
3. Buscá **Google Auth Platform** (o "Pantalla de consentimiento de OAuth") y configurala:
   - Nombre de la app: el de la tienda. Correo de asistencia: el del negocio.
   - Público: **Externo**.
   - No agregues permisos extra: alcanza con nombre y correo, que no necesitan revisión de Google (⚠️ confirmarlo en la consola, punto 12.5 de la Fase 2).
   - Publicá la app ("En producción"). Si la dejás "En prueba", agregá como usuarios de prueba a todos los correos del admin.
4. En **Clientes → Crear cliente**: tipo **Aplicación web**.
5. En **Orígenes autorizados de JavaScript**, agregá la dirección de la tienda (por ejemplo `https://tienda-cliente.workers.dev` y, si hay, `https://www.dominio.com.ar`). Para probar en tu compu, agregá también `http://localhost:8787`.
6. Copiá el **ID de cliente** (termina en `.apps.googleusercontent.com`). Es público: va en la configuración.

## Paso 4 · Anti-robots (Turnstile)

1. En el panel de Cloudflare: **Turnstile → Agregar widget**.
2. Nombre: el de la tienda. Dominios: los mismos del paso 3 (sin `https://`), más `localhost` para probar.
3. Modo: **Administrado** (casi siempre invisible; si Cloudflare duda, muestra una casilla).
4. Copiá la **clave de sitio** (pública) y la **clave secreta** 🔒.

## Paso 5 · Configurar la tienda

En el repo del cliente, `tienda-whatsapp/config/tienda.config.ts`:

```ts
url: 'https://www.dominio.com.ar',
whatsapp: '5491112345678',        // el que recibe los pedidos (549 + área + número)
whatsappSoporte: '5491187654321', // el tuyo, para la ayuda del admin
datos: 'appsScript',
googleClientId: '123…apps.googleusercontent.com',
turnstileSiteKey: '0x4AAA…',
```

Y en `tienda-whatsapp/wrangler.jsonc`, cambiá `"name"` por el nombre del proyecto del cliente (sin espacios, por ejemplo `"tienda-lola"`). Subí los cambios a GitHub.

## Paso 6 · Publicar en Cloudflare

1. En el panel de Cloudflare: **Workers y Pages → Crear → Importar un repositorio** y elegí el repo del cliente en GitHub.
2. Configuración de compilación (⚠️ los nombres de los campos pueden variar):
   - Directorio raíz: el del repo (vacío).
   - Comando de compilación: `npm run build`
   - Comando de implementación: `npm run desplegar`
3. Cuando termine, en el Worker: **Configuración → Variables y secretos → Agregar**, tipo **Secreto**, y cargá los tres 🔒: `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRETO` y `TURNSTILE_SECRETO`.
4. Desde ahora, cada vez que subas cambios a la rama principal del repo del cliente, Cloudflare publica solo.

## Paso 7 · Freno por conexión (regla de límite)

Necesita que el dominio del cliente esté en Cloudflare (no funciona con `.workers.dev`).

1. En el dominio: **Seguridad → WAF → Reglas de límite de velocidad → Crear regla**.
2. Si la ruta es igual a `/api/pedido` y el método es `POST`: como máximo **10 pedidos por minuto** por IP; acción: **Bloquear** durante 1 minuto (⚠️ confirmar qué ventanas incluye el plan gratis, punto 12.4).

## Paso 8 · Probar antes de pasarle la tienda al cliente

- [ ] La tienda muestra las categorías de la planilla.
- [ ] Entrás al admin con la cuenta del negocio. Con otra cuenta de Google, te dice que no tiene acceso.
- [ ] Cargás un producto con foto: aparece en la tienda (puede tardar hasta un minuto, por la caché) y la foto está en la carpeta de Drive.
- [ ] Hacés un pedido desde el celular: se abre WhatsApp, el pedido aparece en el admin y en la pestaña `Pedidos`.
- [ ] Confirmás el pedido: baja el stock. "Deshacer" lo vuelve atrás.
- [ ] Un tercer pedido pendiente con el mismo número muestra el aviso "Ya tenés pedidos esperando confirmación".
- [ ] "Cancelar los pedidos pendientes de este número" los cancela todos.
- [ ] Mandar dos veces el mismo pedido exacto muestra "Ya enviaste este mismo pedido".
- [ ] Al rato (más de 24 h, o cambiando `horasReserva` a 1 para probar), un pendiente pasa solo a "Vencida".

## Probar con Google en tu computadora (opcional)

1. En la carpeta `tienda-whatsapp`, copiá `.dev.vars.ejemplo` como `.dev.vars` y completá la URL y la clave secreta. Ese archivo no se sube a GitHub.
2. En `tienda.config.ts`, poné `datos: 'appsScript'` y tu `googleClientId` (sin subir ese cambio si es la plantilla).
3. Corré `npm run probar:google` y abrí http://localhost:8787.

## Si algo se filtra o sale mal

- **Se filtró la clave secreta:** en Apps Script ejecutá **cambiarClaveSecreta** y cargá la nueva en Cloudflare. La vieja deja de funcionar al instante.
- **Una persona ya no tiene que entrar al admin:** sacá su correo de `correosAdmin` en la pestaña `Config`.
- **Llegan pedidos falsos:** cancelalos con el botón del admin y, si siguen, avisame para endurecer los límites de la pestaña `Config`.
- **"Algo falló de nuestro lado":** en Apps Script, **Ejecuciones** muestra los errores; en Cloudflare, el Worker tiene **Registros**. Ninguno guarda datos personales de compradores.

## Cuidados (seguridad y datos personales)

- La planilla tiene datos personales de compradores (Ley 25.326). Compartila solo con quien la necesite y con la cuenta del negocio protegida con verificación en dos pasos.
- Las pestañas están protegidas "con aviso": si alguien edita a mano, Google pregunta antes. Lo más seguro es tocar la planilla solo desde el admin.
- Las fotos se sirven a través del puente: la carpeta de Drive **no** hay que compartirla.
