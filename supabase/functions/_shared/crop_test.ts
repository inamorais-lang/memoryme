// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { cropRect } from './crop.ts';

Deno.test('crop: a screenshot keeps the pet and drops the screen bars', () => {
  // 708x1536 screenshot; the photo with the dog sits in the middle.
  const rect = cropRect(708, 1536, [0.1, 0.3, 0.8, 0.45])!;
  assert.ok(rect, 'should crop');
  assert.ok(rect.y > 100, 'top bar removed');
  assert.ok(rect.y + rect.h < 1436, 'bottom removed');
  assert.ok(rect.w / rect.h >= 0.56 - 0.01, 'sensible shape');
});

Deno.test('crop: a normal photo where the pet fills the frame is left alone', () => {
  assert.equal(cropRect(1200, 1536, [0.05, 0.1, 0.9, 0.85]), null);
});

Deno.test('crop: never smaller than 512px and always inside the photo', () => {
  const rect = cropRect(1536, 1152, [0.45, 0.45, 0.05, 0.05])!;
  assert.ok(rect.w >= 512 && rect.h >= 512);
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= 1536 && rect.y + rect.h <= 1152);
});

Deno.test('crop: cuts a real JPEG and returns a smaller data URI', async () => {
  const { cropAroundPet } = await import('./crop.ts');
  const jpeg = (await import('npm:jpeg-js@0.4.4')).default;
  const width = 600;
  const height = 1300;
  const encoded = jpeg.encode({ data: new Uint8Array(width * height * 4).fill(200), width, height }, 80).data;
  const fakeFetch = (() => Promise.resolve(new Response(new Uint8Array(encoded)))) as typeof fetch;
  const uri = await cropAroundPet('https://x/photo.jpg', [0.1, 0.3, 0.8, 0.4], fakeFetch);
  assert.ok(uri?.startsWith('data:image/jpeg;base64,'));
  const out = jpeg.decode(Uint8Array.from(atob(uri!.split(',')[1]), (c) => c.charCodeAt(0)));
  assert.ok(out.height < height, `cropped height ${out.height}`);
});
