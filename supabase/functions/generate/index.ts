// POST { personalityId, originalPath, sceneId?, customScene?, exaggerated? } → 202 { generationId }
// customScene ("Cenário à medida", 3–80 chars) costs 2 credits instead of 1.
// Spends 1 credit on the server (atomic, rate limited), then makes the image
// and the phrase in the background. The app polls the `generations` row.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { imageEditor, json, phraseWriter } from '../_shared/config.ts';
import { cropToPhoto } from '../_shared/crop.ts';
import { httpErrorFor, runGeneration } from '../_shared/pipeline.ts';
import { supabaseStore } from '../_shared/store.ts';

// Provided by the Supabase Edge Runtime.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);

    const body = await req.json().catch(() => null);
    const personalityId = body?.personalityId;
    const originalPath = body?.originalPath;
    if (typeof personalityId !== 'string' || typeof originalPath !== 'string') {
      return json({ code: 'bad_request' }, 400);
    }
    const rawScene = body?.customScene;
    if (rawScene !== undefined && rawScene !== null && typeof rawScene !== 'string') {
      return json({ code: 'bad_request' }, 400);
    }
    const sceneId = typeof body?.sceneId === 'string' ? body.sceneId : undefined;
    const wantsExaggerated = body?.exaggerated === true;
    const customScene = typeof rawScene === 'string' ? rawScene.replace(/\s+/g, ' ').trim() || undefined : undefined;

    // Build the AI clients first: a missing secret must fail before a credit is spent.
    let phrases, images;
    try {
      phrases = phraseWriter();
      images = imageEditor();
    } catch (error) {
      console.error(error);
      return json({ code: 'server_error' }, 500);
    }

    const { data: generationId, error } = await ctx.supabaseAdmin.rpc('start_generation', {
      p_user_id: userId,
      p_personality_id: personalityId,
      p_original_path: originalPath,
      p_custom_scene: customScene ?? null,
      p_scene_id: sceneId ?? null,
      p_exaggerated: wantsExaggerated,
    });
    if (error || typeof generationId !== 'string') {
      const { status, code } = httpErrorFor(error?.message ?? '');
      if (status === 500) console.error('start_generation', error);
      return json({ code }, status);
    }

    EdgeRuntime.waitUntil(
      runGeneration(
        { store: supabaseStore(ctx.supabaseAdmin), phrases, images, crop: (url, photo) => cropToPhoto(url, photo) },
        { id: generationId, userId, personalityId, originalPath, sceneId, customScene, exaggerated: wantsExaggerated },
      ),
    );
    return json({ generationId }, 202);
  }),
};
