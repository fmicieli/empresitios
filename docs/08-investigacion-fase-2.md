# 08 · Fase 2 · Investigación técnica

Fecha de consulta de todas las fuentes: **8 de octubre de 2026**. Sin código de producción.

> **Cómo leer este documento.** Cada sección explica el tema en lenguaje claro, dice qué recomiendo y por qué, y termina con sus fuentes.
>
> **Aviso importante sobre las fuentes.** Desde la máquina en la nube donde trabajo, la red bloquea `developers.google.com` y `developers.cloudflare.com`, así que **no pude abrir las páginas oficiales directamente**. Usé un buscador web que sí lee esas páginas y otras de la comunidad. Por eso cada dato lleva una marca:
> - ✅ **Oficial**: el dato viene de la página oficial (Google o Cloudflare), leída a través del buscador.
> - ⚠️ **A confirmar**: el dato viene de fuentes no oficiales, o las fuentes no coinciden. Hay que mirarlo en la página oficial antes de la Fase 3 (lista al final, punto 12).

---

## Resumen: lo que recomiendo

| Tema | Recomendación |
| --- | --- |
| Arquitectura | Tienda en Cloudflare + un **"puente"** chico en Cloudflare entre la tienda y Google. El navegador nunca habla directo con Google. |
| Dónde vive el admin | **Opción B:** el admin en el sitio de la tienda (`tutienda.com/admin`) con **"Iniciar sesión con Google"**. El puente verifica que sea la cuenta del negocio. **(decidís vos, punto 2)** |
| Stock en vivo | El puente guarda el catálogo en memoria 30 a 60 segundos. Al enviar un pedido, el stock se verifica siempre en vivo contra la planilla. |
| Pedidos simultáneos | Bloqueo de Google (LockService) al crear y confirmar pedidos. |
| Vencimiento de reservas | Proceso automático cada 10 minutos, más el vencimiento "al leer" que ya existe. |
| Pedidos falsos | Las 4 defensas que pediste: Turnstile, tope por número de WhatsApp, máximo de unidades y botón para cancelar todos los pendientes de un número. **(decidís los números, punto 9)** |
| Fotos | Siguen guardadas en el Drive del comercio. El navegador las achica en WebP al subirlas y el puente las sirve con caché. **(te explico la alternativa y decidís, punto 10)** |
| Publicación | **Cloudflare Workers** en vez de Pages: es de la misma empresa, también gratis, y permite tener la tienda y el puente en un solo lugar. **(decidís vos, punto 4)** |
| Empleados (futuro) | Con la opción B del admin sale fácil: una lista de correos permitidos en la planilla. |

---

## 1. Cuotas de Apps Script para cuentas gratuitas

**Pregunta:** ¿alcanzan para una tienda chica con stock en vivo y vencimiento automático de reservas?

**Respuesta corta: sí, siempre que no le pidamos a Google una consulta por cada visita.** El límite que más importa no es por día, sino de **ejecuciones simultáneas**.

| Límite (cuenta gratuita, gmail.com) | Valor | Estado |
| --- | --- | --- |
| Tiempo máximo de cada ejecución | 6 minutos | ✅ Oficial |
| Ejecuciones simultáneas por usuario | 30 | ✅ Oficial |
| Ejecuciones simultáneas por script | 1.000 | ✅ Oficial |
| Disparadores (procesos automáticos) por usuario y por script | 20 | ✅ Oficial |
| Tiempo total de disparadores por día | 90 minutos | ⚠️ El buscador lo atribuye a la página oficial, pero no la pude leer completa |
| Llamadas a otros sitios (URL Fetch) por día | 20.000 | ⚠️ |
| Cuándo se renuevan las cuotas | 24 h después de la primera llamada (no a medianoche) | ✅ Oficial |

**Lo que esto significa para la tienda:**
- **Todo se ejecuta "como el dueño".** El script corre con la cuenta del comercio, así que todas las visitas de todos los compradores cuentan como un mismo usuario. Si 30 personas tocan algo en el mismo segundo, la número 31 recibiría un error. Con una tienda chica es raro, pero en un lanzamiento con promo en Instagram puede pasar. **Por eso el puente guarda el catálogo en memoria** (punto 3): así la mayoría de las visitas no llegan a Google.
- **Vencimiento automático:** un disparador cada 10 minutos son 144 ejecuciones por día. Si cada una tarda unos 3 segundos, son unos 7 minutos de los 90 diarios. Alcanza de sobra.
- **Riesgo:** Google puede cambiar las cuotas sin aviso. Lo mitigamos con la caché y con mensajes de error claros ("Probá de nuevo en unos segundos"), que ya existen desde la Fase 1.

**Fuentes:** [Cuotas de Apps Script (oficial)](https://developers.google.com/apps-script/guides/services/quotas) · [Aclaración en la comunidad de Google](https://groups.google.com/g/google-apps-script-community/c/CKtucLYjK3M) · [Resumen de terceros, 2026](https://folderpal.io/articles/google-apps-script-quotas-and-workarounds-2026-breaking-limits-on-drive-automation) · [Foro de Google sobre URL Fetch](https://discuss.google.dev/t/urlfetchapp-bandwidth-quota-exceeded-error-not-matching-documented-quotas-sudden-onset-across-many-users/353519)

---

## 2. Dónde vive el admin (y la comparación que pediste)

Hay dos formas de que **solo la cuenta del negocio** entre al admin.

### Opción A · El admin lo sirve Google (HtmlService)
El script se publica con acceso **"Solo yo"** y Google se encarga del ingreso.

- ✅ **Seguridad muy alta y sin trabajo nuestro:** Google mismo bloquea cualquier otra cuenta.
- ❌ **Dirección fea:** `script.google.com/macros/s/AKfy…/exec`. No se puede usar el dominio de la tienda.
- ❌ **Barra de aviso de Google arriba del admin** del estilo "Esta aplicación fue creada por un usuario de Google Apps Script". ⚠️ No encontré el texto exacto vigente en la documentación oficial; hay que verlo en una prueba real.
- ❌ **Problema con varias cuentas abiertas:** Google dice oficialmente que tener varias cuentas de Google abiertas a la vez **no está soportado** para las web apps de Apps Script. Si el dueño tiene abierta su cuenta personal y la del negocio en el mismo navegador, el admin puede fallar. La solución es una ventana de incógnito o cerrar las otras cuentas. ✅ Oficial
- ❌ Hay que adaptar el admin: el código actual habría que empaquetarlo en un solo archivo, y subir fotos se vuelve más difícil.

### Opción B · El admin en el sitio, con "Iniciar sesión con Google" ← **recomendada**
El admin queda en `tutienda.com/admin`, igual que ahora en la Fase 1. El dueño toca "Iniciar sesión con Google", elige su cuenta y el **puente** (punto 3) verifica con Google que:
1. el "pase" que entregó Google es auténtico y no venció, y
2. el correo es el del negocio (o uno de la lista de empleados, en el futuro).

Recién ahí deja pasar el pedido a la planilla.

- ✅ **Dirección propia** (`tutienda.com/admin`) y **sin barra de aviso**.
- ✅ **Funciona con varias cuentas abiertas:** Google muestra el selector de cuentas.
- ✅ **Se usa el admin que ya construimos**, tal cual.
- ✅ **Empleados con cuentas propias** (pregunta 7): alcanza con una lista de correos en la planilla.
- ⚠️ **La seguridad depende de que nuestra verificación esté bien hecha.** Es un patrón estándar y documentado por Google (validar emisor, destinatario y vencimiento del pase; identificar a la persona por su identificador fijo, no solo por el correo), pero es código nuestro y hay que probarlo bien. ✅ La guía es oficial.
- ⚠️ **Requiere un "ID de cliente" de Google Cloud** (gratis). Propongo crear **uno solo, tuyo**, para todas las tiendas, pidiendo solo nombre y correo. Esos permisos son "no sensibles", así que en principio no requieren la verificación larga de Google. ⚠️ A confirmar en la consola de Google Cloud.
- ⚠️ La sesión dura alrededor de una hora y después hay que volver a tocar "Iniciar sesión con Google". Es un solo toque.

**Impacto para el dueño:**

| | A (Google) | B (sitio) |
| --- | --- | --- |
| Dirección | script.google.com/… | tutienda.com/admin |
| Barra de aviso de Google | Sí | No |
| Varias cuentas abiertas | Puede fallar | Funciona |
| Ingreso | Automático si ya entró a Google | Un toque en "Iniciar sesión con Google" |
| Seguridad | La resuelve Google | La resolvemos nosotros con el método oficial |

**Recomiendo la B.** El dueño es poco técnico y muchas veces tiene varias cuentas abiertas en el celular: la opción A le haría fallar el admin sin que entienda por qué. La B es más prolija y deja resuelto lo de empleados. **¿Vamos con la B?**

**Fuentes:** [Varias cuentas no soportadas en web apps (oficial)](https://developers.google.com/apps-script/guides/projects) · [Verificar el pase de Google en el servidor (oficial)](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) · [Autenticación con un servidor (oficial)](https://developers.google.com/identity/sign-in/web/backend-auth) · [Opciones de publicación de web apps (oficial)](https://developers.google.com/apps-script/guides/web) · [Reporte de cambio de cuentas (Issue Tracker)](https://issuetracker.google.com/issues/407284389)

---

## 3. Lecturas de la tienda: stock en vivo sin gastar cuota

**Problema:** si cada visita le pregunta a Google por el catálogo, en un día con movimiento nos acercamos a las 30 ejecuciones simultáneas y la tienda tarda 1 a 3 segundos en mostrar productos.

**Recomendación: un "puente" en Cloudflare** (un Worker, que es un programa chico que corre en los servidores de Cloudflare):
- **Catálogo y stock:** el puente le pide el catálogo a Google y lo guarda en memoria **30 a 60 segundos**. Todas las visitas de ese minuto reciben la copia guardada, al instante. El stock que ve el comprador puede tener hasta un minuto de atraso.
- **Al enviar el pedido no hay atraso:** la verificación de stock se hace en vivo contra la planilla, con bloqueo (punto 4). Si en ese minuto se agotó algo, el comprador ve "Se agotó mientras elegías", como ya pasa en la Fase 1.
- **Qué se lee en vivo y qué no:** stock y precios, en vivo con caché corta. Fotos, con caché larga (punto 6). Textos de la tienda (nombre, horarios, privacidad), fijos en el archivo de configuración (D-01).
- **Ventaja extra:** como el navegador habla con el puente y el puente con Google, desaparecen los problemas técnicos de Apps Script con los navegadores (redirecciones y bloqueos entre sitios, conocidos como CORS). ✅ Google documenta oficialmente la redirección a `script.googleusercontent.com`.

**Fuentes:** [Content Service y redirección (oficial)](https://developers.google.com/apps-script/guides/content) · [Problemas de CORS con Apps Script (comunidad)](https://groups.google.com/g/google-apps-script-community/c/zJpevovcFLA) · [Cómo llamar bien a una web app de Apps Script](https://dev.to/googleworkspace/youre-probably-using-curl-wrong-with-your-google-apps-script-web-app-1ed8)

---

## 4. Concurrencia: números sin duplicados y la última unidad

**Recomendación: `LockService`, el "candado" oficial de Apps Script.**
- Se usa el candado **de script** (`getScriptLock`): bloquea a todos, sin importar quién llame. ✅ Oficial
- Al crear un pedido: cerrar candado → verificar stock libre → tomar número → escribir pedido → **guardar los cambios en la planilla** (`SpreadsheetApp.flush()`) → abrir candado. Google recomienda ese guardado antes de liberar. ✅ Oficial
- Si el candado no se consigue en unos 10 segundos, se responde "Probá de nuevo" y la tienda muestra el error con "Intentar de nuevo", que ya existe.
- Lo mismo para confirmar, cancelar y deshacer en el admin.

**Efecto en la demora:** los pedidos simultáneos se atienden de a uno. Si cada uno tarda alrededor de 1 segundo, con 3 compradores al mismo tiempo el tercero espera unos 3 segundos. Para una tienda chica es aceptable. ⚠️ El tiempo real se mide en la Fase 3.

**Fuentes:** [Clase Lock (oficial)](https://developers.google.com/apps-script/reference/lock/lock) · [LockService (oficial)](https://developers.google.com/apps-script/reference/lock/lock-service.html) · [Ejemplo de inventario con candado (comunidad)](https://dev.to/hayrullahkar/building-a-scalable-inventory-web-app-with-google-sheets-apps-script-42l8)

---

## 5. Seguridad de la creación de pedidos y pedidos falsos

**El riesgo:** cualquiera puede mandar pedidos falsos y "vaciar" la tienda por 24 h, o llenar la planilla de basura.

Evalué las 4 defensas que pediste. **Recomiendo usar las 4 juntas:**

### a) Cloudflare Turnstile (anti-robots invisible)
- Reemplaza a los "captcha" de semáforos. En la mayoría de los casos **el comprador no ve nada**: Turnstile decide solo, en segundo plano, si es una persona.
- El puente verifica cada pedido con Cloudflare antes de mandarlo a Google.
- **Plan gratis:** ✅ es gratis para todos, según el anuncio oficial de Cloudflare. ⚠️ Límites del plan gratis: las fuentes no coinciden. Lo más citado es **hasta 20 widgets por cuenta, 10 dominios por widget y 1 millón de verificaciones por mes**. Fuentes más viejas hablan de 10 widgets. Un widget por tienda alcanza para unas 20 tiendas por cuenta; si te pasás, se crea otra cuenta o se pide más. **Hay que confirmarlo en la página oficial de planes.**
- Fricción para el comprador: mínima. Solo a veces aparece una casilla "Confirmá que sos humano".

### b) Tope de pedidos pendientes por número de WhatsApp
- Se verifica en Google, dentro del candado: si ese número ya tiene **2 pedidos pendientes**, no se crea otro. Se le responde: "Ya tenés pedidos esperando confirmación. Escribile a la tienda por WhatsApp."
- Costo: cero, es una regla nuestra.

### c) Máximo de unidades por pedido
- Por ejemplo **10 unidades por producto y 20 en total**, configurable en la planilla. Evita que alguien reserve todo el stock en un pedido.

### d) Botón en el admin: "Cancelar todos los pendientes de este número"
- En el detalle de un pedido, para limpiar en un toque si alguien hace pedidos falsos.
- Costo: bajo, se arma en la Fase 3.

### Extra: límite por conexión (IP)
- El plan gratis de Cloudflare incluye **1 regla de límite de pedidos** por IP. ⚠️ A confirmar la ventana de tiempo exacta del plan gratis. Sirve contra ataques masivos, pero es tosca: muchos celulares comparten IP con la compañía telefónica. Recomiendo una regla muy holgada, por ejemplo 10 pedidos por minuto por IP.

**Validaciones del lado del servidor** (no confiar en el navegador): datos obligatorios, WhatsApp de 10 dígitos, cantidades enteras, producto visible y variante existente. Ya están escritas en la implementación local de la Fase 1 y se repiten en Google.

**Fuentes:** [Turnstile es gratis para todos (blog oficial de Cloudflare)](https://blog.cloudflare.com/turnstile-ga/) · [Límites del plan gratis (pregunta a Cloudflare)](https://www.answeroverflow.com/m/1435670593512144906) · [Límite de 10 widgets, 2024 (comunidad)](https://community.cloudflare.com/t/turnstile-limit-reached-only-10-widgets-allowed/688774) · [Precios de Turnstile 2026 (terceros)](https://prosopo.io/tools/cloudflare-turnstile-pricing/) · [Reglas de límite de pedidos (oficial)](https://developers.cloudflare.com/waf/rate-limiting-rules/) · [Comparación de planes de Cloudflare (terceros)](https://eastondev.com/blog/en/posts/dev/20251201-cloudflare-pricing-compare/)

---

## 6. Fotos

**Lo que averigüé:**
- **Servir fotos directo desde Drive ya no es confiable.** Desde 2024 los links de Drive que se usaban para mostrar imágenes en sitios (`drive.google.com/uc`) dejaron de funcionar. Las alternativas que circulan (`thumbnail`, `lh3.googleusercontent.com`) **no son oficiales**: Google no recomienda usar Drive para alojar imágenes de sitios y pueden dejar de andar sin aviso. Además, con muchas fotos en una página, Google limita las cargas.
- Esto confirma lo que ya decía la especificación: guardar en Drive, pero no mostrar desde Drive.

**Lo que recomiendo (sin cambiar lo decidido):**
1. **Al subir:** el navegador del dueño achica la foto a WebP, como ya hace en la Fase 1. Propongo sumar una segunda versión chica para las grillas.
2. **Guardar:** en el **Drive del comercio**, en una carpeta de la tienda, como dice la especificación.
3. **Mostrar:** el **puente** pide cada foto a Google una sola vez y la guarda en la caché de Cloudflare por mucho tiempo. Como cada foto tiene un nombre que nunca cambia, la copia nunca queda vieja. El comprador recibe la foto rápido, desde Cloudflare.

**La alternativa, como pediste antes de cambiar nada:** guardar las fotos en **Cloudflare R2** en vez de Drive.
- A favor: más simple y más rápido. Gratis hasta 10 GB por mes, y nunca se cobra por mostrar las fotos. ⚠️ Algunas fuentes dicen que Cloudflare pide cargar una tarjeta aunque no cobre.
- En contra: **las fotos dejarían de estar en la cuenta de Google del comercio**. Estarían en una cuenta de Cloudflare, tuya o del cliente, lo que rompe el principio "los datos son del cliente". Y suma una cuenta más para administrar.

**Mi recomendación: seguir con Drive + puente con caché.** **¿Te parece bien?** Si dijeras que no, la alternativa es R2.

**Fuentes:** [Cambio en los links de Drive, 2024](https://pulse.appsscript.info/p/2024/01/changes-to-drive-google-com-uc-urls-which-break-embedding-images-files-from-google-drive-in-your-websites-and-appsheet-apps/) · [Mostrar imágenes de Drive en un sitio (Justin Poehnelt, de Google)](https://justin.poehnelt.com/posts/google-drive-embed-images-403/) · [Discusión en GitHub](https://github.com/orgs/community/discussions/86986) · [Precios de R2, 2026 (terceros)](https://agentdeals.dev/vendor/cloudflare-r2) · [Cloudflare Images (oficial)](https://www.cloudflare.com/en-in/developer-platform/products/cloudflare-images/)

---

## 7. Empleados con cuentas propias (futuro)

- **Con la opción B del admin: sí, es simple.** El puente ya sabe qué correo inició sesión. Alcanza con una lista de correos permitidos en la planilla, que edita quien mantiene el sitio. También se podría registrar quién confirmó cada venta.
- **Con la opción A:** el acceso "Solo yo" no permite otras cuentas. Habría que cambiar a "Cualquiera con cuenta de Google" y verificar el correo a mano, con lo que se pierde la ventaja de A.

---

## 8. Publicación: Cloudflare Pages o Workers

- El stack decidido dice **Cloudflare Pages**. Cloudflare hoy ofrece lo mismo, y más, en **Workers**: también sirve sitios estáticos y **los archivos estáticos son gratis e ilimitados**. ✅ Oficial
- Como igual necesitamos el **puente** (un Worker), conviene tener la tienda y el puente **en un mismo proyecto de Workers** y no en dos productos distintos.
- **Plan gratis de Workers:** 100.000 pedidos por día al puente, con 10 ms de procesamiento cada uno. Las páginas y archivos estáticos no cuentan. ⚠️ Cifras de terceros; la parte de "estáticos gratis" es oficial.
- Límite de archivos: 20.000 por versión en el plan gratis ✅ Oficial. Nos sobra.
- **Costo para el cliente: sigue siendo cero** (solo el dominio).

**Esto cambia una decisión del stack ("Cloudflare Pages"), así que necesito tu OK.** Para vos no cambia nada en la práctica: misma empresa, mismo panel, gratis.

**Fuentes:** [Precios de Workers, estáticos gratis (oficial)](https://developers.cloudflare.com/workers/platform/pricing/) · [Más archivos estáticos en Workers (oficial)](https://developers.cloudflare.com/changelog/2025-09-02-increased-static-asset-limits/) · [Pages vs Workers 2026 (terceros)](https://www.morphllm.com/comparisons/cloudflare-pages-vs-workers) · [Límite de archivos con Astro (terceros)](https://laplusda.com/en/posts/cloudflare-pages-astro-file-limit/)

---

## 9. Números a decidir para las defensas anti-pedidos falsos **(decidís vos)**

| Regla | Propuesta |
| --- | --- |
| Pedidos pendientes por número de WhatsApp | 2 |
| Unidades máximas por producto en un pedido | 10 |
| Unidades máximas por pedido | 20 |
| Pedidos por minuto desde una misma conexión | 10 |

Todos quedarían en la pestaña `Config` de la planilla, para ajustarlos por cliente sin tocar código.

---

## 10. Otros riesgos que encontré

- **Pantalla "Google no verificó esta app":** aparece una sola vez, cuando el comercio autoriza el script en la puesta en marcha. Con la arquitectura propuesta, solo la cuenta del negocio autoriza el script, así que no nos afecta el tope de 100 usuarios que tienen las apps sin verificar. Lo hacemos juntos con el cliente, como ya estaba previsto. ⚠️ Lo más preciso que encontré sobre este tope son fuentes de la comunidad.
- **Vista previa de links (Instagram, WhatsApp) y Google:** hoy cada página de producto se arma en el navegador, así que al compartir un producto la vista previa mostraría solo el nombre de la tienda. El puente puede agregar el nombre, el precio y la foto del producto a la página antes de enviarla. Lo sumo a la Fase 3 o 4.
- **Ley 25.326:** el texto de privacidad sigue pendiente de revisión legal. Además, hay que consultar con un abogado si cada comercio debe inscribir su base de datos de compradores ante la AAIP. No lo investigué en fuentes oficiales.

---

## 11. Cómo quedaría (arquitectura)

```
Comprador (celular)
     │
     ▼
Cloudflare (Workers)
 ├── Tienda (páginas y archivos, gratis)
 └── Puente
      ├── /api/catalogo   → caché 30–60 s → Google (Apps Script) → Planilla
      ├── /api/pedido     → Turnstile + límites → Google (con candado) → Planilla
      ├── /api/fotos/:id  → caché larga → Google → Drive
      └── /api/admin/*    → verifica "Iniciar sesión con Google" + correo permitido → Google
                                                         │
Dueño (admin en tutienda.com/admin) ─────────────────────┘

Google (cuenta del comercio)
 ├── Apps Script: acepta solo pedidos que traen la clave secreta del puente
 ├── Planilla: Config, Categorias, Productos, Stock, Pedidos, PedidoItems, Registro
 └── Drive: carpeta de fotos
```

- Entre el puente y Google hay una **clave secreta compartida**: aunque alguien descubra la dirección del script, sin la clave no puede hacer nada.
- La tienda y el admin no cambian. Solo se escribe la implementación `appsScript` de la capa de datos, como estaba previsto (regla 4 de `CLAUDE.md`).

---

## 12. Lo que hay que confirmar en páginas oficiales antes de la Fase 3

No los pude abrir desde la máquina de trabajo (la red bloquea esos sitios):

1. [Cuotas de Apps Script](https://developers.google.com/apps-script/guides/services/quotas): tiempo total de disparadores por día (90 min) y llamadas URL Fetch por día (20.000).
2. [Planes de Turnstile](https://developers.cloudflare.com/turnstile/plans/): widgets por cuenta, dominios por widget y verificaciones por mes.
3. [Límites de Workers](https://developers.cloudflare.com/workers/platform/limits/): 100.000 pedidos por día y 10 ms de procesamiento.
4. [Reglas de límite de pedidos](https://developers.cloudflare.com/waf/rate-limiting-rules/): cuántas reglas y qué ventana de tiempo incluye el plan gratis.
5. Consola de Google Cloud: que un ID de cliente con permisos solo de nombre y correo no necesite verificación.
6. Prueba real: el texto de la barra de aviso de Google, si se eligiera la opción A.

Podés abrirlos vos desde tu compu, o los reviso apenas tenga una sesión con acceso a esos sitios. Si alguno no coincide, actualizo este documento antes de escribir código.

---

## 13. Lo que necesito que decidas para pasar a la Fase 3

1. **Admin:** ¿opción B (en el sitio, con "Iniciar sesión con Google")? (punto 2)
2. **Fotos:** ¿seguimos con Drive + puente con caché? (punto 6)
3. **Publicación:** ¿Cloudflare Workers en vez de Pages? (punto 8)
4. **Números anti-pedidos falsos:** ¿te sirven los de la tabla del punto 9?
