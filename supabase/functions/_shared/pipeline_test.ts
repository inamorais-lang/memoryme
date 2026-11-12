// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { falInput, parseHead, parsePhrase, type ImageEditor, type PhraseWriter } from './ai.ts';
import { httpErrorFor, runGeneration, safeReason, type Store } from './pipeline.ts';
import { imageEditPrompt, phraseSystemPrompt, phraseUserPrompt } from './prompts.ts';

function fakeStore() {
  const calls: string[] = [];
  const store: Store = {
    personality: async () => ({ language: 'pt-PT', voice: 'Tia de Cascais', style: 'pearls and a yacht' }),
    scene: async (id) =>
      id.endsWith('sorriso')
        ? { kind: 'comic', language: 'pt-PT', style: 'teeth on a pastel background', exaggerated: true, addon: 'Funny extra: joke-shop fake teeth.' }
        : { kind: 'place', language: 'pt-PT', style: 'a sunny beach', exaggerated: false, voice: 'Beach snob' },
    signedUrl: async (bucket, path) => `https://signed/${bucket}/${path}`,
    upload: async (bucket, path) => void calls.push(`upload ${bucket}/${path}`),
    finish: async (id, imagePath, phrase) => (calls.push(`finish ${id} ${imagePath} ${phrase}`), true),
    fail: async (id, reason) => (calls.push(`fail ${id} ${reason}`), true),
    removeOriginal: async (path) => void calls.push(`remove ${path}`),
  };
  return { store, calls };
}

const gen = { id: 'g1', userId: 'u1', personalityId: 'pt-tia-cascais', originalPath: 'u1/photo.jpg' };
const quiet = () => {};
const phrases = (result: { isPet: boolean; phrase: string }, sceneOk = true): PhraseWriter => ({
  isPet: async () => ({ isPet: result.isPet }),
  describeScene: async (scene: string) => (sceneOk ? `A pet ${scene}.` : null),
  write: async () => result,
});
const images = (edit: ImageEditor['edit']): ImageEditor => ({ edit });
const okImage = images(async () => ({ bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg' }));

Deno.test('success: uploads the image and finishes with the phrase', async () => {
  const { store, calls } = fakeStore();
  const outcome = await runGeneration(
    { store, phrases: phrases({ isPet: true, phrase: 'Querida, isto é básico.' }), images: okImage, log: quiet },
    gen,
  );
  assert.equal(outcome, 'succeeded');
  assert.deepEqual(calls, ['upload generated/u1/g1.jpg', 'finish g1 u1/g1.jpg Querida, isto é básico.', 'remove u1/photo.jpg']);
});

Deno.test('no pet: refunds and never calls the expensive image model', async () => {
  const { store, calls } = fakeStore();
  let imageCalled = false;
  const outcome = await runGeneration(
    {
      store,
      phrases: phrases({ isPet: false, phrase: '' }),
      images: images(async () => ((imageCalled = true), { bytes: new Uint8Array(), contentType: 'image/jpeg' })),
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'not_a_pet');
  assert.equal(imageCalled, false);
  assert.deepEqual(calls, ['fail g1 not_a_pet', 'remove u1/photo.jpg']);
});

Deno.test('image model error: refunds the credit', async () => {
  const { store, calls } = fakeStore();
  const outcome = await runGeneration(
    {
      store,
      phrases: phrases({ isPet: true, phrase: 'Olá' }),
      images: images(async () => {
        throw new Error('image_failed_500');
      }),
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['fail g1 image_failed_500', 'remove u1/photo.jpg']);
});

Deno.test('phrase model error: refunds the credit', async () => {
  const { store, calls } = fakeStore();
  const outcome = await runGeneration(
    {
      store,
      phrases: { isPet: async () => ({ isPet: true }), describeScene: async (scene: string) => scene, write: async () => Promise.reject(new Error('phrase_refused')) },
      images: okImage,
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['upload generated/u1/g1.jpg', 'fail g1 phrase_refused', 'remove u1/photo.jpg']);
});

Deno.test('upload error: refunds the credit', async () => {
  const { store, calls } = fakeStore();
  store.upload = async () => {
    throw new Error('upload_boom');
  };
  const outcome = await runGeneration({ store, phrases: phrases({ isPet: true, phrase: 'x' }), images: okImage, log: quiet }, gen);
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['fail g1 upload_boom', 'remove u1/photo.jpg']);
});

Deno.test('parsePhrase picks the funniest option that fits 45 characters', () => {
  assert.deepEqual(parsePhrase('{"is_pet":true,"phrases":["  \\"Olá, humano.\\" "]}'), { isPet: true, phrase: 'Olá, humano.' });
  const long = 'x'.repeat(46);
  assert.equal(parsePhrase(JSON.stringify({ is_pet: true, phrases: [long, 'Curta e boa.', 'Outra.'] })).phrase, 'Curta e boa.');
  assert.deepEqual(parsePhrase('{"is_pet":false,"phrases":[]}'), { isPet: false, phrase: '' });
  assert.throws(() => parsePhrase(JSON.stringify({ is_pet: true, phrases: [long] })), /phrase_too_long/);
  assert.throws(() => parsePhrase('{"is_pet":true,"phrases":[]}'), /phrase_empty/);
  assert.throws(() => parsePhrase('not json'));
  assert.equal(parsePhrase('{"is_pet":true,"phrases":["Come, carago.</br>"]}').phrase, 'Come, carago.');
});

Deno.test('the line is written from the final picture, not the original photo', async () => {
  const { store } = fakeStore();
  let seen = '';
  await runGeneration(
    {
      store,
      phrases: { isPet: async () => ({ isPet: true }), describeScene: async (scene: string) => scene, write: async (a) => ((seen = a.imageUrl), { isPet: true, phrase: 'x' }) },
      images: okImage,
      log: quiet,
    },
    gen,
  );
  assert.equal(seen, 'https://signed/generated/u1/g1.jpg');
});

Deno.test('custom scene: a refused scene refunds and never reaches the image model', async () => {
  const { store, calls } = fakeStore();
  let imageCalled = false;
  const outcome = await runGeneration(
    {
      store,
      phrases: phrases({ isPet: true, phrase: 'x' }, false),
      images: images(async () => ((imageCalled = true), { bytes: new Uint8Array(), contentType: 'image/jpeg' })),
      log: quiet,
    },
    { ...gen, customScene: 'algo proibido' },
  );
  assert.equal(outcome, 'scene_rejected');
  assert.equal(imageCalled, false);
  assert.deepEqual(calls, ['fail g1 scene_rejected', 'remove u1/photo.jpg']);
});

Deno.test('custom scene replaces the mood scene in the image prompt', async () => {
  const { store } = fakeStore();
  let style = '';
  await runGeneration(
    {
      store,
      phrases: phrases({ isPet: true, phrase: 'x' }),
      images: images(async (a) => ((style = a.style), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      log: quiet,
    },
    { ...gen, customScene: 'a surfar uma onda gigante' },
  );
  assert.match(style, /a surfar uma onda gigante/);
  assert.doesNotMatch(style, /pearls and a yacht/);
});

function captureRun(genOver: Partial<typeof gen> & Record<string, unknown>) {
  const { store } = fakeStore();
  const got = { style: '', exaggerated: false as boolean | undefined, voice: '', language: '' };
  return runGeneration(
    {
      store,
      phrases: {
        isPet: async () => ({ isPet: true }),
        describeScene: async (scene: string) => `A pet ${scene}.`,
        write: async (a) => ((got.voice = a.voice), (got.language = a.language), { isPet: true, phrase: 'x' }),
      },
      images: images(async (a) => ((got.style = a.style), (got.exaggerated = a.exaggerated), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      log: quiet,
    },
    { ...gen, ...genOver },
  ).then(() => got);
}

Deno.test('place scene instead of a mode: its own picture and phrase tone', async () => {
  const got = await captureRun({ personalityId: undefined, sceneId: 'pt-praia' });
  assert.equal(got.style, 'a sunny beach');
  assert.equal(got.voice, 'Beach snob');
  assert.equal(got.exaggerated, false);
});

Deno.test('funny extra: added on top of a mode, with an exaggerated expression', async () => {
  const got = await captureRun({ comicId: 'pt-sorriso' });
  assert.equal(got.style, 'pearls and a yacht Funny extra: joke-shop fake teeth.');
  assert.equal(got.voice, 'Tia de Cascais');
  assert.equal(got.exaggerated, true);
});

Deno.test('funny extra on a place scene and on a custom scene', async () => {
  assert.equal((await captureRun({ personalityId: undefined, sceneId: 'pt-praia', comicId: 'pt-sorriso' })).style, 'a sunny beach Funny extra: joke-shop fake teeth.');
  const custom = await captureRun({ personalityId: undefined, customScene: 'no espaço', comicId: 'pt-sorriso', language: 'fr' });
  assert.match(custom.style, /^A pet no espaço\..*Funny extra: joke-shop fake teeth\.$/);
  assert.equal(custom.language, 'fr');
  assert.match(custom.voice, /animal logic/);
});

Deno.test('older apps: a funny one sent as the scene still works as the extra', async () => {
  const got = await captureRun({ sceneId: 'pt-sorriso' });
  assert.equal(got.style, 'pearls and a yacht Funny extra: joke-shop fake teeth.');
  assert.equal(got.exaggerated, true);
});

Deno.test('no mode, scene or custom scene: refunds', async () => {
  const { store, calls } = fakeStore();
  const outcome = await runGeneration({ store, phrases: phrases({ isPet: true, phrase: 'x' }), images: okImage, log: quiet }, { ...gen, personalityId: undefined });
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['fail g1 unknown_personality', 'remove u1/photo.jpg']);
});

Deno.test('head box: clamped into the image, dropped when invalid', () => {
  assert.deepEqual(parseHead({ x: 0.3, y: 0.4, w: 0.35, h: 0.3 }), [0.3, 0.4, 0.35, 0.3]);
  assert.deepEqual(parseHead({ x: 0.8, y: -0.1, w: 0.5, h: 0.4 }), [0.8, 0, 0.2, 0.4]);
  assert.equal(parseHead({ x: 0.5, y: 0.5, w: 0, h: 0.2 }), undefined);
  assert.equal(parseHead(null), undefined);
  assert.deepEqual(
    parsePhrase(JSON.stringify({ is_pet: true, phrases: ['Olá'], head: { x: 0.2, y: 0.3, w: 0.4, h: 0.3 } })).head,
    [0.2, 0.3, 0.4, 0.3],
  );
  const withProp = parsePhrase(
    JSON.stringify({ is_pet: true, phrases: ['Olá'], prop: { present: true, x: 0.5, y: 0.7, w: 0.3, h: 0.1 } }),
  );
  assert.deepEqual(withProp.prop, [0.5, 0.7, 0.3, 0.1]);
  const noProp = parsePhrase(JSON.stringify({ is_pet: true, phrases: ['Olá'], prop: { present: false, x: 0, y: 0, w: 0, h: 0 } }));
  assert.equal(noProp.prop, undefined);
});

Deno.test('crop: the image model gets the photo without screen bars', async () => {
  const { store } = fakeStore();
  let sent = '';
  await runGeneration(
    {
      store,
      phrases: { ...phrases({ isPet: true, phrase: 'x' }), isPet: async () => ({ isPet: true, photo: [0.05, 0.17, 0.9, 0.55] }) },
      images: images(async (a) => ((sent = a.imageUrl), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      crop: async () => 'data:image/jpeg;base64,AAAA',
      log: quiet,
    },
    gen,
  );
  assert.equal(sent, 'data:image/jpeg;base64,AAAA');
});

Deno.test('crop: a failing crop falls back to the original photo', async () => {
  const { store } = fakeStore();
  let sent = '';
  const outcome = await runGeneration(
    {
      store,
      phrases: { ...phrases({ isPet: true, phrase: 'x' }), isPet: async () => ({ isPet: true, photo: [0.05, 0.17, 0.9, 0.55] }) },
      images: images(async (a) => ((sent = a.imageUrl), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      crop: () => Promise.reject(new Error('boom')),
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'succeeded');
  assert.equal(sent, 'https://signed/originals/u1/photo.jpg');
});

Deno.test('phrase prompt: Spanish, French and the two Englishes', () => {
  assert.match(phraseSystemPrompt('es'), /Spain/);
  assert.match(phraseSystemPrompt('fr'), /France/);
  assert.match(phraseSystemPrompt('en', 'US'), /American spelling/);
  assert.match(phraseSystemPrompt('en', 'GB'), /British spelling/);
  assert.doesNotMatch(phraseSystemPrompt('pt-PT', 'US'), /spelling/);
});

Deno.test('the pet description from the original photo reaches the image model', async () => {
  const { store } = fakeStore();
  let got: { appearance?: string } = {};
  await runGeneration(
    {
      store,
      phrases: { ...phrases({ isPet: true, phrase: 'x' }), isPet: async () => ({ isPet: true, appearance: 'Black cat, white stripe on the nose.' }) },
      images: images(async (a) => ((got = a), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      log: quiet,
    },
    gen,
  );
  assert.equal(got.appearance, 'Black cat, white stripe on the nose.');
  assert.match(imageEditPrompt('x', false, 'Black cat, white stripe on the nose.'), /This animal: Black cat, white stripe on the nose\. Small dark spots/);
  assert.doesNotMatch(imageEditPrompt('x'), /This animal:/);
});

Deno.test('falInput uses each model\'s field names', () => {
  assert.deepEqual(falInput('fal-ai/flux-pro/kontext', 'p', 'u').image_url, 'u');
  assert.deepEqual(falInput('google/nano-banana-2.1/edit', 'p', 'u').image_urls, ['u']);
  assert.deepEqual(falInput('openai/gpt-image-2/edit', 'p', 'u').image_urls, ['u']);
  // Portrait output, close to the 4:5 the app shares.
  assert.equal(falInput('fal-ai/flux-pro/kontext', 'p', 'u').aspect_ratio, '2:3');
  assert.deepEqual(falInput('openai/gpt-image-2/edit', 'p', 'u', '4:5').image_size, { width: 1024, height: 1280 });
  assert.equal(falInput('fal-ai/flux-pro/kontext', 'p', 'u', '9:16').aspect_ratio, '9:16');
  assert.equal(falInput('fal-ai/flux-pro/kontext', 'p', 'u', '4:5').aspect_ratio, '3:4');
});

Deno.test('prompts carry the pet-logic, safety and language rules', () => {
  assert.match(phraseSystemPrompt('pt-PT'), /never Brazilian Portuguese/);
  assert.match(phraseSystemPrompt('pt-PT'), /no slang or regional expressions/);
  assert.match(phraseSystemPrompt('en'), /AS A PET/);
  assert.match(phraseSystemPrompt('en'), /make sense instantly/);
  assert.match(phraseSystemPrompt('en'), /owners lovingly say/);
  assert.match(phraseSystemPrompt('en'), /throw it away/);
  assert.match(imageEditPrompt('x'), /human hands/);
  assert.match(imageEditPrompt('x'), /lively, funny expression/);
  assert.match(phraseSystemPrompt('en'), /cat or a dog/);
  assert.match(phraseSystemPrompt('en'), /HARD LIMIT: 45/);
  assert.match(phraseSystemPrompt('en'), /politics/);
  assert.match(phraseSystemPrompt('pt-PT'), /NEVER list or describe/);
  assert.match(phraseUserPrompt({ voice: 'v', scene: 's', exclude: ['a', 'b'] }), /- a\n- b/);
  assert.match(phraseUserPrompt({ voice: 'v', scene: 's', exclude: [] }), /REALLY in this picture/);
  assert.match(imageEditPrompt('pearls'), /same animal/);
  assert.match(imageEditPrompt('pearls'), /top third/);
  assert.match(imageEditPrompt('pearls'), /Never dark/);
  assert.match(imageEditPrompt('pearls'), /never make it resemble a real person/);
  assert.match(imageEditPrompt('pearls'), /Never draw speech bubbles/);
});

Deno.test('failure reasons never leak provider messages or keys', () => {
  assert.equal(safeReason('image_failed_401: {"detail":"credential has been revoked"}'), 'image_failed_401');
  assert.equal(safeReason('Invalid header value: "Key fal_sk_secret"'), 'internal_error');
  assert.equal(safeReason('not_a_pet'), 'not_a_pet');
  assert.equal(safeReason('TypeError: fetch failed'), 'internal_error');
});

Deno.test('a crash stores only a safe code', async () => {
  const { store, calls } = fakeStore();
  await runGeneration(
    {
      store,
      phrases: phrases({ isPet: true, phrase: 'x' }),
      images: images(async () => {
        throw new TypeError('Invalid header value: "Key fal_sk_123"');
      }),
      log: quiet,
    },
    gen,
  );
  assert.deepEqual(calls, ['fail g1 internal_error', 'remove u1/photo.jpg']);
});

Deno.test('SQL errors map to app-friendly HTTP codes', () => {
  assert.deepEqual(httpErrorFor('ERROR: insufficient_credits'), { status: 402, code: 'insufficient_credits' });
  assert.deepEqual(httpErrorFor('rate_limited'), { status: 429, code: 'rate_limited' });
  assert.deepEqual(httpErrorFor('daily_limit'), { status: 429, code: 'daily_limit' });
  assert.deepEqual(httpErrorFor('invalid_path'), { status: 400, code: 'invalid_path' });
  assert.deepEqual(httpErrorFor('invalid_scene'), { status: 400, code: 'invalid_scene' });
  assert.deepEqual(httpErrorFor('no_free_phrase'), { status: 409, code: 'no_free_phrase' });
  assert.deepEqual(httpErrorFor('something else'), { status: 500, code: 'server_error' });
});

function modelRun(
  genOver: Record<string, unknown>,
  check: { smallMarkings?: boolean } = {},
  faithfulFails = false,
  sceneFaithful = false,
) {
  const { store } = fakeStore();
  const base = store.scene;
  store.scene = async (id) => ({ ...(await base(id)), faithful: sceneFaithful && id.endsWith('sorriso') });
  const used: string[] = [];
  const editor = (name: string, fail = false): ImageEditor => ({
    edit: async () => {
      used.push(name);
      if (fail) throw new Error('image_failed_504');
      return { bytes: new Uint8Array([1]), contentType: 'image/jpeg' };
    },
  });
  return runGeneration(
    {
      store,
      phrases: {
        isPet: async () => ({ isPet: true, ...check }),
        describeScene: async (scene: string) => `A pet ${scene}.`,
        write: async () => ({ isPet: true, phrase: 'x' }),
      },
      images: editor('fast'),
      faithfulImages: editor('faithful', faithfulFails),
      log: quiet,
    },
    { ...gen, ...genOver },
  ).then((outcome) => ({ outcome, used }));
}

Deno.test('image model: the fast one by default', async () => {
  assert.deepEqual((await modelRun({})).used, ['fast']);
});

Deno.test('image model: the faithful one for small markings, custom scenes and pose changes', async () => {
  assert.deepEqual((await modelRun({}, { smallMarkings: true })).used, ['faithful']);
  assert.deepEqual((await modelRun({ personalityId: undefined, customScene: 'no espaço' })).used, ['faithful']);
  assert.deepEqual((await modelRun({ comicId: 'pt-sorriso' }, {}, false, true)).used, ['faithful']);
});

Deno.test('image model: if the faithful one fails, the fast one still makes the picture', async () => {
  const { outcome, used } = await modelRun({}, { smallMarkings: true }, true);
  assert.equal(outcome, 'succeeded');
  assert.deepEqual(used, ['faithful', 'fast']);
});
