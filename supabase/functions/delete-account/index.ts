// POST → 200. Deletes the caller's photos and account (rows cascade).
// Required by the App Store: account deletion inside the app.
// TODO(Phase 3): also revoke the Sign in with Apple token (needs Apple keys).
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);

    const admin = ctx.supabaseAdmin;
    for (const bucket of ['originals', 'generated']) {
      // Remove in pages until the user's folder is empty.
      for (let page = 0; page < 50; page++) {
        const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 100 });
        if (error) {
          console.error('delete-account list', error);
          return json({ code: 'server_error' }, 500);
        }
        if (!data || data.length === 0) break;
        const { error: removeError } = await admin.storage
          .from(bucket)
          .remove(data.map((file) => `${userId}/${file.name}`));
        if (removeError) {
          console.error('delete-account remove', removeError);
          return json({ code: 'server_error' }, 500);
        }
      }
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('delete-account user', error);
      return json({ code: 'server_error' }, 500);
    }
    return json({ deleted: true });
  }),
};
