// Fotos de la clienta: todas las de turnos-whatsapp/fotos/, por nombre de archivo.
// Están fuera de public/ para que Astro las achique y arme los tamaños para cada pantalla al compilar.
import type { ImageMetadata } from 'astro';

const archivos = import.meta.glob<{ default: ImageMetadata }>('../../fotos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
});

export const fotos = new Map<string, ImageMetadata>(
  Object.entries(archivos).map(([ruta, m]) => [ruta.split('/').pop()!, m.default]),
);
