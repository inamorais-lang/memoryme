// Cuts margins and screen bars (screenshots, photos with borders) around the
// pet before the image model sees the photo, so they never end up in the result.
import type { HeadBox } from './ai.ts';

export type Rect = { x: number; y: number; w: number; h: number };

/** Below this share of the photo kept, cropping is worth it. */
const MAX_KEEP = 0.85;
/** Room around the pet, as a share of its larger side. */
const PAD = 0.3;
/** Never hand the image model less than this (px) on either side. */
const MIN_SIDE = 512;
/** Keep a sensible photo shape (width / height). */
const MIN_RATIO = 0.56;
const MAX_RATIO = 1.8;

/**
 * The area to keep, in pixels, around the pet box (fractions 0..1),
 * or null when the photo is already tight enough.
 */
export function cropRect(width: number, height: number, pet: HeadBox): Rect | null {
  const [fx, fy, fw, fh] = pet;
  const pad = PAD * Math.max(fw * width, fh * height);
  let x0 = fx * width - pad;
  let y0 = fy * height - pad;
  let x1 = (fx + fw) * width + pad;
  let y1 = (fy + fh) * height + pad;

  // Minimum size, then a sensible shape: grow around the centre.
  const grow = (a0: number, a1: number, size: number, max: number): [number, number] => {
    const need = Math.min(size, max) - (a1 - a0);
    if (need <= 0) return [a0, a1];
    return [a0 - need / 2, a1 + need / 2];
  };
  [x0, x1] = grow(x0, x1, MIN_SIDE, width);
  [y0, y1] = grow(y0, y1, MIN_SIDE, height);
  const ratio = (x1 - x0) / (y1 - y0);
  if (ratio < MIN_RATIO) [x0, x1] = grow(x0, x1, (y1 - y0) * MIN_RATIO, width);
  if (ratio > MAX_RATIO) [y0, y1] = grow(y0, y1, (x1 - x0) / MAX_RATIO, height);

  // Slide back inside the photo, then clip.
  const fit = (a0: number, a1: number, max: number): [number, number] => {
    if (a0 < 0) [a0, a1] = [0, a1 - a0];
    if (a1 > max) [a0, a1] = [a0 - (a1 - max), max];
    return [Math.max(0, a0), Math.min(max, a1)];
  };
  [x0, x1] = fit(x0, x1, width);
  [y0, y1] = fit(y0, y1, height);

  const rect = { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
  if ((rect.w * rect.h) / (width * height) > MAX_KEEP) return null;
  return rect;
}

/** Downloads the photo and returns the cropped JPEG as a data URI, or null if no crop is needed. */
export async function cropAroundPet(imageUrl: string, pet: HeadBox, fetchFn: typeof fetch = fetch): Promise<string | null> {
  const response = await fetchFn(imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`crop_download_${response.status}`);
  // Plain JavaScript (no WebAssembly files), loaded only when needed.
  // The app always uploads JPEG; anything else throws and the pipeline uses the original.
  const { default: jpeg } = await import('npm:jpeg-js@0.4.4');
  const image = jpeg.decode(new Uint8Array(await response.arrayBuffer()), {
    useTArray: true,
    formatAsRGBA: true,
    maxMemoryUsageInMB: 256,
  });
  const rect = cropRect(image.width, image.height, pet);
  if (!rect) return null;
  const pixels = new Uint8Array(rect.w * rect.h * 4);
  for (let row = 0; row < rect.h; row++) {
    const start = ((rect.y + row) * image.width + rect.x) * 4;
    pixels.set(image.data.subarray(start, start + rect.w * 4), row * rect.w * 4);
  }
  const jpegBytes = jpeg.encode({ data: pixels, width: rect.w, height: rect.h }, 90).data;
  let binary = '';
  for (let i = 0; i < jpegBytes.length; i += 0x8000) binary += String.fromCharCode(...jpegBytes.subarray(i, i + 0x8000));
  return `data:image/jpeg;base64,${btoa(binary)}`;
}
