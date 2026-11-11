// Removes screen bars and borders (screenshots, photos with margins) before
// the image model sees the photo, so they never end up in the result.
// Only what lies OUTSIDE the photograph is removed: its content is never cut.

import type { HeadBox } from './ai.ts';

export type Rect = { x: number; y: number; w: number; h: number };

/** Above this share of the image, the photo has no real margins: leave it alone. */
const MAX_KEEP = 0.9;
/** Ignore tiny or nonsense boxes. */
const MIN_SHARE = 0.15;

/** The photograph inside the image, in pixels, or null when there is nothing to remove. */
export function cropRect(width: number, height: number, photo: HeadBox): Rect | null {
  const [fx, fy, fw, fh] = photo;
  const x = Math.max(0, Math.round(fx * width));
  const y = Math.max(0, Math.round(fy * height));
  const w = Math.min(width - x, Math.round(fw * width));
  const h = Math.min(height - y, Math.round(fh * height));
  const share = (w * h) / (width * height);
  if (share > MAX_KEEP || share < MIN_SHARE) return null;
  return { x, y, w, h };
}

/** Downloads the photo and returns the cropped JPEG as a data URI, or null if no crop is needed. */
export async function cropToPhoto(imageUrl: string, photo: HeadBox, fetchFn: typeof fetch = fetch): Promise<string | null> {
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
  const rect = cropRect(image.width, image.height, photo);
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
