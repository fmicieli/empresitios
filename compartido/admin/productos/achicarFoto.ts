// Achica una foto en el navegador antes de subirla (docs/03-admin.md):
// lado mayor ~1600 px, en WebP (o JPEG si el navegador no sabe hacer WebP).

const LADO_MAYOR = 1600;
const CALIDAD = 0.82;

async function cargar(archivo: Blob): Promise<{ img: CanvasImageSource; ancho: number; alto: number; liberar: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      // imageOrientation respeta la rotación de las fotos del celular.
      const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      return { img: bmp, ancho: bmp.width, alto: bmp.height, liberar: () => bmp.close() };
    } catch {
      /* probamos con <img> */
    }
  }
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { img, ancho: img.naturalWidth, alto: img.naturalHeight, liberar: () => URL.revokeObjectURL(url) };
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob(r, tipo, CALIDAD));
}

export async function achicarFoto(archivo: File): Promise<Blob> {
  const { img, ancho, alto, liberar } = await cargar(archivo);
  try {
    const escala = Math.min(1, LADO_MAYOR / Math.max(ancho, alto));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);
    const g = canvas.getContext('2d');
    if (!g) throw new Error('sin canvas');
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = await aBlob(canvas, 'image/webp');
    if (webp && webp.type === 'image/webp') return webp;
    const jpeg = await aBlob(canvas, 'image/jpeg');
    if (!jpeg) throw new Error('no se pudo convertir');
    return jpeg;
  } finally {
    liberar();
  }
}
