# Publicar el sitio de una clienta (plantilla 2 · Fase 3)

Ejemplo: Estudio V (`fmicieli/estudio-v`). Para otra clienta, cambiá el nombre del repo y del Worker.

Costo: **cero** con la dirección `.workers.dev`. Según la página oficial de Cloudflare, los pedidos a archivos estáticos son gratis y no tienen límite (confirmado el 04/11/2026, D-39). Lo único que se paga es el dominio, si la clienta quiere uno.

Lo hacés vos, con tu cuenta. Yo no puedo entrar a tus cuentas.

---

## 1. Subir el repo a GitHub (una vez)

1. Abrí GitHub Desktop → **File → Add local repository** → elegí la carpeta `Claude Code/estudio-v`.
2. **Publish repository**, con **Keep this code private** tildado. Eso crea `fmicieli/estudio-v`.
3. Revisá en GitHub que la rama principal sea `main` (**Settings → Default branch**).

## 2. Crear el Worker en Cloudflare (una vez, unos 10 minutos)

⚠️ Los nombres de los menús de Cloudflare cambian seguido. Si algo no coincide, buscá el más parecido y avisame.

1. En el panel: **Workers & Pages → Create → Import a repository**.
2. Elegí `fmicieli/estudio-v`. Si no aparece: https://github.com/settings/installations → **Cloudflare Workers and Pages** → **Configure** → marcá el repo → **Save**.
3. Completá:
   - **Project name:** `estudio-v`. Tiene que ser igual al `"name"` de `turnos-whatsapp/wrangler.jsonc`.
   - **Build command:** `npm run build:turnos`
   - **Deploy command:** `npm run desplegar:turnos`
   - **Enable Preview builds:** apagado.
   - **Advanced settings:** *Path* `/`; *API token* "Create new token"; sin variables ni secretos.
4. **Deploy.** Al terminar, el registro muestra la dirección: `https://estudio-v.TU-SUBDOMINIO.workers.dev`.
5. **Settings → Build → Branch control:** la rama de producción tiene que ser `main`.

Desde ahí, cada cambio que llega a `main` se publica solo.

## 3. Completar la dirección del sitio

Con la dirección del paso 2 (o el dominio, si ya está):

1. En `turnos-whatsapp/config/sitio.config.ts`, poné `urlSitio: 'https://…'`.
2. Subilo a `main`. Recién ahí sale la imagen al compartir el link.

## 4. Antes de mandarle el link a la clienta

Mientras quede algún "[completar]" en `contenido.ts`, el sitio **no aparece en Google** (lleva `noindex`, D-39), pero cualquiera con el link lo ve. Sirve para que la clienta lo revise. Para la versión final no tiene que quedar ninguno: la compilación los lista como avisos.

## 5. Probarlo en un Android de gama media

Abrí el link desde Instagram (el navegador de Instagram es el caso real) y también desde Chrome:

- [ ] Carga rápido con datos móviles, sin saltos raros mientras aparecen las fotos.
- [ ] El menú abre y cierra, y cada link baja a su sección.
- [ ] "Reservar" en un tratamiento con varios lugares abre "¿Dónde te queda mejor?". Sin elegir, avisa "Elegí un lugar o «Me da igual»".
- [ ] Al elegir, abre WhatsApp con el número de la clienta y el mensaje con tratamiento, duración, precio y lugar.
- [ ] El botón flotante de WhatsApp y el de Contacto mandan el mensaje general.
- [ ] Los certificados se agrandan y se cierran con la X.
- [ ] "Cómo llegar" abre Google Maps con la dirección correcta.
- [ ] Instagram abre el perfil correcto.
- [ ] Una dirección inventada (por ejemplo `/hola/`) muestra la página de "no encontrada".
- [ ] Con letra grande en el celular (Ajustes → Pantalla → Tamaño de fuente) nada se corta.
- [ ] Mandá el link a un chat tuyo de WhatsApp: se ve la imagen, el nombre y la descripción (WhatsApp guarda la primera vista previa: si cambiaste algo, probá en otro chat).

## 6. Dominio (opcional, si la clienta quiere)

- Lo compra **la clienta, a su nombre** (por ejemplo, un `.com.ar` en NIC Argentina, con su clave fiscal). Así el dominio es de ella aunque deje de trabajar con vos.
- Para conectarlo a Cloudflare hace falta que la clienta te dé acceso o que lo hagan juntas. ⚠️ Los pasos dependen de dónde lo compre; armamos la guía cuando lo tenga.
- Después: cambiar `urlSitio` al dominio y subirlo.
