// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { cropRect, cropToPhoto } from './crop.ts';

Deno.test('crop: a screenshot keeps exactly the photograph, nothing else is cut', () => {
  assert.deepEqual(cropRect(708, 1536, [0.06, 0.17, 0.88, 0.54]), { x: 42, y: 261, w: 623, h: 829 });
});

Deno.test('crop: a normal photo (no margins) is left alone', () => {
  assert.equal(cropRect(1200, 1536, [0, 0, 1, 1]), null);
  assert.equal(cropRect(1200, 1536, [0.02, 0.02, 0.96, 0.96]), null);
});

Deno.test('crop: a tiny or nonsense box is ignored', () => {
  assert.equal(cropRect(1200, 1536, [0.4, 0.4, 0.1, 0.1]), null);
});

Deno.test('crop: cuts a real JPEG and returns a smaller data URI', async () => {
  const jpeg = (await import('npm:jpeg-js@0.4.4')).default;
  const width = 600;
  const height = 1300;
  const encoded = jpeg.encode({ data: new Uint8Array(width * height * 4).fill(200), width, height }, 80).data;
  const fakeFetch = (() => Promise.resolve(new Response(new Uint8Array(encoded)))) as typeof fetch;
  const uri = await cropToPhoto('https://x/photo.jpg', [0.05, 0.2, 0.9, 0.5], fakeFetch);
  assert.ok(uri?.startsWith('data:image/jpeg;base64,'));
  const out = jpeg.decode(Uint8Array.from(atob(uri!.split(',')[1]), (c) => c.charCodeAt(0)));
  assert.equal(out.height, 650);
});
