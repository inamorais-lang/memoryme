// Run: deno test supabase/functions/_shared
import assert from 'node:assert/strict';

import { falInput, parsePhrase, type ImageEditor, type PhraseWriter } from './ai.ts';
import { httpErrorFor, runGeneration, safeReason, type Store } from './pipeline.ts';
import { imageEditPrompt, phraseSystemPrompt, phraseUserPrompt } from './prompts.ts';

function fakeStore() {
  const calls: string[] = [];
  const store: Store = {
    personality: async () => ({ language: 'pt-PT', voice: 'Tia de Cascais', style: 'pearls and a yacht' }),
    signedUrl: async (bucket, path) => `https://signed/${bucket}/${path}`,
    upload: async (bucket, path) => void calls.push(`upload ${bucket}/${path}`),
    finish: async (id, imagePath, phrase) => (calls.push(`finish ${id} ${imagePath} ${phrase}`), true),
    fail: async (id, reason) => (calls.push(`fail ${id} ${reason}`), true),
  };
  return { store, calls };
}

const gen = { id: 'g1', userId: 'u1', personalityId: 'pt-tia-cascais', originalPath: 'u1/photo.jpg' };
const quiet = () => {};
const phrases = (result: { isPet: boolean; phrase: string }): PhraseWriter => ({ write: async () => result });
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
      phrases: { write: async () => Promise.reject(new Error('phrase_refused')) },
      images: okImage,
      log: quiet,
    },
    gen,
  );
  assert.equal(outcome, 'failed');
  assert.deepEqual(calls, ['fail g1 phrase_refused']);
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

Deno.test('parsePhrase trims quotes and rejects an empty phrase for a pet', () => {
  assert.deepEqual(parsePhrase('{"is_pet":true,"phrase":"  \\"Olá, humano.\\" "}'), { isPet: true, phrase: 'Olá, humano.' });
  assert.deepEqual(parsePhrase('{"is_pet":false,"phrase":""}'), { isPet: false, phrase: '' });
  assert.throws(() => parsePhrase('{"is_pet":true,"phrase":""}'));
  assert.throws(() => parsePhrase('not json'));
});

Deno.test('falInput uses each model\'s field names', () => {
  assert.deepEqual(falInput('fal-ai/flux-pro/kontext', 'p', 'u').image_url, 'u');
  assert.deepEqual(falInput('google/nano-banana-2.1/edit', 'p', 'u').image_urls, ['u']);
  assert.deepEqual(falInput('openai/gpt-image-2/edit', 'p', 'u').image_urls, ['u']);
});

Deno.test('prompts carry the safety and language rules', () => {
  assert.match(phraseSystemPrompt('pt-PT'), /never Brazilian Portuguese/);
  assert.match(phraseSystemPrompt('en'), /American English/);
  assert.match(phraseSystemPrompt('en'), /at most 70 characters/);
  assert.match(phraseSystemPrompt('pt-PT'), /never copy/);
  assert.match(phraseSystemPrompt('pt-PT'), /2026/);
  assert.match(phraseSystemPrompt('en'), /Never name or imitate real people/);
  assert.match(phraseSystemPrompt('en'), /No politics/);
  assert.match(phraseUserPrompt({ voice: 'v', scene: 's', exclude: ['a', 'b'] }), /- a\n- b/);
  assert.match(phraseUserPrompt({ voice: 'v', scene: 's', exclude: [] }), /Never mention the original background/);
  assert.match(imageEditPrompt('pearls'), /same animal/);
  assert.match(imageEditPrompt('pearls'), /never make it resemble a real person/);
  assert.match(imageEditPrompt('pearls'), /Do not add any text/);
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
  assert.deepEqual(httpErrorFor('no_free_phrase'), { status: 409, code: 'no_free_phrase' });
  assert.deepEqual(httpErrorFor('something else'), { status: 500, code: 'server_error' });
});
