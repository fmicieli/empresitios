# Empresitios · Plantillas para comercios

Plantilla 1: **Tienda con WhatsApp** (tienda + admin del comercio). Documentación completa en `docs/` y contexto en `CLAUDE.md`.

Estado: **Fase 1 terminada** (tienda y admin con datos de prueba en el navegador). Todavía no hay conexión con Google: eso es la Fase 3.

---

## Cómo probarlo

### 1. Lo que necesitás instalar (una sola vez)

- **Node.js 22.12 o más nuevo**: bajalo de [nodejs.org](https://nodejs.org) (versión "LTS") e instalalo como cualquier programa.
- Para confirmar que quedó instalado, abrí la Terminal y escribí `node -v`. Tiene que mostrar `v22.12` o un número mayor.

### 2. Bajar el proyecto y preparar todo (una sola vez)

En la Terminal, parada en la carpeta del proyecto:

```
npm install
```

Esto descarga las herramientas que usa el proyecto (tarda uno o dos minutos).

### 3. Abrirlo en la compu

```
npm run dev
```

Cuando diga que está listo, abrí en el navegador:

- Tienda: http://localhost:4321/
- Admin: http://localhost:4321/admin/

Para cortarlo: en la Terminal, `Ctrl + C`.

### 4. Abrirlo en el celular (misma red wifi)

```
npm run dev:celular
```

En lo que aparece en la Terminal vas a ver una línea **Network** con una dirección tipo `http://192.168.0.15:4321/`. Escribila tal cual en el navegador del celular (el celular tiene que estar en el mismo wifi que la compu).

Si no abre: puede ser el firewall de la compu. En Mac te pregunta si permitís conexiones entrantes a "node": decí que sí.

### 5. Comprobaciones automáticas (opcional)

```
npm test        # 43 pruebas de las reglas de stock, reservas, WhatsApp, etc.
npm run check   # revisa que el código no tenga errores
npm run build   # arma el sitio como quedaría publicado
```

---

## Cosas a tener en cuenta en el modo de prueba

- Arriba de todo hay una **franja amarilla "Modo de prueba"**, con accesos a la tienda, al admin y a las **Herramientas de prueba**. En la versión real no existe.
- **Los datos viven en el navegador.** Lo que cargás en el admin aparece en la tienda y lo que comprás aparece en el admin, **solo en el mismo navegador del mismo dispositivo**. Si comprás desde el celular, el pedido no aparece en el admin abierto en la compu. Es lo esperado hasta la Fase 3.
- **El servidor tarda 1 a 3 segundos a propósito**, para ver los estados de carga como van a ser con Google. Se puede apagar en Herramientas de prueba.
- El ingreso al admin es **simulado** (botón "Entrar con Google (simulado)").
- Para que el mensaje del pedido **te llegue a vos**, cargá tu WhatsApp en Herramientas de prueba. Si no lo cargás, la tienda no abre WhatsApp sola (para no mandar mensajes a un número de ejemplo).

### Herramientas de prueba

- **WhatsApp de la tienda**: tu número, para recibir los pedidos de prueba.
- **Duración de la reserva**: horas que se reserva el stock (24 por defecto).
- **Demora del servidor**: realista (1 a 3 s) o sin demora.
- **Simular una falla al guardar**: mientras esté activa, todo lo que se guarda falla ("como si no hubiera internet" o "como si fallara el servidor") para ver los mensajes de error. Arriba aparece "⚠ Falla simulada activada". Volvé a "No" para seguir probando normal.
- **Simular que pasaron las horas**: vence las reservas pendientes.
- **Volver a los datos de ejemplo**: borra todo lo que hiciste y vuelve a la tienda inicial.

---

## Guía de prueba sugerida

La tienda de ejemplo ("Tienda Modelo") trae casos preparados:

| Producto | Para probar |
| --- | --- |
| Remera básica | Colores y talles; Negro XL agotado; Negro M con 1 unidad ("Queda 1 en talle M"); Blanco M con 2 reservadas por el pedido #1003 |
| Jean mom | Talles sin colores |
| Vestido lino | Todo sin stock (tarjeta atenuada, se puede abrir, no comprar) |
| Buzo oversize | Tiene código (BZ-GR), dos colores |
| Gorro de lana | Colores sin talles |
| Pañuelo de seda | Oculto: no aparece en la tienda, sí en el admin |

Pedidos de ejemplo: **#1003 pendiente**, **#1002 vencido** (pide la Remera Negro XL, que no tiene stock: sirve para probar "Confirmar igual, tengo la prenda") y **#1001 confirmado**.

### Tienda (comprador)

1. Buscar "basica" (sin tilde) → aparece la Remera resaltada. Buscar "campera" → "No encontramos…".
2. Entrar a Mujer → aparece la segunda fila de subcategorías.
3. Abrir la Remera, elegir Negro + M → "Queda 1 en talle M". XL aparece tachado.
4. Agregar al carrito → aviso "Agregaste…" y barra "Ver carrito" abajo.
5. Carrito (con "Tus datos" en la misma pantalla) → tocar "Enviar pedido" vacío → errores en rojo, arriba y en cada campo.
6. Escribir el WhatsApp en cualquier formato (`011 15 5555-0000`, `+54 9 11…`) → aparece "Te van a escribir al +54 9 11 5555-0000".
7. Enviar → se abre WhatsApp en una pestaña nueva con el mensaje redactado; en la tienda queda "¡Listo!…" y el carrito se vacía.
8. **Última unidad**: agregar la Remera Negro M en una pestaña, comprarla en otra, y volver al carrito de la primera → "Se agotó mientras elegías".

### Admin (comercio)

1. Pedidos → Confirmar el #1003 → "Confirmando…" → aviso con **Deshacer**.
2. Vencidas → #1002 → Confirmar venta → aviso "No queda stock libre" con sus 3 opciones.
3. Herramientas → Simular que pasaron 24 h → el pendiente pasa a Vencidas y el stock vuelve a la tienda.
4. Productos → tocar la Remera → sumar/restar stock → "Guardando…" → "Cambios guardados" (sin botón). Bajar Blanco M por debajo de 2 → aviso de la reserva afectada.
5. + Agregar → guardar vacío (errores) → cargar fotos desde la galería o la cámara del celular, nombre, categoría, precio "15.000", talles, stock → Guardar → aparece en la tienda.
6. Editar un producto y quitar un color con stock → aviso antes de descartar ese stock.
7. Herramientas → Simular una falla al guardar: "como si no hubiera internet" → confirmar un pedido o guardar stock → mensaje de error en rojo, nada se da por guardado. Después volvé a "No".

---

## Estructura

```
compartido/        lo reutilizable entre plantillas
  datos/           capa de datos: contrato, reglas, implementación local (y appsScript en Fase 3)
  admin/           admin por módulos: nucleo, pedidos, productos
  carrito/         carrito del comprador
  componentes/     botones, campos, avisos, fotos, diálogos
  estilos/         tokens.css (el diseño se cambia acá) y base.css
  textos/          todos los textos de interfaz
  whatsapp/        mensaje del pedido
  herramientas/    herramientas de prueba
tienda-whatsapp/   esta plantilla
  config/tienda.config.ts   TODO lo que cambia por cliente
  datos-ejemplo/            la tienda de ropa ficticia
  src/                      páginas de la tienda y montaje del admin
apps-script/       (Fase 3) Google Apps Script y planilla modelo
docs/              especificación y decisiones
```
