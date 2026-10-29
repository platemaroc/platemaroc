import sharp from 'sharp';

/**
 * Procesado de imágenes en el servidor (decisión del titular, 29-10-2026). Se comprueba el formato por el CONTENIDO del
 * archivo (no por su nombre), se corrige la orientación, se reduce el tamaño y se convierte a WebP. sharp no copia los
 * metadatos salvo que se le pida: así desaparecen EXIF, GPS y datos de la cámara (privacidad).
 */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set(['jpeg', 'png', 'webp', 'heif', 'avif']);

export type ImageResult = { ok: true; data: Buffer; width: number; height: number } | { ok: false; error: string };

export async function processImage(input: ArrayBuffer | Buffer, maxWidth = 1600): Promise<ImageResult> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.byteLength === 0) return { ok: false, error: 'El archivo está vacío.' };
  if (buf.byteLength > MAX_INPUT_BYTES) return { ok: false, error: 'La imagen pesa más de 10 MB.' };
  let format: string | undefined;
  try {
    format = (await sharp(buf).metadata()).format;
  } catch {
    return { ok: false, error: 'No es una imagen válida.' };
  }
  if (!format || !ACCEPTED.has(format)) return { ok: false, error: 'Formato no admitido: usa JPG, PNG, WebP, HEIC o AVIF.' };
  const { data, info } = await sharp(buf, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  return { ok: true, data, width: info.width, height: info.height };
}
