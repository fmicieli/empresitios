# Preguntas para el cliente

Cuestionario para la primera reunión con un comercio, antes de adaptar la plantilla. Cada pregunta dice **por qué se hace**, **qué responde la plantilla si el cliente no sabe** (el valor por defecto) y **dónde se carga** la respuesta.

- Lo que se carga en la **planilla** (pestaña `Config`) lo puede cambiar quien mantiene el sitio en cualquier momento, sin tocar código.
- Lo que se carga en **`tienda.config.ts`** se cambia en el repo del cliente y se publica.
- Si una respuesta no entra en las opciones, **no se promete**: se anota y se consulta (puede ser un cambio de la plantilla, no del cliente; regla 5 de `CLAUDE.md`).

---

## 1. Reglas de pedidos (defensas contra pedidos falsos)

Contexto para explicarle al cliente: cada pedido que llega **reserva stock** hasta que lo confirma o vence. Alguien con mala intención (o un error) podría reservar todo el stock con pedidos que nunca paga. Estas reglas lo frenan. Los valores por defecto los elegimos nosotros (D-16, D-17); conviene ajustarlos según el tamaño del stock y cómo vende cada comercio.

| # | Pregunta para el cliente | Por qué | Por defecto | Dónde |
|---|---|---|---|---|
| 1.1 | ¿Cuántas unidades **de un mismo producto** puede llevar una persona en un pedido? | Si tenés poco stock de algo, un solo pedido no debería poder llevarse todo. Si tenés mucho, o vendés por cantidad, el número tiene que ser más alto. | 10 | Planilla → `maxUnidadesPorProducto` |
| 1.2 | ¿Cuántas unidades **en total** puede tener un pedido? | Mismo motivo, para todo el pedido. | 20 | Planilla → `maxUnidadesPorPedido` |
| 1.3 | ¿Cuántos pedidos **sin confirmar** puede tener el mismo teléfono a la vez? | Evita que un mismo número reserve stock con muchos pedidos. Si alguien llega al tope, ve "Ya tenés pedidos esperando confirmación. Escribile a la tienda por WhatsApp." | 2 | Planilla → `maxPendientesPorWhatsapp` |
| 1.4 | Si alguien manda **el mismo pedido exacto dos veces** (por ejemplo, porque tocó dos veces), ¿lo tomamos como uno solo? | Evita pedidos duplicados en el admin y stock reservado de más. La persona ve "Ya enviaste este mismo pedido…". | Sí | Planilla → `bloquearPedidosRepetidos` |
| 1.5 | ¿Cuántas horas reservás el stock de un pedido hasta que lo confirmás? | Si no confirmás a tiempo, el stock vuelve a la tienda solo. | 24 h | Planilla → `horasReserva` |
| 1.6 | ¿Vendés por mayor o a revendedores? | Si la respuesta es sí, los topes de 1.1 y 1.2 casi seguro no sirven: hay que hablarlo antes de cargar números. | — | Consultar |
| 1.7 | ¿Te llegan hoy pedidos falsos, de broma o de gente que no responde? ¿Cuántos? | Ayuda a decidir si los topes tienen que ser más estrictos o más flexibles. | — | Solo para decidir |

Cómo se ve en la tienda: el "+" nunca deja pasar el **stock disponible** del producto, y además se frena al llegar al tope de 1.1 / 1.2, con la línea "Llegaste al máximo de unidades por pedido."

En el admin, si un mismo número tiene 2 o más pedidos pendientes, aparece "Cancelar los pedidos pendientes de este número" para limpiar pedidos falsos de una vez.

## 2. Quién usa el admin

| # | Pregunta | Por qué | Dónde |
|---|---|---|---|
| 2.1 | ¿Tienen una cuenta de Google del negocio? Si no, ¿la creamos? | La planilla, las fotos y el ingreso al admin quedan en esa cuenta, no en la personal de nadie. | Guía `09`, paso 1 |
| 2.2 | ¿Quiénes van a entrar al admin? (correo de Google de cada persona) | Solo entran los correos de la lista. | Planilla → `correosAdmin` |
| 2.3 | ¿La cuenta tiene verificación en dos pasos? | La planilla guarda datos personales de compradores (Ley 25.326). | Pedirle que la active |

## 3. Datos de la tienda

| # | Pregunta | Dónde |
|---|---|---|
| 3.1 | Nombre de la tienda y una frase corta que la describa (para buscadores y al compartir el link). | `tienda.config.ts` → `nombre`, `descripcion` |
| 3.2 | Número de WhatsApp que **recibe los pedidos**. | `tienda.config.ts` → `whatsapp` |
| 3.3 | ¿Tienen local para retirar? Dirección y horarios. | `tienda.config.ts` → `direccionLocal`, `horarios` |
| 3.4 | Redes sociales (links). | `tienda.config.ts` → `redes` |
| 3.5 | Logo (archivo) y color de marca. | `tienda.config.ts` → `estilo` |
| 3.6 | ¿Tienen dominio? ¿Cuál? Si no, ¿lo compramos? (es el único costo para el cliente) | Guía `09`, pasos 3 a 7 |
| 3.7 | Texto de privacidad: quién es el responsable de los datos y un contacto. Necesita revisión legal. | `tienda.config.ts` → `textoPrivacidad` |

## 4. Catálogo

| # | Pregunta | Dónde |
|---|---|---|
| 4.1 | Categorías y subcategorías (por ejemplo, Mujer › Remeras). | Planilla → pestaña `Categorias` |
| 4.2 | ¿Los productos tienen colores? ¿Talles? ¿Las dos cosas? | Se carga por producto en el admin |
| 4.3 | ¿Usan un código interno por producto? | Se carga por producto en el admin |
| 4.4 | ¿Cuántos productos tienen, más o menos? ¿Tienen fotos? | Para calcular la carga inicial |

## 5. Preguntas que hoy la plantilla no resuelve

Si el cliente necesita algo de esto, **no se promete**: se anota y se evalúa como cambio de la plantilla.

- Solo envío o solo retiro (hoy la tienda ofrece las dos opciones).
- Otros medios de pago además de transferencia y efectivo.
- Precio de envío calculado en la tienda (hoy se cotiza por WhatsApp).
- Que la dueña cambie los topes del punto 1 desde el admin (hoy se cambian en la planilla).

---

Al terminar la reunión: copiar las respuestas en este orden, cargar lo que corresponde siguiendo `09-guia-conectar-cliente.md` y anotar en el repo del cliente cualquier valor distinto del de por defecto y por qué.
