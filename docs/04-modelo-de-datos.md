# 04 · Modelo de datos

La planilla de Google vive en la cuenta del comercio y es la "trastienda": el comercio no necesita abrirla. Esta es una **propuesta inicial**; ajustala si la fase de investigación técnica muestra algo mejor, y explicame el cambio.

## Pestañas de la planilla modelo

Encabezados en la fila 1, protegidos. Pestañas sensibles protegidas para que solo el script y quien mantiene el sitio escriban.

### `Config` (clave / valor)

| clave | ejemplo |
| --- | --- |
| nombreTienda | [Tu marca] |
| whatsappTienda | 5491155550000 |
| horasReserva | 24 |
| direccionLocal | [Dirección del local] |
| horarios | Lun a Vie 10 a 19 |
| instagram | https://instagram.com/... |
| textoPrivacidad | Usamos estos datos solo para gestionar tu pedido. |
| proximoNumero | 1001 |

(Estilo, colores y logo van en el archivo de configuración del repo, no acá.)

### `Categorias` (la edita solo quien mantiene el sitio)

| orden | categoria | subcategoria | visible |
| --- | --- | --- | --- |
| 1 | Mujer | Remeras | sí |
| 2 | Mujer | Vestidos | sí |
| 3 | Hombre | Buzos | sí |
| 4 | Accesorios |  | sí |

Fila sin subcategoría = categoría de un solo nivel.

### `Productos`

| columna | tipo | notas |
| --- | --- | --- |
| id | texto | generado, nunca cambia |
| nombre | texto | |
| categoria | texto | "Mujer › Remeras" o "Accesorios" |
| precio | número | pesos, entero |
| descripcion | texto | opcional |
| codigo | texto | opcional (SKU) |
| visible | sí/no | "Mostrar en la tienda" |
| colores | texto | lista separada por `|`, vacía si no tiene |
| talles | texto | lista separada por `|`, vacía si no tiene |
| fotos | texto | ids de archivos de Drive separados por `|`, en orden (la primera es la principal) |
| creado / actualizado | fecha | |

### `Stock` (una fila por variante)

| productoId | color | talle | cantidad |
| --- | --- | --- | --- |
| p1 | Negro | M | 1 |
| p5 | Negro |  | 5 |

`cantidad` = stock total del negocio (incluye lo reservado). Color o talle vacíos si el producto no los usa.

### `Pedidos`

| columna | notas |
| --- | --- |
| numero | correlativo desde 1001, único |
| creado | fecha y hora |
| venceEn | creado + horasReserva |
| estado | pendiente / confirmada / cancelada / vencida |
| nombre, whatsapp | del comprador |
| entrega | envio / retiro |
| direccion, localidad | solo si envío |
| pago | transferencia / efectivo |
| nota | opcional |
| total | suma de líneas, sin envío |
| actualizado | fecha y hora del último cambio de estado |

### `PedidoItems`

| numero | productoId | nombreProducto | color | talle | cantidad | precioUnitario | codigo |
| --- | --- | --- | --- | --- | --- | --- | --- |

Se guarda nombre, precio y código **al momento del pedido**, por si después cambian en el producto.

### `Registro` (recomendado)

Fecha, acción (pedido creado, confirmado, cancelado, vencido, stock ajustado, producto guardado), detalle. Sirve para "Deshacer", soporte y mantenimiento. Sin datos personales completos.

## Reglas de stock y reservas

- **Reservado(variante)** = suma de `cantidad` en `PedidoItems` de pedidos con estado `pendiente`.
- **Stock libre(variante)** = `Stock.cantidad` − reservado. Es lo que ve el comprador.
- **Crear pedido** (operación atómica, con bloqueo para que dos compradores no tomen la misma última unidad):
  1. Bloquear.
  2. Verificar stock libre de cada línea. Si alguna no alcanza, liberar y devolver qué líneas fallaron.
  3. Tomar `proximoNumero`, incrementarlo.
  4. Escribir `Pedidos` y `PedidoItems` con estado `pendiente` y `venceEn`.
  5. Liberar el bloqueo y devolver número y vencimiento.
- **Confirmar**: estado → `confirmada`; restar cantidades de `Stock` (mínimo 0).
- **Cancelar**: estado → `cancelada`; si venía de `confirmada`, sumar cantidades a `Stock`.
- **Vencer**: un proceso automático periódico pasa a `vencida` los pendientes con `venceEn` pasado. Además, cualquier lectura de stock debe ignorar pendientes ya vencidos aunque el proceso todavía no haya corrido.
- **Confirmar un vencido**: verificar stock libre; si no alcanza, el admin pregunta (ver `03-admin.md`); si confirma igual, restar con mínimo 0.
- **Deshacer**: revertir el último cambio de estado y su efecto en el stock.
- **Ajuste rápido**: escribir la nueva `cantidad` (nunca negativa). Si queda por debajo de lo reservado, el admin avisa; no se bloquea.

## Normalizaciones

- **Precio**: quitar todo lo que no sea dígito ("15.000" → 15000).
- **WhatsApp del comprador** para armar `wa.me`: quitar no dígitos; si empieza con 54 dejarlo; si empieza con 0, quitarlo; anteponer 549. Revisar el caso del 15 después del código de área (propuesta: avisar al validar y guardar el número tal como lo escribió además del normalizado).
- **Búsqueda**: comparar sin mayúsculas ni tildes.
