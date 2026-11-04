// @ts-check
// Plantilla 2 · Turnos con WhatsApp (docs/landing/). Sitio estático: sin servidor ni puente.
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const compartido = fileURLToPath(new URL('../compartido', import.meta.url));

export default defineConfig({
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // Otro número que la tienda (4321), para no confundirlas en localhost (D-36).
  server: { port: 4330 },
  vite: {
    resolve: { alias: { '@compartido': compartido } },
    server: { fs: { allow: ['..'] } },
  },
});
