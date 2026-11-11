// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { falInput, parsePhrase, type ImageEditor, type PhraseWriter } from './ai.ts';
import { httpErrorFor, runGeneration, safeReason, type Store } from './pipeline.ts';
import { imageEditPrompt, phraseSystemPrompt, phraseUserPrompt } from './prompts.ts';

function fakeStore() {
  const calls: string[] = [];
  const store: Store = {
    personality: async () => ({ language: 'pt-PT', voice: 'Tia de Cascais', style: 'pearls and a yacht' }),
    scene: async () => ({ style: 'joke-shop fake teeth', exaggerated: true }),
    signedUrl: async (bucket, path) => `https://signed/${bucket}/${path}`,
    upload: async (bucket, path) => void calls.push(`upload ${bucket}/${path}`),
    finish: async (id, imagePath, phrase) => (calls.push(`finish ${id} ${imagePath} ${phrase}`), true),
    fail: async (id, reason) => (calls.push(`fail ${id} ${reason}`), true),
  };
  return { store, calls };
}

const gen = { id: 'g1', userId: 'u1', personalityId: 'pt-tia-cascais', originalPath: 'u1/photo.jpg' };
const quiet = () => {};
const phrases = (result: { isPet: boolean; phrase: string }, sceneOk = true): PhraseWriter => ({
  isPet: async () => result.isPet,
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
  assert.deepEqual(calls, ['upload generated/u1/g1.jpg', 'finish g1 u1/g1.jpg Querida, isto é básico.']);
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
  assert.deepEqual(calls, ['fail g1 not_a_pet']);
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
  assert.deepEqual(calls, ['fail g1 image_failed_500']);
});

Deno.test('phrase model error: refunds the credit', async () => {
  const { store, calls } = fakeStore();
  const outcome = await runGeneration(
    {
      store,
      phrases: { isPet: async () => true, describeScene: async (scene: string) => scene, write: async () => Promise.reject(new Error('phrase_refused')) },
      images: okImage,
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['upload generated/u1/g1.jpg', 'fail g1 phrase_refused']);
});

Deno.test('upload error: refunds the credit', async () => {
  const { store, calls } = fakeStore();
  store.upload = async () => {
    throw new Error('upload_boom');
  };
  const outcome = await runGeneration({ store, phrases: phrases({ isPet: true, phrase: 'x' }), images: okImage, log: quiet }, gen);
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['fail g1 upload_boom']);
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
      phrases: { isPet: async () => true, describeScene: async (scene: string) => scene, write: async (a) => ((seen = a.imageUrl), { isPet: true, phrase: 'x' }) },
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
  assert.deepEqual(calls, ['fail g1 scene_rejected']);
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

Deno.test('preset scene replaces the mood scene and asks for an exaggerated expression', async () => {
  const { store } = fakeStore();
  let got: { style: string; exaggerated?: boolean } = { style: '' };
  await runGeneration(
    {
      store,
      phrases: phrases({ isPet: true, phrase: 'x' }),
      images: images(async (a) => ((got = a), { bytes: new Uint8Array([1]), contentType: 'image/jpeg' })),
      log: quiet,
    },
    { ...gen, sceneId: 'pt-sorriso' },
  );
  assert.equal(got.style, 'joke-shop fake teeth');
  assert.equal(got.exaggerated, true);
});

Deno.test('falInput uses each model\'s field names', () => {
  assert.deepEqual(falInput('fal-ai/flux-pro/kontext', 'p', 'u').image_url, 'u');
  assert.deepEqual(falInput('google/nano-banana-2.1/edit', 'p', 'u').image_urls, ['u']);
  assert.deepEqual(falInput('openai/gpt-image-2/edit', 'p', 'u').image_urls, ['u']);
});

Deno.test('prompts carry the pet-logic, safety and language rules', () => {
  assert.match(phraseSystemPrompt('pt-PT'), /never Brazilian Portuguese/);
  assert.match(phraseSystemPrompt('pt-PT'), /no slang or regional expressions/);
  assert.match(phraseSystemPrompt('en'), /AS A PET/);
  assert.match(phraseSystemPrompt('en'), /make sense instantly/);
  assert.match(phraseSystemPrompt('en'), /owners lovingly say/);
  assert.match(phraseSystemPrompt('en'), /throw it away/);
  assert.match(imageEditPrompt('x'), /human hands/);
  assert.match(imageEditPrompt('x'), /subtle, natural expression/);
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
  assert.deepEqual(calls, ['fail g1 internal_error']);
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
