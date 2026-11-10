// Generation pipeline. Pure logic over small interfaces, so it can be tested
// without Supabase, Claude or fal.
import type { ImageEditor, PhraseWriter } from './ai.ts';
import type { Language } from './prompts.ts';

export type PersonalityPrompts = { language: Language; voice: string; style: string };

export interface Store {
  personality(id: string): Promise<PersonalityPrompts>;
  signedUrl(bucket: 'originals' | 'generated', path: string): Promise<string>;
  upload(bucket: 'generated', path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  finish(generationId: string, imagePath: string, phrase: string): Promise<boolean>;
  fail(generationId: string, reason: string): Promise<boolean>;
}

export type Generation = {
  id: string;
  userId: string;
  personalityId: string;
  originalPath: string;
};

export type Outcome = 'succeeded' | 'not_a_pet' | 'failed';

/**
 * Runs after the credit was spent. Any failure refunds it (store.fail).
 * The cheap phrase call runs first and doubles as the "is there a pet?" check,
 * so a photo without a pet never reaches the expensive image model.
 */
export async function runGeneration(
  deps: { store: Store; phrases: PhraseWriter; images: ImageEditor; log?: (msg: string) => void },
  gen: Generation,
): Promise<Outcome> {
  const { store, phrases, images, log = console.log } = deps;
  try {
    const prompts = await store.personality(gen.personalityId);
    const originalUrl = await store.signedUrl('originals', gen.originalPath);

    const phrase = await phrases.write({
      imageUrl: originalUrl,
      language: prompts.language,
      voice: prompts.voice,
      scene: prompts.style,
      exclude: [],
    });
    if (!phrase.isPet) {
      await store.fail(gen.id, 'not_a_pet');
      return 'not_a_pet';
    }

    const image = await images.edit({ imageUrl: originalUrl, style: prompts.style });
    const ext = image.contentType.includes('png') ? 'png' : image.contentType.includes('webp') ? 'webp' : 'jpg';
    const imagePath = `${gen.userId}/${gen.id}.${ext}`;
    await store.upload('generated', imagePath, image.bytes, image.contentType);

    const finished = await store.finish(gen.id, imagePath, phrase.phrase);
    if (!finished) throw new Error('finish_rejected');
    return 'succeeded';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`generation ${gen.id} failed: ${message.replace(/(Key|Bearer)\s+\S+/gi, '$1 [redacted]')}`);
    await store.fail(gen.id, safeReason(message)).catch((e) => log(`refund failed for ${gen.id}: ${e}`));
    return 'failed';
  }
}

/**
 * The failure reason is readable by the user, so it must never contain raw
 * provider messages (they can echo request headers, i.e. API keys).
 * Keep only our own short snake_case codes, e.g. "image_failed_401".
 */
export function safeReason(message: string): string {
  const code = /^[a-z][a-z0-9_]{2,40}/.exec(message)?.[0];
  return code ?? 'internal_error';
}

/** Maps errors raised by the SQL functions to HTTP responses for the app. */
export function httpErrorFor(message: string): { status: number; code: string } {
  for (const code of ['insufficient_credits', 'rate_limited', 'daily_limit', 'invalid_path', 'unknown_personality', 'no_free_phrase']) {
    if (message.includes(code)) {
      const status =
        code === 'insufficient_credits' ? 402 : code === 'rate_limited' || code === 'daily_limit' ? 429 : code === 'no_free_phrase' ? 409 : 400;
      return { status, code };
    }
  }
  return { status: 500, code: 'server_error' };
}
