# 02 · Tienda (sitio del comprador)

Mobile-first; en escritorio el mismo sitio se adapta (encabezado con menú desplegable, grilla más ancha, ficha a dos columnas). Referencia visual: bocetos de baja fidelidad y `docs/referencia/prototipo-tienda.html`.

## Mapa

```
Catálogo (inicio) ──► Ficha de producto ──► Carrito ──► Datos del comprador ──► Enviando ──► Pedido registrado ──► WhatsApp
     │    ▲
     ▼    │
  Menú de categorías / Búsqueda
```

## 1. Encabezado (todas las pantallas)

- Logo de la tienda (vuelve al catálogo), botón de menú (celular) y carrito con contador.
- En escritorio: logo, categorías con desplegable de subcategorías, buscador y carrito.

## 2. Catálogo

- Buscador "Buscar productos" siempre visible.
- Chips de categoría principal ("Todo" + categorías). Si la categoría elegida tiene subcategorías, aparece una segunda fila más chica ("Todo Mujer", "Remeras", "Vestidos"…). Si ningún cliente usa subcategorías, no aparece.
- Grilla de productos (2 columnas en celular): foto principal, nombre, precio. Sin stock en todas sus variantes: tarjeta atenuada con etiqueta "Sin stock" (se puede abrir, no comprar).
- Productos con "Mostrar en la tienda" apagado no aparecen.
- Barra fija abajo cuando hay algo en el carrito: "Ver carrito · 2 · $ 42.000".
- Menú lateral (celular): categorías con subcategorías desplegables, "Consultas por WhatsApp", horarios y redes.

## 3. Búsqueda

- Busca por nombre del producto, sin distinguir mayúsculas ni tildes (recomendado normalizar).
- Resultados: "3 productos para 'remera'", la palabra resaltada en cada nombre, los sin stock marcados.
- Sin resultados: "No encontramos 'campera'", accesos a las categorías y botón "Consultar por WhatsApp".

## 4. Ficha de producto

- Migas de pan con la categoría ("Mujer › Remeras").
- Galería: foto principal grande, deslizable en celular; miniaturas en escritorio.
- Nombre, precio.
- Color (si tiene): chips; el elegido se muestra en el título "Color: Negro".
- Talle (si tiene): botones; los sin stock libre para el color elegido aparecen tachados y deshabilitados.
- Aviso de pocas unidades: "Queda 1 en talle M" / "Quedan 2…" cuando el stock libre es 2 o menos.
- Cantidad con − / +, limitada al stock libre menos lo que ya está en el carrito.
- "Agregar al carrito" (deshabilitado si no hay stock libre o falta elegir talle). Al agregar: aviso breve "Agregaste Remera básica (Negro · Talle M) al carrito".
- Descripción.
- Link "¿Dudas con el talle? Consultanos por WhatsApp" (abre chat con la tienda con el nombre del producto).

## 5. Carrito

- Cada línea: foto, nombre, variante, cantidad (− / +, limitada al stock libre), precio, "Quitar".
- Si una línea ya no tiene stock libre suficiente (porque otro comprador reservó mientras tanto): se marca con "Se agotó mientras elegías" o "Quedan N de esta opción", acciones "Ver otras opciones" y "Quitar". No cuenta en el subtotal y no se puede continuar hasta resolverlo.
- Subtotal y aviso: "El envío se cotiza por WhatsApp. Si elegís retiro, no tiene costo."
- "Continuar".

## 6. Datos del comprador

Campos, en este orden:

| Campo | Obligatorio | Detalle |
| --- | --- | --- |
| Nombre | Sí | `autocomplete="name"` |
| Tu WhatsApp | Sí | `type="tel"`, formato tolerante (con o sin 0 y 15, con o sin +54). Ayuda: "Para que la tienda pueda responderte." Validar al menos 8 dígitos |
| ¿Cómo lo recibís? | Sí | Envío a domicilio (costo por WhatsApp) / Retiro en el local (dirección de la configuración, sin costo) |
| Dirección de entrega | Si eligió envío | Calle, número, piso y depto. Solo aparece con envío |
| Localidad | Si eligió envío | Solo aparece con envío |
| ¿Cómo preferís pagar? | Sí | Transferencia / Efectivo (por defecto transferencia) |
| Nota | No | Ej.: horario para recibir |

- Resumen: "1 producto · $ 15.000 + envío a cotizar".
- Botón "Enviar pedido por WhatsApp".
- Aviso de privacidad debajo del botón (texto configurable, pendiente de revisión legal).
- Errores: lista arriba ("Revisá 2 datos") y mensaje junto a cada campo. No se pierde lo cargado.
- No se pide correo ni se crea cuenta.

## 7. Enviando

Al tocar "Enviar pedido":

1. Se vuelve a verificar el stock libre de cada línea. Si algo ya no alcanza, se vuelve al carrito con las líneas marcadas.
2. Se crea el pedido con número correlativo y se reservan las unidades por las horas configuradas (24 por defecto), en una sola operación atómica (ver `04-modelo-de-datos.md`).
3. Se arma el mensaje de WhatsApp.

Pantalla de espera con los tres pasos visibles ("Revisamos que haya stock", "Reservamos tus productos por 24 h", "Preparamos el mensaje de WhatsApp") y "No cierres esta pantalla". Tarda 1 a 3 segundos con Apps Script.

Estado de error (a diseñar en la construcción): sin conexión o error del servidor → mensaje claro y botón "Intentar de nuevo", sin perder carrito ni datos.

## 8. Pedido registrado

- "Tu número de pedido" + número grande (#1015).
- "Te reservamos los productos por 24 h (hasta mañana a las 15:20)."
- Bloque destacado "Último paso: mandá el mensaje" con botón "Abrir WhatsApp" que abre `https://wa.me/<número de la tienda>?text=<mensaje codificado>`. Intentar abrirlo automáticamente al llegar a esta pantalla; el botón queda como respaldo ("Si no se abrió WhatsApp, tocá acá").
- "Copiar el mensaje" (con respaldo si el portapapeles falla).
- "Qué sigue: la tienda te responde por WhatsApp con el costo de envío y los datos para pagar."
- Resumen del pedido y "Volver a la tienda".
- El carrito se vacía.

## 9. Mensaje de WhatsApp

Formato en `06-textos.md`. Incluye número de pedido, productos con variante, cantidad y precio, subtotal con envío a cotizar, nombre, entrega, pago y nota.

## Casos borde a contemplar

- Producto ocultado o eliminado mientras está en un carrito: la línea se marca y no se puede continuar con ella.
- Precio cambiado mientras está en el carrito: el pedido se registra con el precio vigente al enviarlo; mostrar el precio actualizado en el carrito.
- Dos compradores por la última unidad al mismo tiempo: solo uno reserva; el otro ve el aviso en el carrito.
- WhatsApp no instalado (escritorio): `wa.me` abre WhatsApp Web.
- El carrito vive en el navegador del comprador (sobrevive a recargar la página).
