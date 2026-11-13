// Generation pipeline. Pure logic over small interfaces, so it can be tested
// without Supabase, Claude or fal.
import type { HeadBox, ImageEditor, PhraseWriter } from './ai.ts';
import { CUSTOM_SCENE_VOICE, customSceneStyle, type Language, type PetSex, type Spelling } from './prompts.ts';

export type PersonalityPrompts = {
  language: Language;
  voice: string;
  style: string;
  /** Outfit for a male pet, when the mode has one (e.g. Diva in blue). */
  styleMale?: string;
  /** Outfit, signature prop and attitude only (no place): used with a scene. */
  outfit?: string;
  outfitMale?: string;
};

/** 'place': chosen instead of a mode (own phrase tone). 'comic': optional funny extra. */
export type ScenePrompt = {
  kind: 'place' | 'comic';
  language: Language;
  style: string;
  exaggerated: boolean;
  voice?: string;
  addon?: string;
  /** Needs the faithful image model (e.g. a pose change the fast one ignores). */
  faithful?: boolean;
};

export interface Store {
  personality(id: string): Promise<PersonalityPrompts>;
  scene(id: string): Promise<ScenePrompt>;
  signedUrl(bucket: 'originals' | 'generated', path: string): Promise<string>;
  upload(bucket: 'generated', path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  finish(generationId: string, imagePath: string, phrase: string, head?: HeadBox, prop?: HeadBox, body?: HeadBox): Promise<boolean>;
  fail(generationId: string, reason: string): Promise<boolean>;
  /** Lines people wrote, starred by the owner: style examples for the AI (optional). */
  phraseExamples?(language: Language): Promise<string[]>;
  /** Waiting screen: which step the picture is at. Best effort, never fails the picture. */
  setStage?(generationId: string, stage: 'painting' | 'writing', imagePath?: string): Promise<void>;
  /** Privacy: the original photo is only needed to make the picture. */
  removeOriginal(path: string): Promise<void>;
}

export type Generation = {
  id: string;
  userId: string;
  /** Mode (personality). Absent when a scene or a custom scene was chosen instead. */
  personalityId?: string;
  originalPath: string;
  /** Place scene (Natal, beach…), chosen instead of a mode. */
  sceneId?: string;
  /** Scene typed by the user ("Criar cenário"), chosen instead of a mode. */
  customScene?: string;
  /** Optional funny extra (glasses, big nose…), on top of the choice. */
  comicId?: string;
  /** Language of the line when there is no mode or scene to tell it (custom scene). */
  language?: Language;
  /** English lines: British or American spelling. */
  spelling?: Spelling;
  /** From the owner, for the line only (grammatical gender, the pet's name). */
  petSex?: PetSex;
  petName?: string;
  /** Aniversário: who the pet wishes a happy birthday to (typed by the owner). */
  recipientName?: string;
};

export type Choice = {
  personalityId?: string;
  sceneId?: string;
  comicId?: string;
  /** Picture style of a custom scene, already checked and described. */
  customStyle?: string;
  language?: Language;
  sex?: PetSex;
};

/** Picture style, phrase tone and language for a choice: a custom scene, a place scene or a mode, plus the funny extra. */
/** Scene + mode: the scene's place and pose win; the mode keeps only its outfit, accessories and attitude. */
export function combinedStyle(place: string, outfit: string): string {
  return `${place} The very same real animal (four legs, fur, its own face, never a human or a person in costume) is in this exact place, wearing: ${outfit}. Keep the place, background and pose described first.`;
}

/** The mode is the pet's personality; the scene is where it is right now. */
export function combinedVoice(modeVoice: string, sceneVoice: string | null): string {
  return sceneVoice
    ? `${modeVoice} Right now it is in this situation, and reacts to it in that personality: ${sceneVoice}`
    : `${modeVoice} Right now it is in the situation shown in the picture, and reacts to it in that personality.`;
}

/**
 * Scene prompts may say "{currency} banknotes": euros in Portugal, Spain and France,
 * pounds in the UK (English with British spelling), dollars elsewhere.
 */
/** Pictures up to this size go to the line writer inline (no second download). */
const INLINE_IMAGE_MAX = 3_500_000;

export function toDataUri(bytes: Uint8Array, contentType: string): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${contentType.split(';')[0]};base64,${btoa(binary)}`;
}

export function withCurrency(style: string, language: Language, spelling?: Spelling): string {
  const currency = language !== 'en' ? 'euro' : spelling === 'GB' ? 'British pound sterling' : 'US dollar';
  return style.replaceAll('{currency}', currency);
}

export async function resolvePrompts(
  store: Store,
  choice: Choice,
): Promise<{ language: Language; voice: string; style: string; exaggerated: boolean; faithful: boolean }> {
  let scene = choice.sceneId ? await store.scene(choice.sceneId) : null;
  let comic = choice.comicId ? await store.scene(choice.comicId) : null;
  // Older app versions sent the funny ones as the scene.
  if (scene?.kind === 'comic' && !comic) [comic, scene] = [scene, null];
  if (scene && scene.kind !== 'place') scene = null;
  if (comic && comic.kind !== 'comic') comic = null;
  const personality = choice.personalityId ? await store.personality(choice.personalityId) : null;

  const personalityStyle = personality
    ? choice.sex === 'male' && personality.styleMale ? personality.styleMale : personality.style
    : null;
  const outfit = personality
    ? (choice.sex === 'male' && personality.outfitMale ? personality.outfitMale : personality.outfit) ?? personalityStyle
    : null;
  const place = choice.customStyle ?? scene?.style ?? null;

  let base: { language: Language; voice: string; style: string };
  if (place && personality && personalityStyle) {
    // Two steps: the scene gives the place (and its pose), the mode gives the outfit, attitude and tone.
    base = {
      language: choice.customStyle ? (choice.language ?? personality.language) : scene!.language,
      voice: combinedVoice(personality.voice, choice.customStyle ? null : scene?.voice ?? null),
      style: combinedStyle(place, outfit!),
    };
  } else if (choice.customStyle) {
    base = { language: choice.language ?? personality?.language ?? 'en', voice: CUSTOM_SCENE_VOICE, style: choice.customStyle };
  } else if (scene) {
    base = { language: scene.language, voice: scene.voice ?? personality?.voice ?? CUSTOM_SCENE_VOICE, style: scene.style };
  } else if (personality) {
    base = {
      language: personality.language,
      voice: personality.voice,
      style: personalityStyle!,
    };
  } else {
    throw new Error('unknown_personality');
  }
  const addon = comic ? (comic.addon ?? comic.style) : null;
  return {
    ...base,
    style: addon ? `${base.style} ${addon}` : base.style,
    exaggerated: Boolean(comic),
    // Custom scenes and pose changes come out much better with the faithful model.
    faithful: Boolean(choice.customStyle) || Boolean(scene?.faithful) || Boolean(comic?.faithful),
  };
}

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
    /** Slower model that keeps small markings, poses and custom scenes; falls back to `images`. */
    faithfulImages?: ImageEditor;
    log?: (msg: string) => void;
    /** Cuts screen bars and borders around the photograph; returns a data URI, or null when not needed. */
    crop?: (imageUrl: string, photo: HeadBox) => Promise<string | null>;
  },
  gen: Generation,
): Promise<Outcome> {
  const { store, phrases, images, faithfulImages, crop, log = console.log } = deps;
  try {
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
    const prompts = await resolvePrompts(store, {
      personalityId: gen.personalityId,
      sceneId: gen.sceneId,
      comicId: gen.comicId,
      customStyle: custom ? customSceneStyle(custom) : undefined,
      language: gen.language,
      sex: gen.petSex,
    });
    const style = withCurrency(prompts.style, prompts.language, gen.spelling);

    const request = {
      imageUrl: sourceUrl,
      style,
      exaggerated: prompts.exaggerated,
      appearance: check.appearance,
      petCount: check.petCount,
    };
    await store.setStage?.(gen.id, 'painting').catch(() => {});
    let image;
    // Several pets: the fast model split the outfit between them and changed faces.
    if (faithfulImages && (prompts.faithful || check.smallMarkings || check.wearsClothes || (check.petCount ?? 1) > 1)) {
      try {
        image = await faithfulImages.edit(request);
      } catch (error) {
        // Too slow or failed: the fast model still gives the person a picture.
        log(`faithful model failed for ${gen.id}: ${error instanceof Error ? error.message.slice(0, 80) : error}`);
      }
    }
    if (!image) {
      try {
        image = await images.edit(request);
      } catch (error) {
        // The fast model's safety filter sometimes blocks a harmless picture: the other model may not.
        if (!(error instanceof Error) || error.message !== 'image_blocked' || !faithfulImages) throw error;
        log(`fast model blocked ${gen.id}; trying the faithful one`);
        image = await faithfulImages.edit(request);
      }
    }
    const ext = image.contentType.includes('png') ? 'png' : image.contentType.includes('webp') ? 'webp' : 'jpg';
    const imagePath = `${gen.userId}/${gen.id}.${ext}`;
    // Speed: the picture is saved (and shown in the app as soon as it is) while the line is
    // being written from the same bytes, instead of one after the other.
    const saved = store
      .upload('generated', imagePath, image.bytes, image.contentType)
      .then(() => store.setStage?.(gen.id, 'writing', imagePath).catch(() => {}));
    saved.catch(() => {});

    // The line is written last, looking at the final picture, so it matches what is really there.
    const phraseImage =
      image.bytes.length <= INLINE_IMAGE_MAX ? toDataUri(image.bytes, image.contentType) : (await saved, await store.signedUrl('generated', imagePath));
    const phrasePromise = phrases.write({
      imageUrl: phraseImage,
      language: prompts.language,
      spelling: gen.spelling,
      voice: prompts.voice,
      scene: style,
      exclude: [],
      sex: gen.petSex,
      name: gen.petName,
      recipient: gen.recipientName,
      petCount: check.petCount,
      examples: await (store.phraseExamples?.(prompts.language) ?? Promise.resolve([])).catch(() => []),
    });
    const [phrase] = await Promise.all([phrasePromise, saved]);
    if (!phrase.phrase) throw new Error(phrase.isPet ? 'phrase_empty' : 'phrase_no_pet');

    const finished = await store.finish(gen.id, imagePath, phrase.phrase, phrase.head, phrase.prop, phrase.body);
    if (!finished) throw new Error('finish_rejected');
    return 'succeeded';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`generation ${gen.id} failed: ${message.replace(/(Key|Bearer)\s+\S+/gi, '$1 [redacted]')}`);
    await store.fail(gen.id, safeReason(message)).catch((e) => log(`refund failed for ${gen.id}: ${e}`));
    return 'failed';
  } finally {
    // Whatever happened, the original photo is no longer needed (privacy policy: gone within 24 h;
    // the hourly clean-up catches anything this misses).
    await store.removeOriginal(gen.originalPath).catch((e) => log(`original not removed for ${gen.id}: ${e}`));
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
