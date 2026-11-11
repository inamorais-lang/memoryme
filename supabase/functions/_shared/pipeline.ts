// Generation pipeline. Pure logic over small interfaces, so it can be tested
// without Supabase, Claude or fal.
import type { HeadBox, ImageEditor, PhraseWriter } from './ai.ts';
import { customSceneStyle, OVER_THE_TOP, type Language } from './prompts.ts';

export type PersonalityPrompts = { language: Language; voice: string; style: string };

export type ScenePrompt = { style: string; exaggerated: boolean };

export interface Store {
  personality(id: string): Promise<PersonalityPrompts>;
  scene(id: string): Promise<ScenePrompt>;
  signedUrl(bucket: 'originals' | 'generated', path: string): Promise<string>;
  upload(bucket: 'generated', path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  finish(generationId: string, imagePath: string, phrase: string, head?: HeadBox, prop?: HeadBox): Promise<boolean>;
  fail(generationId: string, reason: string): Promise<boolean>;
}

export type Generation = {
  id: string;
  userId: string;
  personalityId: string;
  originalPath: string;
  /** Preset scene (e.g. fake teeth, glasses); replaces the mood's scene. */
  sceneId?: string;
  /** Scene typed by the user ("Cenário à medida"); replaces the mood's scene. */
  customScene?: string;
  /** "Modo exagerado" (+1 credit, already decided by the database). */
  exaggerated?: boolean;
};

export type Outcome = 'succeeded' | 'not_a_pet' | 'scene_rejected' | 'failed';

/**
 * Runs after the credit was spent. Any failure refunds it (store.fail).
 * A cheap check for a pet runs first, so a photo without one never reaches the
 * expensive image model. The line is written last, from the final picture.
 */
export async function runGeneration(
  deps: {
    store: Store;
    phrases: PhraseWriter;
    images: ImageEditor;
    log?: (msg: string) => void;
    /** Cuts screen bars and borders around the photograph; returns a data URI, or null when not needed. */
    crop?: (imageUrl: string, photo: HeadBox) => Promise<string | null>;
  },
  gen: Generation,
): Promise<Outcome> {
  const { store, phrases, images, crop, log = console.log } = deps;
  try {
    const prompts = await store.personality(gen.personalityId);
    const originalUrl = await store.signedUrl('originals', gen.originalPath);

    const check = await phrases.isPet(originalUrl);
    if (!check.isPet) {
      await store.fail(gen.id, 'not_a_pet');
      return 'not_a_pet';
    }

    // Screenshots and photos with borders: keep only the photograph (its content is never cut).
    let sourceUrl = originalUrl;
    if (crop && check.photo) {
      try {
        sourceUrl = (await crop(originalUrl, check.photo)) ?? originalUrl;
      } catch (error) {
        log(`crop skipped for ${gen.id}: ${error instanceof Error ? error.message : error}`);
      }
    }

    let custom: string | null = null;
    if (gen.customScene) {
      custom = await phrases.describeScene(gen.customScene);
      if (!custom) {
        await store.fail(gen.id, 'scene_rejected');
        return 'scene_rejected';
      }
    }
    const preset = gen.sceneId ? await store.scene(gen.sceneId) : null;
    const baseStyle = custom ? customSceneStyle(custom) : (preset?.style ?? prompts.style);
    // Comedy scenes are exaggerated already (and the database charged nothing extra for them).
    const overTheTop = gen.exaggerated === true && !preset?.exaggerated;
    // First in the prompt: the image model follows the start of the instructions most closely.
    const style = overTheTop ? `${OVER_THE_TOP} ${baseStyle}` : baseStyle;

    const image = await images.edit({
      imageUrl: sourceUrl,
      style,
      exaggerated: (preset?.exaggerated ?? false) || overTheTop,
    });
    const ext = image.contentType.includes('png') ? 'png' : image.contentType.includes('webp') ? 'webp' : 'jpg';
    const imagePath = `${gen.userId}/${gen.id}.${ext}`;
    await store.upload('generated', imagePath, image.bytes, image.contentType);

    // The line is written last, looking at the final picture, so it matches what is really there.
    const phrase = await phrases.write({
      imageUrl: await store.signedUrl('generated', imagePath),
      language: prompts.language,
      voice: prompts.voice,
      scene: style,
      exclude: [],
    });
    if (!phrase.phrase) throw new Error('phrase_empty');

    const finished = await store.finish(gen.id, imagePath, phrase.phrase, phrase.head, phrase.prop);
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
  for (const code of ['insufficient_credits', 'rate_limited', 'daily_limit', 'invalid_path', 'invalid_scene', 'unknown_scene', 'unknown_personality', 'no_free_phrase']) {
    if (message.includes(code)) {
      const status =
        code === 'insufficient_credits' ? 402 : code === 'rate_limited' || code === 'daily_limit' ? 429 : code === 'no_free_phrase' ? 409 : 400;
      return { status, code };
    }
  }
  return { status: 500, code: 'server_error' };
}
