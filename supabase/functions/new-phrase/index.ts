// POST { generationId } → { phrase }
// The one free new phrase per generation. Keeps the image, costs no credit.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json, phraseWriter } from '../_shared/config.ts';
import { httpErrorFor, resolvePrompts } from '../_shared/pipeline.ts';
import { customSceneStyle } from '../_shared/prompts.ts';
import { supabaseStore } from '../_shared/store.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const generationId = body?.generationId;
    if (typeof generationId !== 'string') return json({ code: 'bad_request' }, 400);

    const admin = ctx.supabaseAdmin;
    const { data: claimed, error } = await admin.rpc('claim_free_phrase', {
      p_user_id: userId,
      p_generation_id: generationId,
    });
    const row = Array.isArray(claimed) ? claimed[0] : null;
    if (error || !row) {
      const { status, code } = httpErrorFor(error?.message ?? 'no_free_phrase');
      return json({ code }, status);
    }

    try {
      const store = supabaseStore(admin);
      const { data: gen } = await admin
        .from('generations')
        .select('image_path, spelling, personality_id, scene_id, comic_id, custom_scene, language, pet_sex, pet_name')
        .eq('id', generationId)
        .single();
      if (!gen?.image_path) throw new Error('image_missing');
      const prompts = await resolvePrompts(store, {
        personalityId: gen.personality_id ?? undefined,
        sceneId: gen.scene_id ?? undefined,
        comicId: gen.comic_id ?? undefined,
        customStyle: gen.custom_scene ? customSceneStyle(gen.custom_scene) : undefined,
        language: gen.language ?? undefined,
      });
      const { phrase } = await phraseWriter().write({
        imageUrl: await store.signedUrl('generated', gen.image_path),
        language: prompts.language,
        spelling: gen.spelling ?? undefined,
        voice: prompts.voice,
        scene: prompts.style,
        exclude: row.shown_phrases ?? [],
        sex: gen.pet_sex === 'male' || gen.pet_sex === 'female' ? gen.pet_sex : undefined,
        name: gen.pet_name ?? undefined,
      });
      if (!phrase) throw new Error('phrase_empty');

      const { error: saveError } = await admin.rpc('set_phrase', { p_generation_id: generationId, p_phrase: phrase });
      if (saveError) throw new Error(saveError.message);
      return json({ phrase });
    } catch (e) {
      console.error('new-phrase', e);
      await admin.rpc('release_free_phrase', { p_generation_id: generationId });
      return json({ code: 'server_error' }, 500);
    }
  }),
};
