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

## D-16 · Decisiones de la Fase 2 (8/10/2026)

Basadas en `08-investigacion-fase-2.md`.

1. **Admin: opción B.** El admin está en el sitio de la tienda (`tutienda.com/admin`) con "Iniciar sesión con Google". El puente de Cloudflare verifica que el correo sea el del negocio (o de la lista de empleados, en el futuro). Se descarta servirlo desde Google (HtmlService). Decidió: Flor.
2. **Publicación: Cloudflare Workers** en vez de Cloudflare Pages. La tienda (páginas y archivos) y el puente quedan en un solo proyecto. Sigue siendo gratis para el cliente. Cambia el stack de `CLAUDE.md`. Decidió: Flor.
3. **Defensas contra pedidos falsos:** Cloudflare Turnstile, como máximo 2 pedidos pendientes por número de WhatsApp, 10 unidades por producto y 20 por pedido, una regla holgada por conexión (10 pedidos por minuto) y un botón en el admin para cancelar todos los pendientes de un número. Los números quedan en la pestaña `Config` de la planilla. Decidió: Flor.
4. **Fotos:** se guardan en el Drive del comercio, el navegador las achica en WebP al subirlas (una versión grande y una chica) y el puente las muestra con caché larga. Se descarta Cloudflare R2. Recomendó: Claude. Aprobó: Flor.

---

## D-17 · Detalles de la Fase 3 (8/10/2026) — aprobados por Flor (9/10)

1. **"Cancelar los pedidos pendientes de este número"** aparece en el detalle del pedido solo cuando ese número tiene 2 o más pedidos pendientes. Cancela solo los pendientes (no toca vencidos ni confirmados) y pide confirmación antes ("Sí, cancelar todos" / "No, volver"). Propuso: Claude; ajustó Flor (9/10: el número contaba también los vencidos y confundía).
2. **La sesión del admin dura alrededor de una hora** (lo que dura el pase de Google). Después vuelve a la pantalla de ingreso y hay que tocar de nuevo "Iniciar sesión con Google". Si molesta, se puede hacer que Google renueve el pase solo. Propuso: Claude.
3. **Los cambios del admin tardan hasta un minuto en verse en la tienda** de otros compradores (caché del catálogo, D-16). En el propio admin se ven al instante. Propuso: Claude.
4. **Si se supera un tope**, el comprador ve: "Ya tenés pedidos esperando confirmación. Escribile a la tienda por WhatsApp." o "Tu pedido tiene demasiadas unidades. Sacá algunas o escribile a la tienda por WhatsApp." (`06-textos.md` a actualizar cuando Flor los apruebe). Propuso: Claude.
5. **El ID de cliente de Google y la clave de sitio de Turnstile** van en `tienda.config.ts` (son públicos); los secretos van solo en Cloudflare (regla 2 de `CLAUDE.md`). Propuso: Claude.
6. **Pedido repetido:** si el mismo número manda el mismo pedido exacto (mismos productos, variantes y cantidades) mientras el anterior sigue pendiente, no se registra de nuevo y ve el recuadro "Este pedido ya está registrado" con el texto "Ya enviaste este mismo pedido. La tienda te va a responder por WhatsApp." Decidió: Flor (9/10).
7. **Tope de unidades visible:** al llegar al máximo por pedido (10 por producto, 20 en total, o lo que diga la planilla), el "+" se deshabilita en la ficha y en el carrito, con la línea "Llegaste al máximo de unidades por pedido." Decidió: Flor (9/10); la línea explicativa la sumó Claude (regla de accesibilidad: un botón deshabilitado sin motivo confunde).
8. **Los topes y el bloqueo de repetidos dependen de cada comercio.** Los valores de hoy (10, 20, 2 pendientes, bloquear repetidos: sí, 24 h) son los de por defecto; se ajustan por cliente en la pestaña `Config` de la planilla, según lo que responda en `10-preguntas-al-cliente.md`. Decidió: Flor (9/10).

## D-18 · Publicación de la demo (9/10/2026)

1. **La demo funciona en modo de prueba:** cada visitante tiene su propia copia en el navegador y puede entrar al admin con el ingreso simulado. No usa Google. Decidió: Flor.
2. **Nombre:** "Tienda Modelo" (cierra D-03). Decidió: Flor.
3. **Sin WhatsApp por defecto:** quien prueba la demo carga su número en "Herramientas de prueba". Los botones de WhatsApp sin número lo explican y ofrecen "Cargar número". Decidió: Flor.
4. **Cloudflare publica la rama `main`.** Los cambios llegan a `main` por pull request, con la aprobación de Flor. Decidió: Flor.
5. **La demo no aparece en buscadores** (`noindex` en modo de prueba). Propuso: Claude.
6. **Vista previa al compartir el link:** imagen `compartir.png` (1200 × 630) y, en las fichas, nombre, precio y descripción del producto. Con datos reales, también la primera foto del producto (⚠️ confirmar que WhatsApp muestra fotos WebP, que es como se guardan). Las fotos de la demo son dibujos SVG, que WhatsApp no muestra: para la tarjeta se usa una copia en PNG de cada uno (ajustado el 13/10 a pedido de Flor). Propuso: Claude.
8. **Compartir un producto** (13/10): botón "Compartir" junto al precio en la ficha, y el link "¿Tenés alguna duda con este producto? Preguntá acá" manda a WhatsApp el nombre y el link del producto, así la tienda ve la tarjeta. Decidió: Flor.
7. **La tienda conectada no se publica sin WhatsApp:** si `datos` es `appsScript` y falta el número, la compilación se frena con un aviso. Propuso: Claude.

## D-19 · Estilo por cliente (13/10/2026)

1. **Sin estilos predefinidos.** El estilo de cada tienda sale del logo y los colores de cada marca. Si hace falta, se muestran estilos de inspiración aparte, fuera del código. Decidió: Flor.
2. *(Reemplazado por D-21.)* **Escala de textos fija** para todas las tiendas: 12 · 14 · 16 · 18 · 20 · 22 · 28 · 46 px, pesos regular, semi y bold, e interlineados fijos. Por cliente solo cambia la **familia**: una para el texto y, si se quiere, otra para los títulos. Decidió: Flor. Al ordenar la escala, algunos tamaños sueltos se acomodaron al paso más cercano: 13→14, 15→16, 17→18, 19/20→20, 21→22, 26→28 (el título de cada pantalla queda un poco más grande).
3. **Un archivo de estilo por cliente:** `tienda-whatsapp/config/estilo.css` pisa fuentes, colores y formas (redondeo de bordes y grosor de líneas). `compartido/estilos/tokens.css` queda con los valores por defecto y no se toca, así las mejoras de la plantilla no chocan con el diseño de cada cliente. Propuso: Claude.
4. **Fuentes guardadas dentro del sitio** (paquetes de Fontsource), sin cargarlas de Google Fonts: más privado y más rápido en celulares de gama media. Propuso: Claude.
5. **Control de contraste al compilar:** si un color del cliente deja un texto difícil de leer (mínimo AA: 4,5:1 para texto, 3:1 para botones), la compilación avisa qué par falla. Propuso: Claude.
6. **El admin toma el mismo estilo que la tienda** (fuentes, colores y formas del cliente). Decidió: Flor (13/10).
7. *(Reemplazado por D-21.)* **Base más trabajada** (13/10, pedido de Flor, a revisar): fondo blanco y texto negro por defecto; botón principal del color de marca, con un tono más oscuro de la misma marca al pasar el mouse o tocarlo; botones con bordes redondeados (tipo pastilla); avisos que suben desde abajo en blanco, con sombra suave y borde del color de marca; filtros del admin como pestañas en lugar de píldoras. Además (propuesta de Claude): íconos del encabezado sin caja, filtros de la tienda rellenos en gris, fotos y tarjetas más redondeadas, campos con bordes más suaves (con el contraste mínimo de 3:1) y tarjetas de pedidos con sombra en lugar de borde.
8. *(Reemplazado por D-21.)* **Selecciones y botón secundario** (13/10, pedido de Flor): el botón secundario es blanco, con texto y borde del color de marca. El talle, el color y la categoría elegidos usan ese mismo estilo (blanco con borde de 2 px y texto de marca). En el admin de computadora, la sección elegida de la barra lateral va en gris claro. Si un color de marca es muy claro para leerse como texto, se pone una versión más oscura en `--acento-texto`; el control de contraste lo avisa.
9. **Ajuste automático de contraste** (13/10, Flor): si el color de marca no se lee como texto sobre el fondo (4,5:1), al compilar los textos y bordes de marca pasan solos al color del texto (negro). El botón principal mantiene el color de marca.
10. **Admin en computadora sin el cuadro vacío de la derecha** (13/10, Flor): la lista de pedidos usa todo el ancho; el detalle aparece a la derecha solo al elegir un pedido (con flecha para cerrarlo) y, mientras está abierto, la tabla esconde la columna de productos para no cortarse.
11. *(Reemplazado por D-21.)* **Roboto como fuente por defecto** (13/10, Flor), guardada en el sitio.
12. *(Reemplazado por D-21.)* **Colores de íconos, links y contadores** como tokens (`--icono`, `--enlace`, `--contador-fondo`, `--contador-texto`), con control de contraste. Por defecto: íconos y links del color de marca (en negro si la marca no se lee, ver punto 9), contadores del color de marca.
13. **Todo se deriva del color de marca** (13/10, Flor; referencia: tienda "ShopMate" verde oliva). Del color de marca salen: botón principal (pleno) y su hover (más oscuro); botón secundario, selecciones, íconos y links (color de marca como texto); y un tono muy suave de la marca (`--superficie-marca`) para avisos, paneles, etiquetas ("Sin stock") y círculos de íconos. Las tarjetas de producto son blancas con borde finito. Con la marca negra de la demo, todo queda en blanco, negro y grises.
14. **Encabezado y márgenes en computadora** (13/10, Flor): logo a la izquierda (en la demo, un logo de ejemplo en `public/logo.svg`), categorías principales centradas, buscador y carrito a la derecha. Ícono de carrito en lugar del de bolsa (que parecía un tacho). Contenido más ancho: hasta 1360 px.

## D-20 · Inicio con banner y destacados (13/10/2026)

1. **Inicio:** banner arriba y una fila por categoría principal con sus productos destacados, con desplazamiento horizontal ("Destacados de Mujer", "Destacados de Hombre"…). Decidió: Flor.
2. **Destacados:** casilla "Destacado en el inicio" en el admin, por producto (columna `destacado` en la planilla). Si en una categoría no hay ninguno marcado, se muestran los más nuevos. Decidió: Flor.
3. **Banner desde la configuración** (`inicio.banner` en `tienda.config.ts`): imagen, título, texto y botón. Lo cambia quien mantiene el sitio. Decidió: Flor.
4. **Breadcrumb en lugar de filtros:** en categorías, búsqueda y ficha ("Inicio / Mujer / Remeras"), arriba del título. Decidió: Flor.
5. **Buscador chico en el encabezado**, a la izquierda del carrito. En el celular, una lupa que abre el buscador debajo del encabezado. Decidió: Flor.
6. **Niveles de categorías:** dependen de la clasificación de cada tienda y se definen al armarla (2 o 3 niveles, por ejemplo Mujer / Indumentaria / Remeras). Decidió: Flor. Cómo (propuso Claude): sin columnas nuevas; para un tercer nivel, la columna `subcategoria` lleva el camino con `>` ("Indumentaria > Remeras"). El menú muestra el grupo como título y el breadcrumb lo incluye con link. La demo usa 3 niveles en Mujer y 2 en Hombre, solo para mostrar que se puede. Criterio para cada tienda (Flor, 14/10): si una categoría tiene un único grupo (por ejemplo, Mujer solo tiene Indumentaria), ese nivel no se usa.
8. **Márgenes en computadora** (14/10, Flor): el contenido ocupa el 90% del ancho de la pantalla, en la tienda y en el admin.
9. **Categoría del producto en pasos** (14/10, Flor): en el admin, al cargar o editar un producto se elige primero la categoría, después la subcategoría y, si la tienda usa 3 niveles, el tercero ("Tipo"), en selectores separados. Cada uno muestra solo lo que corresponde al anterior. En computadora se ven todos en una fila desde el principio, deshabilitados (en gris) hasta que se elige el anterior; hasta 3 por fila y, si la tienda usa 4 niveles, dos y dos. En celular también se ven todos desde el principio, uno debajo del otro (14/10, Flor).
7. La demo suma productos de ejemplo para que las filas tengan con qué desplazarse. Los datos de prueba guardados en el navegador se reinician una vez (versión nueva). Propuso: Claude.

## D-21 · Sistema de diseño de base: Simple Design System (14/10/2026)

Pedido de Flor: tomar como base el "Simple Design System" de Figma Community (archivo duplicado en su cuenta: https://www.figma.com/design/9mND0DF4l37xKvbAtIlLLY), incluida la guía de composición y las reglas de uso. Es la base antes de aplicar el estilo de cada cliente. **Manda sobre los puntos de D-19 que contradiga** (escala de textos, Roboto, botones tipo pastilla, botón secundario blanco con borde de marca, selecciones con borde, tarjetas de pedidos con sombra).

1. **Se toma todo del sistema:** colores de base (grises, rojo, amarillo, verde), tipografía (tamaños, pesos, interlineados y espaciado de letras), espacios (escala 2 · 4 · 6 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 160), radios (4 · 8 · 16 · redondo), sombras, íconos (Feather) y el diseño de los componentes. Decidió: Flor.
2. **Única excepción: Nunito Sans en lugar de Inter**, guardada en el sitio (Fontsource). Decidió: Flor.
3. **La regla de marca se mantiene:** lo que en el sistema es "Brand" (botón principal, casillas y opciones elegidas, ítem activo del menú, contadores) toma el color de marca del cliente. Sin marca, se usa el gris oscuro del sistema (#2c2c2c), que es el de la demo. Decidió: Flor.
4. **Escala de textos** (sigue fija para todas las tiendas, D-19): 12 · 14 · 16 · 20 · 24 · 32 · 40/48 · 72 px. Texto general 16 (Body), ayudas 14 (Body Small), títulos de tarjetas 20, secciones 24 (Heading), título de cada pantalla 32, precio de la ficha y número de pedido 40 en celular / 48 en computadora (Title Page), título del banner hasta 72 (Title Hero). Pesos: 400, 600 (Heading y Body Strong) y 700 (Title).
5. **Componentes, cómo quedaron:**
   - Botón principal = "Primary" (color de marca, radio 8). Botón secundario = "Neutral" (gris claro con borde gris). Borrar o cancelar = "Danger" (rojo), disponible como `.boton.peligro`.
   - Talles, colores y filtros elegibles = "Tag Toggle", adaptado: ver punto 9.
   - Campos = "Input/Select/Textarea Field": etiqueta arriba, borde gris, radio 8, error en rojo con mensaje abajo. Interruptores = "Switch" (40 × 24).
   - Tarjetas de producto = "Product Info Card" (borde gris, foto adentro, nombre y precio). Tarjetas de pedido y paneles = "Card" (borde gris, sin sombra).
   - Avisos = "Notification" (blanco con borde gris; los de error, rojo suave con borde rojo). Diálogos = "Dialog" (radio 8, sombra 400).
   - Menú de categorías = "Navigation Pill" y desplegable = "Menu" (al pasar el mouse, color de marca). Pestañas del admin = "Tabs" (línea gris; la elegida, oscura).
   - Barra inferior del admin = "Navigation Button" (ícono 24 y texto 14). Barra lateral = "Navigation Pill" (la elegida, fondo suave de marca).
6. **Adaptaciones por accesibilidad** (propuso Claude; son desvíos chicos del sistema para cumplir la regla 7 de `CLAUDE.md`):
   - **Alto de botones y campos:** el sistema usa 40 px (32 los chicos). En pantallas táctiles quedan en 44 px (área mínima para el dedo); con mouse, en las medidas del sistema.
   - ~~Borde de los campos en un gris más marcado (#757575).~~ Revertido a pedido de Flor (punto 14).
   - **Texto gris sobre paneles grises:** el gris secundario del sistema da 4,2:1 sobre el fondo gris (mínimo 4,5:1). Dentro de los paneles se usa un gris más oscuro de la misma paleta (Slate 700).
   - **Pestaña elegida con línea de 2 px** (el sistema usa 1 px para todas y cambia solo el color): así el estado no depende solo del color.
   - Los textos de ejemplo dentro de los campos ("Ej.: 15000") quedan en el gris claro del sistema (#b3b3b3), que tiene poco contraste. Es aceptable porque son solo ejemplos y cada campo tiene su etiqueta arriba, pero conviene no poner información importante ahí.
7. **Otras adaptaciones** (propuso Claude): la tienda sigue con 2 columnas de productos en el celular (el ejemplo del sistema usa 1), porque el comprador recorre el catálogo con el pulgar; la proporción de fotos de producto sigue en 4:5 (la del ejemplo de tarjeta del sistema es parecida, ~5:6); el contenido sigue ocupando el 90% del ancho en computadora (D-20).
8. **Íconos Feather** (licencia MIT, se puede usar en proyectos de clientes). Tamaños del sistema: 16 dentro de botones y campos, 20 en botones de ícono, 24 en la navegación.
9. **Talles y colores como los campos** (14/10, Flor; reemplaza las versiones anteriores de este punto): sin elegir, blancos con línea gris clara de 1 px; elegido, la línea pasa a 2 px negra (como un campo al escribir), texto en negrita. Sin stock: línea gris más clara todavía, texto gris y tachado. El grosor de la línea y el tachado hacen que el estado no dependa solo del color (regla 7).
10. **Botones más altos que las opciones** (14/10, Flor): botones 48 px; campos, talles y colores 44 px en pantallas táctiles y 40 px con mouse (el sistema usa 40 para todo).
11. **Grises suaves de marca más claros** (14/10, Flor): el fondo suave de marca (opciones sin elegir, ítem activo del menú, etiquetas) pasa del 8% al 5% del color de marca.
12. **Solo el botón secundario lleva borde** (14/10, Flor): el principal y el de borrar o cancelar van sin borde en todos sus estados (normal, al pasar el mouse y deshabilitado). El secundario mantiene fondo claro con borde.
13. **Línea de campos y buscador** (14/10, Flor): gris de 1 px por defecto; al escribir, la misma línea pasa a 2 px y negra, sin contorno de foco aparte (evita la doble línea); con error, 2 px en rojo. Si un campo con error está activo, sigue rojo y suma un fondo rojo muy suave, para que se note dónde se está escribiendo (propuso Claude).
14. **Borde de campos, buscador y cantidad en gris claro** (14/10, Flor): vuelve al gris del sistema (#d9d9d9). Riesgo de accesibilidad (avisado por Claude): da 1,4:1 sobre blanco, menos que el 3:1 recomendado para bordes de controles; personas con baja visión o con el brillo bajo pueden no ver dónde está el campo. Se compensa con la etiqueta arriba de cada campo y la línea negra de 2 px al escribir. Para un cliente que lo necesite más marcado: `--linea-campo: var(--linea-fuerte);` en su `estilo.css`.

## Pendientes (al 14/10/2026)

1. **Confirmar en páginas oficiales** los datos marcados ⚠️ (`08-investigacion-fase-2.md`, punto 12, y `11-publicar-demo.md`).
2. **Fase 4** (publicación de la demo): aprobada el 13/10. Publicada en https://tienda-modelo.atlas-de5cd208129d.workers.dev desde `main`; probada por Flor desde el celular.
3. **Estilo por cliente (D-19) y sistema de diseño de base (D-21):** D-21 entregado el 14/10, a revisar por Flor. Falta decidir si se arma un muestrario de estilos de inspiración.
4. **Prueba con Google de verdad:** al final, con la lista de pruebas (guía `09`, paso 8).
5. **Después (no ahora):** pruebas en Android de gama media, prueba semanal automática de compra, script de alta de cliente nuevo (`05-arquitectura-y-fases.md`).
