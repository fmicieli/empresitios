# Repos de clientes: crearlos y traerles las mejoras de la plantilla

Cada tienda (cliente o ejemplo, como Chacha) tiene **su propio repositorio**, copia de esta plantilla (`empresitios`).
En el repo del cliente **solo cambian** configuración, estilo y contenido (regla 5 de `CLAUDE.md`):

- `tienda-whatsapp/config/tienda.config.ts` — nombre, WhatsApp, banner, redes, etc.
- `tienda-whatsapp/config/estilo.css` — fuentes, colores y formas.
- `tienda-whatsapp/public/` — logo, banner, imagen para compartir y fotos de ejemplo.
- Los productos de ejemplo del modo de prueba (si la tienda se muestra sin conectar a Google).

**Todo lo demás se arregla en la plantilla** y después se trae a cada cliente.

## Crear el repo de un cliente (una vez)

1. Flor crea el repo vacío y privado en GitHub (https://github.com/new, sin README) y le da acceso a la app de Claude.
2. Claude copia la plantilla adentro y deja el "enganche" con la plantilla:
   ```
   git clone https://github.com/fmicieli/NOMBRE-DEL-REPO
   cd NOMBRE-DEL-REPO
   git remote add plantilla https://github.com/fmicieli/empresitios
   git remote set-url --push plantilla NO_SE_SUBE_A_LA_PLANTILLA   # nunca se sube nada a la plantilla desde un cliente
   git fetch plantilla main
   git checkout -B main plantilla/main
   git push -u origin main
   ```
3. Se conecta un Worker nuevo de Cloudflare al repo del cliente, igual que la demo (`11-publicar-demo.md`, pasos 2 a 4), con otro nombre.

## Traer las mejoras de la plantilla (cada vez que se mejora la base)

Después de unir un cambio a `main` en `empresitios`:

```
cd NOMBRE-DEL-REPO
git fetch plantilla main
git merge plantilla/main
npm install && npm test
git push
```

- Si git avisa de un **conflicto**, casi siempre es en `tienda.config.ts` o `estilo.css` (la plantilla cambió un archivo que el cliente personalizó). Se queda con los valores del cliente y se suma lo nuevo de la plantilla (por ejemplo, un campo nuevo de configuración).
- Para que haya pocos conflictos, en la plantilla esos dos archivos se cambian lo menos posible.

## Repos de clientes hoy

| Repo | Para qué | Link publicado |
|---|---|---|
| `fmicieli/chacha-tienda` (privado) | Ejemplo con marca: Chacha, emprendimiento de Flor | Pendiente |
