# 06 · Textos de interfaz

Español rioplatense, vos, frases cortas. Los textos que dependen del comercio (nombre, dirección, privacidad) salen de la configuración. Los textos de interfaz conviene centralizarlos en un archivo para poder ajustarlos sin tocar componentes.

## Tienda

| Lugar | Texto |
| --- | --- |
| Buscador | Buscar productos |
| Resultados | {n} productos para "{término}" |
| Sin resultados | No encontramos "{término}" · Probá con otra palabra o mirá las categorías. · Consultar por WhatsApp |
| Etiqueta | Sin stock |
| Pocas unidades | Queda 1 en talle {talle} / Quedan {n} en talle {talle} |
| Botón ficha | Agregar al carrito |
| Agregado | Agregaste {producto} ({variante}) al carrito. |
| Consulta | ¿Dudas con el talle? Consultanos por WhatsApp |
| Barra carrito | Ver carrito · {n} · {total} |
| Carrito agotado | Se agotó mientras elegías · Elegí otra opción o quitalo para seguir. |
| Carrito parcial | Quedan {n} de esta opción · Bajá la cantidad para seguir. |
| Aviso envío | El envío se cotiza por WhatsApp. Si elegís retiro, no tiene costo. |
| Ayuda WhatsApp | Para que la tienda pueda responderte. Con o sin 0 y 15. |
| Errores | Escribí tu nombre. / Escribí tu WhatsApp con código de área, por ejemplo 11 5555 0000. / Escribí la dirección de entrega. / Escribí la localidad. |
| Botón datos | Enviar pedido por WhatsApp |
| Enviando | Estamos reservando tus productos · En unos segundos se abre WhatsApp con tu pedido listo para enviar. · No cierres esta pantalla. |
| Confirmación | Tu número de pedido · Te reservamos los productos por {h} h (hasta {fecha}). · Último paso: mandá el mensaje · Si no se abrió WhatsApp, tocá acá · Qué sigue: la tienda te responde por WhatsApp con el costo de envío y los datos para pagar. |

## Mensaje de WhatsApp (comprador → tienda)

```
Hola, quiero hacer este pedido:

Pedido #{numero}
• {producto} · {color} · Talle {talle} × {cantidad} · {subtotal línea}
• ...

Subtotal: {total} (envío a cotizar)
Nombre: {nombre}
Entrega: envío a {dirección}, {localidad}   |   retiro en el local
Pago: {transferencia|efectivo}
Nota: {nota}            ← solo si hay
```

## Admin

| Lugar | Texto |
| --- | --- |
| Ingreso | Administrá tu tienda · Pedidos, productos y stock, desde el celular. · Entrar con Google · Entrá con la cuenta de Google de tu negocio. Con otra cuenta, Google no te va a dejar pasar. |
| Pedidos vacío | Estás al día · No hay pedidos pendientes. Cuando alguien compre en tu tienda, el pedido aparece acá y te llega el WhatsApp. · Copiar link de mi tienda |
| Reserva | Reserva · vence en {h} h / Stock reservado · vence en {h} h. Si no confirmás antes, vuelve a la tienda. |
| Confirmando | Confirmando… · Puede tardar unos segundos. No hace falta tocar de nuevo. |
| Aviso confirmar | Venta #{n} confirmada. Se descontó del stock. · Deshacer |
| Aviso cancelar | Pedido #{n} cancelado. El stock volvió a la tienda. · Deshacer |
| Vencido sin stock | No queda stock libre de este talle · Avisarle por WhatsApp · Confirmar igual, tengo la prenda · Si confirmás igual, el stock de ese talle queda en 0 hasta que lo corrijas. · Volver sin cambios |
| Mensaje al comprador | Hola {nombre}, te escribo por tu pedido #{n}. |
| Productos aviso | ¿Vendiste en el local o por Instagram? Abrí el producto y descontalo acá. |
| Guardado stock | Guardando… / Cambios guardados / No se pudo guardar · Reintentar |
| Reserva afectada | Hay {n} reservada(s) en #{pedido}. A ese pedido le falta la prenda. Avisale al comprador o cancelá el pedido. |
| Formulario errores | Faltan {n} datos para guardar · Lo que ya completaste no se pierde. · Agregá al menos una foto. · Escribí el nombre del producto. · Elegí una categoría. · Escribí el precio, por ejemplo 15000. |
| Categoría ayuda | ¿Falta una categoría? Pedila por WhatsApp y la sumamos. |
| Precio ayuda | Podés escribir 15000 o 15.000. |
| Código | Código del producto (opcional) · Propio o de tu proveedor. No se muestra en la tienda. · "{código}" ya lo usa {producto}. Podés guardarlo igual o cambiarlo. |
| Visibilidad | Mostrar en la tienda · Si lo apagás, se oculta pero no se borra. |
| Guardando | Guardando… subiendo {n} fotos · Con datos móviles puede tardar un poco. No cierres esta pantalla. |
| Guardado | Producto guardado. Ya aparece en la tienda. |
| Eliminar | ¿Eliminar "{producto}"? No se puede deshacer. Si solo no lo vendés por un tiempo, ocultalo. |
