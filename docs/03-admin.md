# 03 · Admin (portal del comercio)

El dueño usa una interfaz simple; detrás, el admin escribe solo en su planilla y su Drive. Nadie edita la planilla a mano salvo quien mantiene el sitio. Mobile-first; en escritorio se adapta (menú lateral, tablas, formulario a dos columnas). Se construye en `compartido/` para reutilizarlo en otras plantillas.

## Acceso

- Versión real: "Entrar con Google". Solo puede entrar la cuenta de Google del negocio: el Apps Script se publica con acceso exclusivo para esa cuenta y Google bloquea a cualquier otra ("No tenés acceso"). No hay contraseñas propias.
- Pantalla de ingreso: logo, "Administrá tu tienda", botón "Entrar con Google", ayuda "Entrá con la cuenta de Google de tu negocio", tip para agregarlo a la pantalla de inicio del celular, link de ayuda por WhatsApp.
- Fase 1 (datos locales): ingreso simulado.

## Navegación

- Celular: barra inferior con **Pedidos** (inicio, con contador de pendientes) y **Productos**.
- Escritorio: menú lateral con lo mismo y "Ver mi tienda".

## Pedidos

### Lista

- Filtros: Pendientes (por defecto) · Confirmadas · Canceladas · Vencidas · Todas, con contador.
- Celular: tarjetas con número y nombre, hace cuánto, productos, total, estado y, en pendientes, botones **Confirmar** y **Cancelar** directo en la tarjeta. Pendientes arriba.
- Escritorio: tabla (número, comprador, productos, total, reserva, acción) con el detalle en un panel lateral.
- Etiqueta de reserva: "Reserva · vence en 23 h"; se marca más fuerte cuando faltan menos de 3 horas.
- Buscador por número o nombre (escritorio; recomendable también en celular).
- Estado vacío de pendientes: "Estás al día. Cuando alguien compre en tu tienda, el pedido aparece acá y te llega el WhatsApp." con botón "Copiar link de mi tienda".

### Estados y efecto en el stock

| Estado | Cuándo | Stock |
| --- | --- | --- |
| Pendiente | Al enviar el pedido (automático) | Reservado por las horas configuradas |
| Confirmada | La marca el vendedor | Se descuenta definitivamente |
| Cancelada | La marca el vendedor | Vuelve al stock (si estaba confirmada, se suma de nuevo) |
| Vencida | Pasaron las horas sin respuesta (automático) | Vuelve al stock |

- Confirmar o cancelar muestra un aviso con **"Deshacer"** durante unos segundos.
- Mientras se guarda: el botón muestra "Confirmando…" y no se puede tocar de nuevo.
- Un pedido Vencido se puede confirmar. Si ya no hay stock libre para alguna línea, se muestra un aviso con: "Avisarle por WhatsApp" (abre chat con el comprador con un texto armado), "Confirmar igual, tengo la prenda" (descuenta; el stock nunca queda negativo, queda en 0) y "Volver sin cambios".

### Detalle

- Número, fecha, estado; aviso de reserva ("Stock reservado · vence en 23 h. Si no confirmás antes, vuelve a la tienda.").
- Productos con foto, variante, cantidad, precio y código si existe. Total sin envío.
- Comprador: nombre, WhatsApp, entrega (dirección o retiro), forma de pago, nota.
- **"Abrir chat de WhatsApp"**: `https://wa.me/<número normalizado del comprador>?text=Hola <nombre>, te escribo por tu pedido #<n>.` No requiere agendar al contacto.
- Acciones según estado: Confirmar venta / Cancelar pedido (pendiente o vencida); Cancelar (devuelve el stock) si está confirmada.
- El admin no maneja cobro, envío ni entrega: eso se resuelve por WhatsApp.

## Productos

### Lista

- Encabezado con "+ Agregar".
- Buscador por nombre o código.
- Aviso permanente: "¿Vendiste en el local o por Instagram? Abrí el producto y descontalo acá." El stock del admin es el stock total del negocio.
- Cada producto: foto, nombre, precio, stock total, etiquetas "Sin stock" y "Oculto".
- Escritorio: tabla con categoría, precio, stock, visibilidad y acciones; filtro por categoría.

### Ajuste rápido de stock

- Al tocar un producto se despliega: pestañas por color (si tiene más de uno, con el total por color) y una fila por talle con − / + y el número.
- **Se guarda solo, sin botón.** Espera unos instantes después del último toque y guarda una vez (para no llamar al servidor en cada toque). Estados visibles junto al producto: "Guardando…" → "Cambios guardados". Si falla: "No se pudo guardar · Reintentar", sin perder el número.
- Si hay unidades reservadas en esa variante, se muestra "1 reservada en #1014".
- Si el stock queda por debajo de lo reservado: aviso con los pedidos afectados ("A ese pedido le falta la prenda. Avisale al comprador o cancelá el pedido") y link al pedido.
- El stock nunca baja de 0.
- Link "Editar producto".

### Formulario de producto (alta y edición)

**Regla clave: cada campo es lo que el comprador ve en la ficha** (salvo el código, que es interno). Incluir una vista previa "Así se ve en la tienda" (foto principal, categoría, nombre, precio, colores y talles).

| Campo | Obligatorio | Detalle |
| --- | --- | --- |
| Fotos | Al menos 1 | Varias. Galería o cámara en celular, arrastrar o elegir en compu. La primera es la principal; se puede elegir otra como principal y quitar. Se achican en el navegador antes de subir (ej. lado mayor ~1600 px, JPEG/WebP) y se muestra el progreso de subida |
| Nombre | Sí | — |
| Categoría | Sí | Lista cerrada desde la pestaña Categorías, agrupada por categoría principal ("Mujer › Remeras"). El dueño no crea categorías. Ayuda: "¿Falta una categoría? Pedila por WhatsApp y la sumamos." |
| Precio | Sí | Acepta "15000" y "15.000"; se guarda como número entero de pesos |
| Descripción | No | Texto libre |
| Colores | No | Chips; agregar escribiendo y quitar con × |
| Talles | No | Igual que colores |
| Stock | Sí (puede ser 0) | Grilla color × talle con un número por casilla; si no hay variantes, un solo campo "Unidades". En escritorio se navega con Tab |
| Código (SKU) | No | En "Más opciones". Uno por producto. No se muestra en la tienda; aparece en los pedidos y en el buscador del admin. Si ya lo usa otro producto, avisa pero deja guardar |
| Mostrar en la tienda | — | Interruptor. Apagado = oculto, no se borra |

- Errores: lista arriba ("Faltan 2 datos para guardar") y junto a cada campo, con ícono y texto (no solo color). "Lo que ya completaste no se pierde."
- Guardar: "Guardando… subiendo 2 fotos" con barra de progreso; "Con datos móviles puede tardar un poco. No cierres esta pantalla." Al terminar: aviso "Producto guardado. Ya aparece en la tienda."
- Eliminar (solo en edición): pide confirmación dentro de la página ("No se puede deshacer. Si solo no lo vendés por un tiempo, ocultalo.").
- Si se quitan colores o talles que tenían stock, ese stock se descarta al guardar: avisar antes.

## Categorías

No hay pantalla de categorías en el admin. Las define quien mantiene el sitio en la pestaña `Categorias` de la planilla (protegida). Hasta dos niveles. El orden de la pestaña es el orden del menú de la tienda.

## Casos borde

- Dos personas usando el admin a la vez (dueño en el celular y en la compu): la última escritura gana; recargar datos al volver a la pantalla.
- Sesión de Google vencida: volver a la pantalla de ingreso sin perder lo que se estaba cargando, si es posible.
- Sin conexión: avisar y no dar por guardado nada que no se guardó.
