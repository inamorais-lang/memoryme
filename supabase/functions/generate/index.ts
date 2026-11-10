// POST { personalityId, originalPath } → 202 { generationId }
// Spends 1 credit on the server (atomic, rate limited), then makes the image
// and the phrase in the background. The app polls the `generations` row.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { imageEditor, json, phraseWriter } from '../_shared/config.ts';
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
    });
    if (error || typeof generationId !== 'string') {
      const { status, code } = httpErrorFor(error?.message ?? '');
      if (status === 500) console.error('start_generation', error);
      return json({ code }, status);
    }

    EdgeRuntime.waitUntil(
      runGeneration(
        { store: supabaseStore(ctx.supabaseAdmin), phrases, images },
        { id: generationId, userId, personalityId, originalPath },
      ),
    );
    return json({ generationId }, 202);
  }),
};
