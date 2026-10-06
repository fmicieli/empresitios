# 01 · Producto

## Qué es

Tienda con marca y dominio propios donde el comprador arma su pedido, completa sus datos y lo cierra por WhatsApp con un número de compra. El comercio administra todo desde un admin propio, simple y mobile-first, que guarda los datos en su Google Sheets y sus fotos en su Google Drive.

Sin pago online: el comercio cobra por transferencia o efectivo, y coordina envío y entrega por WhatsApp.

## Para quién

- **Comercio:** emprendimientos y comercios chicos con catálogo acotado (hasta unos 200 productos) que ya venden por WhatsApp e Instagram. Pueden ser dueños poco técnicos o no tan jóvenes, que manejan casi todo desde el celular, aunque la primera carga y las cargas grandes se hacen en la compu.
- **Comprador:** cliente final que llega desde Instagram o por link, casi siempre desde el celular y muchas veces desde un Android de gama media.

Todo esto es hipótesis de partida, no está validado con usuarios. No diseñes ni optimices sobre supuestos como si fueran datos confirmados.

## Problema (hipótesis)

Los comercios chicos venden por WhatsApp de forma desordenada: mandan fotos y precios a mano en cada consulta, responden una y otra vez "¿hay en talle M?" y pierden el registro de qué se pidió. Las plataformas "hacelo vos" (Tiendanube, Empretienda, Pedix) les quedan grandes o no saben o no quieren armarlas solos.

## Propuesta de valor

- Frente al catálogo de WhatsApp Business: marca y dominio propios, stock por variante, datos del comprador y número de compra.
- Frente a Tiendanube, Empretienda o Pedix: se la dejamos hecha (diseño adaptado, configuración, primera carga, capacitación y mantenimiento), con un admin pensado para dueños no técnicos y un cierre por WhatsApp con número de compra.
- El precio no es el diferencial (Tiendanube tiene plan gratis). El diferencial es que el comercio no tiene que hacer nada para tener su tienda andando.

## Decisiones tomadas (y por qué)

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Admin | Admin propio, mobile-first, con Google Sheets y Drive detrás | Una planilla como admin es incómoda en el celular y fácil de romper; Supabase sumaría un costo mensual |
| Acceso al admin | Una sola cuenta de Google, la del negocio (Gmail, Workspace o cuenta de Google creada con su Outlook). Publicación con acceso exclusivo para esa cuenta | Sin contraseñas propias que construir ni mantener; seguridad y recuperación las resuelve Google |
| Empleados | Cuentas propias por empleado, como mejora futura. Mientras tanto, usan la cuenta del negocio | Requiere otra forma de publicar el script (ver pendientes técnicos) |
| Envío | El comprador elige envío o retiro; el costo se cotiza por WhatsApp | Simple y cubre la mayoría de los casos |
| Datos del comprador | Nombre, WhatsApp (obligatorio), entrega, dirección si es envío, forma de pago preferida, nota opcional. Sin correo ni login | El número del WhatsApp no llega al sistema por sí solo; sin él no funciona el botón de chat del admin. El correo no se usa |
| Número de compra | Correlativo desde #1001, asignado al guardar el pedido | Vincula el chat con el pedido; arrancar en 1001 no deja ver el volumen de la tienda |
| Reserva de stock | Al enviar el pedido se reservan las unidades 24 h (configurable) | Evita vender dos veces la última unidad; los pedidos que nunca se mandan por WhatsApp devuelven el stock solos |
| Estados del pedido | Pendiente → Confirmada / Cancelada (vendedor) o Vencida (automático) | El sistema no sabe si el WhatsApp se envió: confirma el vendedor |
| Stock | Se lee en vivo (stock menos reservas). El stock del admin es el total del negocio, incluidas ventas en el local | El comprador ve el stock libre real |
| Seguimiento | Cobro, envío y entrega los gestiona el vendedor por WhatsApp | Es lo que ya hace hoy |
| Mails | No hay mails en esta plantilla | El mensaje de WhatsApp funciona como comprobante |
| Categorías | Hasta dos niveles (categoría › subcategoría), opcionales. Las define y cambia quien mantiene el sitio, no el comercio | Son el menú de la tienda: evita duplicados y desorden |
| Código (SKU) | Opcional, uno por producto, interno | Útil para algunos comercios, fricción para otros |
| Buscador | Por nombre del producto en la tienda; por nombre o código en el admin | Pedido explícito de la dueña del producto |
| Fotos | Se suben desde el admin, se achican antes de subir, se guardan en Drive y se sirven optimizadas desde el sitio | Drive no está pensado para servir imágenes a una web |
| Tienda en un solo modo | Esta plantilla solo cierra por WhatsApp; no se mezcla con pago online | Regla del proyecto |

## Descartados

- Usar Google Sheets directamente como admin (incómodo en el celular, fácil de romper).
- Supabase para esta plantilla (costo mensual para el cliente).
- Login propio con email y contraseña para el admin (hay que construir y asegurar contraseñas, recuperación por mail; igual hace falta una cuenta de Google).
- Canva como fuente de fotos o stock; nombrar archivos de fotos a mano; AppSheet.
- Mails al comprador; login del comprador.
- Sección de stock aparte en el admin (el dueño busca productos, no inventario).

## Cómo sabríamos que funciona

- El comprador completa un pedido desde el celular sin ayuda.
- Un dueño no técnico carga un producto con variantes y fotos sin ayuda.
- El mensaje de WhatsApp llega claro y no hace falta repreguntar.

## Fuera de alcance de la v1

Pago online, costo de envío calculado, cupones, mails, login del comprador, empleados con cuentas propias, foto por color, varios niveles de categorías más allá de dos, vista de recuento de stock, registro de ventas del local como pedido.
