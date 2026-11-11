// POST { generationId } → 200 { deleted: true }. Deletes one of the caller's
// pictures: the stored image and its row (privacy: "until you delete it").
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    const generationId = body?.generationId;
    if (typeof generationId !== 'string') return json({ code: 'bad_request' }, 400);

    const admin = ctx.supabaseAdmin;
    const { data: gen, error } = await admin
      .from('generations')
      .select('image_path, status')
      .eq('id', generationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return json({ code: 'server_error' }, 500);
    if (!gen) return json({ code: 'not_found' }, 404);
    // Still being made: deleting now would race with the pipeline.
    if (gen.status === 'pending') return json({ code: 'still_pending' }, 409);

    if (gen.image_path) {
      const { error: removeError } = await admin.storage.from('generated').remove([gen.image_path]);
      if (removeError) return json({ code: 'server_error' }, 500);
    }
    const { error: deleteError } = await admin.from('generations').delete().eq('id', generationId).eq('user_id', userId);
    if (deleteError) return json({ code: 'server_error' }, 500);
    return json({ deleted: true });
  }),
};
