# 07 · Registro de decisiones

Decisiones tomadas después de la especificación original. Cada una dice qué se decidió, por qué y quién la tomó. Si una decisión de acá contradice otro archivo de `docs/`, **vale la de acá** (y el otro archivo se actualiza).

Formato: **D-número · fecha · tema**.

---

## D-01 · 2026-10-06 · Configuración: planilla vs. archivo (R5)

- **Decisión:** en la pestaña `Config` de la planilla va **solo lo que el servidor necesita para funcionar**: `horasReserva` y `proximoNumero`. Todo lo demás (nombre, WhatsApp de la tienda, horarios, dirección, redes, texto de privacidad, estilo) va en `tienda-whatsapp/config/tienda.config.ts`.
- **Por qué:** evitar tener el mismo dato en dos lugares que tarde o temprano no coinciden.
- **Efecto:** si el comercio cambia horarios o dirección, lo actualiza Flor en el archivo y se publica de nuevo. El comercio no lo cambia solo.
- **Ajuste técnico:** en el plan había propuesto dejar también `whatsappTienda` en la planilla; al construir vi que el servidor no lo necesita, así que queda solo en el archivo de configuración. Las horas de reserva, como las usa el servidor, salen de la planilla y la tienda las lee de ahí para mostrarlas ("Te reservamos los productos por 24 h").
- Decidió: Flor.

## D-02 · 2026-10-06 · WhatsApp del comprador (R7)

- **Decisión:** un solo campo, **tolerante**. Acepta cualquier formato (con o sin +54, 9, 0 o 15, con espacios o guiones), lo normaliza a los **10 dígitos** de un celular argentino (código de área + número) y le muestra al comprador cómo quedó: "Te van a escribir al +54 9 11 5555-0000". Solo si no se puede normalizar, muestra el error con un ejemplo.
- **Se guarda:** lo que escribió el comprador **y** el número normalizado. El link `wa.me` del admin usa `549` + los 10 dígitos.
- **Cómo se normaliza:** se quitan los símbolos; se quita `54` y el `9` de adelante si están; se quita el `0` de adelante; si quedan 12 dígitos, se busca el `15` justo después del código de área (2 dígitos si empieza con 11, si no 3 o 4) y se quita. Si al final no quedan 10 dígitos, es error.
- **Riesgo conocido:** con números que no son de Buenos Aires, a veces no se puede saber con certeza dónde termina el código de área. Por eso se le muestra al comprador el número final, para que lo revise.
- Decidió: Flor.

## D-03 · 2026-10-06 · Nombre de la tienda de la demo

- **Decisión:** "Tienda Modelo" por ahora. Flor lo cambia en la configuración antes de publicar la demo.
- Decidió: Flor.

## D-04 · 2026-10-06 · Categoría guardada por id (R6)

- **Decisión:** cada fila de `Categorias` tiene un `id` que nunca cambia; los productos guardan ese `id` (columna `categoriaId`), no el texto "Mujer › Remeras".
- **Por qué:** si se renombra una categoría, los productos no quedan huérfanos.
- **Efecto para el comercio:** ninguno; en pantalla se sigue viendo "Mujer › Remeras".
- Propuso: Claude (en el plan de la Fase 0). Aprobó: Flor (OK al plan).

## D-05 · 2026-10-06 · "Deshacer" y cancelación devuelven exactamente lo descontado (R8)

- **Decisión:** al confirmar un pedido se guarda, por cada línea, cuántas unidades se descontaron de verdad (columna `descontado` en `PedidoItems`). Cancelar una venta confirmada devuelve esa cantidad, no la pedida. "Deshacer" vuelve el stock de las variantes afectadas al valor exacto que tenían antes.
- **Por qué:** con "Confirmar igual, tengo la prenda" el stock se recorta a 0; devolver la cantidad completa dejaría más stock del que había.
- Propuso: Claude. Aprobó: Flor (OK al plan).

## D-06 · 2026-10-06 · Admin como mini-aplicación independiente (R1)

- **Decisión:** el admin se construye en `compartido/admin/` como una aplicación de una sola página, con navegación interna. En la Fase 1 se ve en `/admin/` del sitio; en producción puede vivir en Cloudflare o servirlo Google, según lo que se decida en la Fase 2.
- Propuso: Claude. Aprobó: Flor (OK al plan).

## D-07 · 2026-10-06 · Cosas a sumar a la Fase 2

Pedido de Flor, para responder por escrito en la investigación técnica:

1. **Admin en Cloudflare con "Iniciar sesión con Google"** y verificación del correo en Apps Script, **comparado** con servir el admin desde Google (HtmlService). Recomendar una y explicar el impacto para el dueño: barra de aviso, dirección web, seguridad.
2. **Pedidos falsos:** evaluar
   - Cloudflare Turnstile (verificar los límites del plan gratis en la documentación oficial),
   - tope de pedidos pendientes por número de WhatsApp,
   - máximo de unidades por pedido,
   - un botón en el admin para **cancelar todos los pendientes de un número**.
3. **Fotos:** antes de cambiar el manejo de fotos respecto de lo que dice la especificación, **explicarle a Flor la alternativa** y esperar su OK. (En la Fase 1 las fotos se manejan como dice `03-admin.md`: se achican en el navegador antes de subir.)

## D-08 · 2026-10-06 · Decisiones técnicas de la Fase 1

Tomadas por Claude dentro de lo aprobado; se pueden revisar.

- **Preact** para las partes interactivas (aprobado en el plan).
- **Tienda de varias páginas** (catálogo, ficha, carrito, datos, pedido) en vez de una sola página: cada producto tiene su propio link (`/producto/?id=…`) para compartir por Instagram o WhatsApp, y el botón "atrás" del celular funciona como se espera. El link solo lleva el id del producto, nunca datos personales.
- **Fotos en modo de prueba** se guardan en el navegador (IndexedDB), porque el almacenamiento común del navegador se llena con 2 o 3 fotos.
- **Tienda de ejemplo:** además de los 5 productos de la especificación, se sumó un producto oculto ("Pañuelo de seda") para poder probar la etiqueta "Oculto", y 3 pedidos de ejemplo (uno pendiente, uno confirmado y uno vencido) para que el admin no arranque vacío. "Volver a los datos de ejemplo" los restaura.
- **Herramientas de prueba:** aparecen solo cuando la tienda usa datos locales (`datos: 'local'` en la configuración). Con datos reales de Google no existen.

## D-09 · Estilo blanco y negro, sin modo oscuro, y pesos de letra

- **Decisión:** todo el sitio (tienda y admin) en blanco, negro y grises. Sin modo oscuro: aunque el celular esté en modo oscuro, el sitio se ve claro. Pesos de letra permitidos: **regular (400), semi (600) y bold (700)**; nada más grueso.
- **Cómo quedó:**
  - Títulos y número de pedido en bold.
  - Botones, etiquetas, precios y textos destacados en semi.
  - El resto en regular.
  - La tipografía pasa a **Atkinson Hyperlegible Next** (Google Fonts), porque la versión anterior no tenía peso semi.
- **Avisos y errores:** al no tener color, se distinguen por borde grueso, ícono y texto, nunca solo por color (regla de accesibilidad 7).
- **Fotos:** las ilustraciones de ejemplo de los productos conservan sus colores, porque son contenido y no parte del diseño.
- Todo está en `compartido/estilos/tokens.css`. El color de marca de cada cliente se sigue cambiando en `tienda.config.ts`.
- Decidió: Flor.

## D-10 · Sin pantalla de "Enviando": la reserva va como texto mínimo

- **Decisión:** se saca la pantalla de espera con los 3 pasos ("Revisamos que haya stock", "Reservamos tus productos por 24 h", "Preparamos el mensaje"). Se sentía como un paso extra antes del mensaje de WhatsApp.
- **En su lugar:**
  - Debajo del botón "Enviar pedido por WhatsApp" hay un texto mínimo: "Al enviarlo, te reservamos los productos por 24 h."
  - Mientras se envía, el mismo botón muestra "Enviando pedido…" y el texto de abajo cambia a "Estamos reservando tus productos. No cierres esta pantalla."
- **No cambia:** la reserva de stock sigue funcionando igual (24 h, vencimiento automático). En "Pedido registrado" el plazo de la reserva queda como texto chico.
- Decidió: Flor.

## D-11 · Revisión de Flor de la Fase 1 (carrito, errores y cierre)

- **Carrito:** con cantidad 1, tocar "−" quita el producto. Antes el botón quedaba deshabilitado.
- **Errores en rojo:** es la única excepción al blanco y negro de D-09: mensajes de error, borde de los campos con error y recuadro "Revisá N datos". Se mantienen el ícono y el texto, así que no se comunica solo con color.
- **Cierre por WhatsApp:** al tocar "Enviar pedido por WhatsApp" se abre una **pestaña nueva** con el mensaje ya redactado; el comprador solo toca enviar.
- **Pantalla final mínima:** "Pedido enviado con éxito", el número de pedido y "Volver al inicio". Se sacan "Último paso", "Así llega el mensaje", "Qué sigue", el resumen y el texto de la reserva.
- **Detalle técnico:** la pestaña nueva se abre en el mismo momento del toque. Si se abriera después de esperar al servidor, el navegador la bloquearía como ventana emergente. Mientras se registra el pedido muestra "Abriendo WhatsApp…" y después pasa al chat. Si algo falla, se cierra sola.
- **Riesgo a tener en cuenta:** "enviado con éxito" quiere decir que el pedido quedó registrado en la tienda. Si el comprador no toca enviar en WhatsApp, a la tienda no le llega el mensaje (igual el pedido aparece en el admin como pendiente). Por eso se dejó un link chico de respaldo: "¿No se abrió WhatsApp? Tocá acá".
- Decidió: Flor.

## D-12 · Ajuste rápido de stock con botón "Guardar cambios"

- **Decisión:** el desplegable de stock de cada producto tiene un botón **"Guardar cambios"** que guarda y cierra. Reemplaza al guardado automático de `03-admin.md`.
- **Tocar afuera** del producto, o la tecla Escape, también cierra el desplegable. Antes no se cerraba.
- **Para no perder nada:** si se cierra con cambios sin guardar (afuera, Escape o tocando de nuevo el producto), se guardan igual y aparece el aviso "Stock de {producto} guardado.". Si el guardado falla, el desplegable queda abierto con "No se pudo guardar" y el botón "Reintentar".
- Decidió: Flor.

## D-13 · WhatsApp en la misma pestaña (reemplaza la pestaña nueva de D-11)

- **Decisión:** al tocar "Enviar pedido por WhatsApp" se registra el pedido y se va directo a WhatsApp en la misma pestaña, con el mensaje redactado. Si el comprador lo envía, terminó.
- **Para seguir comprando:** si vuelve atrás desde WhatsApp, ve "Pedido enviado con éxito" y "Volver al inicio". Si cerró la pestaña, tiene que volver a entrar al sitio; Flor aceptó esa contra.
- **Opción descartada: "Gestionando pedido" → "Éxito" o "Pedido cancelado" según lo que haga en WhatsApp.** No se puede hacer: WhatsApp no le avisa al sitio si el mensaje se envió ni si se cerró el chat (en el celular, además, se abre la app, fuera del navegador). El sitio no tiene forma de enterarse.
- **Lo que cubre ese caso:** si el comprador nunca manda el mensaje, el pedido queda pendiente en el admin y la reserva vence sola a las 24 h. Funciona como un "cancelado" automático.
- Decidió: Flor.

## D-14 · Carrito y datos en una sola pantalla; WhatsApp en pestaña nueva (reemplaza D-13)

- **Una sola pantalla:** el carrito y "Tus datos" van juntos, con el formulario al lado en escritorio y debajo en el celular, para ahorrar un clic. Se saca el botón "Continuar". Las direcciones viejas `/datos/` y `/pedido/` redirigen al carrito.
- **Enviar:** "Enviar pedido por WhatsApp" registra el pedido y abre WhatsApp en una **pestaña nueva**, con el mensaje redactado. La pestaña se abre en el mismo toque del botón, porque si se abriera después de esperar al servidor el navegador la bloquearía. Si algo falla, se cierra sola.
- **Después de enviar:** el carrito se vacía solo y, en la pestaña de la tienda, queda "¡Listo! Te abrimos WhatsApp para confirmar tu pedido #N.", con "Seguir comprando". No hay botón "Vaciar carrito" ni pantalla de éxito aparte.
- **Referencia:** el cierre que mostró Flor de otro sitio, simplificado (sin "Vaciar carrito").
- **Sigue sin poder saberse** si el comprador envió el mensaje en WhatsApp (ver D-13). Si no lo envía, la reserva vence sola a las 24 h.
- Decidió: Flor.

---

## D-15 · Respuestas de Flor a los pendientes de la Fase 1 (8/10/2026)

1. **Talle:** no viene elegido de entrada en la ficha, salvo que el producto tenga un solo talle. El comprador lo elige; así nadie compra un talle por error.
2. **Datos de ejemplo:** se quedan el producto oculto "Pañuelo de seda" y los 3 pedidos de ejemplo (D-08).
3. **WhatsApp de la tienda:** queda solo en el archivo de configuración, no en la planilla (D-01).
4. **Ilustraciones de los productos de ejemplo:** pasan a grises, en línea con el blanco y negro de D-09.
- Decidió: Flor.

---

## Pendientes (al 8/10/2026)

1. **Aprobar** el PR de la Fase 1 (botón "Merge"): https://github.com/fmicieli/empresitios/pull/1
2. **Fase 2 (investigación técnica):** sin empezar. En sesiones anteriores, la red de la máquina en la nube bloqueaba developers.google.com, así que todavía no se pudieron verificar las cuotas de Apps Script en la documentación oficial.
