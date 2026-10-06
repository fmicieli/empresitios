// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { fileURLToPath } from 'node:url';

const compartido = fileURLToPath(new URL('../compartido', import.meta.url));

export default defineConfig({
  integrations: [preact()],
  // Las páginas terminan en "/" (por ejemplo /carrito/), igual que en Cloudflare Pages.
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    resolve: { alias: { '@compartido': compartido } },
    server: { fs: { allow: ['..'] } },
  },
});
