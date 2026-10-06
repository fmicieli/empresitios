# 05 · Arquitectura y fases

## Principios

- **Gratis para el cliente** salvo el dominio: Cloudflare Pages (gratis, uso comercial permitido) y la cuenta de Google del comercio.
- **Los datos son del cliente**: planilla, fotos y cuenta de Google a su nombre. Si deja el servicio, se le entregan código y accesos.
- **Capa de datos intercambiable**: una interfaz única (`dataStore`) con dos implementaciones:
  - `local`: datos de ejemplo en el navegador (para testear sin backend).
  - `appsScript`: Google Sheets y Drive vía Apps Script.
- El admin vive en `compartido/` y se diseña para sumar módulos en otras plantillas (reservas, turnos).

## Interfaz sugerida de la capa de datos

```
getConfig()
getCategorias()
getProductos({ incluirOcultos })          // con stock total y stock libre por variante
crearPedido({ items, comprador })         // atómico: verifica, numera, reserva → { numero, venceEn } o { error, lineas }
getPedidos({ estado })
confirmarPedido(numero, { forzar })
cancelarPedido(numero)
deshacer(idAccion)
ajustarStock(productoId, color, talle, cantidad)
guardarProducto(producto)                 // alta o edición
eliminarProducto(id)
subirFoto(archivoAchicado) → idFoto
```

Ajustala si hace falta; lo importante es que la UI no dependa de la implementación.

## Fases de trabajo

### Fase 0 — Plan
Leer `CLAUDE.md` y `docs/`, proponer estructura de carpetas, dependencias y plan de fases. Esperar OK.

### Fase 1 — Tienda y admin con datos locales
**Estado: terminada (6/10/2026), esperando OK de Flor.** Cómo probarla: `README.md`.

- Toda la tienda (`02-tienda.md`) y todo el admin (`03-admin.md`) con la implementación `local`.
- Tienda y admin comparten los datos en el mismo navegador: lo que se carga en el admin aparece en la tienda y lo que se compra aparece en el admin.
- Simular la demora del servidor (1 a 3 s) para diseñar bien los estados de carga.
- Panel de herramientas de prueba, solo en desarrollo: volver a datos de ejemplo, simular que pasaron las horas de reserva, cargar el WhatsApp de la tienda.
- Datos de ejemplo: tienda de ropa ficticia (ver abajo).
- Entregable: instrucciones para correrlo en local y probarlo desde el celular en la misma red.

### Fase 2 — Investigación técnica (sin código de producción)
Responder por escrito, con fuentes oficiales y fecha de consulta, y proponer arquitectura:

1. **Cuotas de Apps Script** para cuentas gratuitas: ejecuciones, tiempo total por día, disparadores por tiempo, simultaneidad. ¿Alcanzan para una tienda chica con stock en vivo y vencimiento automático de reservas?
2. **Dónde servir el admin.** Requisito: que solo entre la cuenta de Google del negocio, publicando con acceso exclusivo. ¿Eso obliga a que el admin lo sirva el propio Apps Script (HtmlService) en vez de Cloudflare? ¿Cómo se comparte el código del admin entre plantillas en ese caso?
3. **Lecturas de la tienda.** Cómo mostrar stock en vivo sin que cada visita consuma cuota: caché corta en una función de Cloudflare, publicación de un JSON, etc. Qué se lee en vivo (stock) y qué al publicar (fotos, textos).
4. **Concurrencia.** Números de pedido sin duplicados y reserva de la última unidad (LockService u otra opción) y su efecto en la demora.
5. **Seguridad del endpoint público** de creación de pedidos: spam, pedidos falsos masivos que bloqueen stock, validaciones del lado del servidor. Proponer mitigaciones sin fricción para el comprador (límite por número de WhatsApp, por IP vía Cloudflare, etc.).
6. **Fotos.** Subida desde el admin a Drive y cómo se sirven optimizadas (WebP) desde el sitio sin servirlas directo desde Drive.
7. **Empleados con cuentas propias** (futuro): si con la publicación elegida se puede identificar al visitante para chequear una lista de correos autorizados.
8. **Admin en Cloudflare con "Iniciar sesión con Google"** y verificación del correo en Apps Script, comparado con servirlo desde Google. Recomendar una y explicar el impacto para el dueño (barra de aviso, dirección, seguridad). Ver `07-decisiones.md` (D-07).
9. **Pedidos falsos**, en detalle: Cloudflare Turnstile (verificar límites del plan gratis), tope de pendientes por número de WhatsApp, máximo de unidades por pedido y botón en el admin para cancelar todos los pendientes de un número.
10. **Fotos:** antes de cambiar el manejo de fotos de la especificación, explicarle la alternativa a Flor y esperar su OK.

### Fase 3 — Conexión con Google
- Implementación `appsScript` según la fase 2.
- Planilla modelo con las pestañas de `04-modelo-de-datos.md`, encabezados y pestañas sensibles protegidas, validaciones.
- Proceso automático de vencimiento de reservas.
- Guía paso a paso para conectar la cuenta de un cliente (copiar planilla, autorizar Apps Script con la pantalla "app no verificada", publicar con acceso exclusivo, conectar la tienda).

### Fase 4 — Publicación de la demo
Cloudflare Pages con la tienda de ropa ficticia. Checklist de lo que se configura por cliente.

### Después (no ahora)
Pruebas en Android de gama media, prueba semanal automática de compra, estilos predefinidos (5 o 6) aplicados por tokens, script de alta de cliente nuevo.

## Datos de ejemplo de la demo

Tienda de ropa ficticia, sin marcas reales:

- Categorías: Mujer (Remeras, Vestidos, Pantalones), Hombre (Remeras, Buzos), Accesorios (sin subcategorías).
- Productos: Remera básica (Negro y Blanco, S a XL, con un talle agotado y uno con 1 unidad), Jean mom (sin colores, talles 36 a 42), Vestido lino (sin stock), Buzo oversize (con código), Gorro de lana (colores sin talles).

## Riesgos conocidos

| Riesgo | Cómo se encara |
| --- | --- |
| Pedidos que nunca se mandan por WhatsApp | Reserva con vencimiento automático; el vendedor confirma manualmente |
| Dos compras simultáneas de la última unidad | Creación de pedido atómica con bloqueo |
| Demora de Apps Script (1 a 3 s) | Estados de carga claros en tienda y admin |
| Límites diarios de Apps Script | Verificar en fase 2; caché de lecturas |
| Fotos pesadas con datos móviles | Achicar en el navegador antes de subir; mostrar progreso |
| Pantalla "app no verificada" de Google | Se hace junto al cliente en la puesta en marcha |
| Datos personales (Ley 25.326) | Pedir solo lo necesario; aviso de privacidad; revisión legal pendiente |
