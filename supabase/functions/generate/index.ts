// POST { originalPath, aiConsent: true, personalityId? | sceneId? | customScene?, comicId?, language?, spelling?: 'GB' | 'US',
//        petSex?: 'male' | 'female', petName? } → 202 { generationId }
// One choice (a mode, a place scene or a custom scene) plus an optional funny extra (comicId, free).
// customScene ("Criar cenário", 3–80 chars) costs 2 credits instead of 1.
// Spends 1 credit on the server (atomic, rate limited), then makes the image
// and the phrase in the background. The app polls the `generations` row.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { faithfulImageEditor, imageEditor, json, phraseWriter } from '../_shared/config.ts';
import { cropToPhoto } from '../_shared/crop.ts';
import { httpErrorFor, runGeneration } from '../_shared/pipeline.ts';
import { cleanPetName } from '../_shared/prompts.ts';
import { supabaseStore } from '../_shared/store.ts';

// Provided by the Supabase Edge Runtime.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const personalityId = typeof body?.personalityId === 'string' ? body.personalityId : undefined;
    const originalPath = body?.originalPath;
    if (typeof originalPath !== 'string') return json({ code: 'bad_request' }, 400);
    const rawScene = body?.customScene;
    if (rawScene !== undefined && rawScene !== null && typeof rawScene !== 'string') {
      return json({ code: 'bad_request' }, 400);
    }
    // The photo goes to third-party AI: never without the person's explicit consent.
    if (body?.aiConsent !== true) return json({ code: 'consent_required' }, 400);
    const sceneId = typeof body?.sceneId === 'string' ? body.sceneId : undefined;
    const comicId = typeof body?.comicId === 'string' ? body.comicId : undefined;
    const language = (['pt-PT', 'en', 'es', 'fr'] as const).find((l) => l === body?.language);
    const spelling = body?.spelling === 'US' || body?.spelling === 'GB' ? body.spelling : undefined;
    const petSex = body?.petSex === 'male' || body?.petSex === 'female' ? body.petSex : undefined;
    const petName = cleanPetName(body?.petName);
    const customScene = typeof rawScene === 'string' ? rawScene.replace(/\s+/g, ' ').trim() || undefined : undefined;

    // Build the AI clients first: a missing secret must fail before a credit is spent.
    let phrases, images, faithfulImages;
    try {
      phrases = phraseWriter();
      images = imageEditor();
      faithfulImages = faithfulImageEditor();
    } catch (error) {
      console.error(error);
      return json({ code: 'server_error' }, 500);
    }

    const { data: generationId, error } = await ctx.supabaseAdmin.rpc('start_generation', {
      p_user_id: userId,
      p_personality_id: personalityId ?? null,
      p_original_path: originalPath,
      p_custom_scene: customScene ?? null,
      p_scene_id: sceneId ?? null,
      p_comic_id: comicId ?? null,
      p_language: language ?? null,
    });
    if (error || typeof generationId !== 'string') {
      const { status, code } = httpErrorFor(error?.message ?? '');
      if (status === 500) console.error('start_generation', error);
      return json({ code }, status);
    }

    // Proof of consent (first time only); never blocks the picture.
    await ctx.supabaseAdmin
      .from('profiles')
      .update({ ai_consent_at: new Date().toISOString() })
      .eq('id', userId)
      .is('ai_consent_at', null);
    if (spelling || petSex || petName) {
      await ctx.supabaseAdmin
        .from('generations')
        .update({ spelling, pet_sex: petSex ?? null, pet_name: petName ?? null })
        .eq('id', generationId);
    }

    EdgeRuntime.waitUntil(
      runGeneration(
        { store: supabaseStore(ctx.supabaseAdmin), phrases, images, faithfulImages, crop: (url, photo) => cropToPhoto(url, photo) },
        { id: generationId, userId, personalityId, originalPath, sceneId, customScene, comicId, language, spelling, petSex, petName },
      ),
    );
    return json({ generationId }, 202);
  }),
};
