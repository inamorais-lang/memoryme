// Private admin page (docs/admin): read-only statistics from our own data (no third-party analytics).
// POST { days?: 7 | 30 | 90 } → the numbers of admin_stats.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    const days = [7, 30, 90].includes(body?.days) ? body.days : 30;
    const { data, error } = await ctx.supabaseAdmin.rpc('admin_stats', { p_admin_id: userId, p_days: days });
    if (error) {
      if (error.message.includes('not_admin')) return json({ code: 'not_admin' }, 403);
      console.error('admin-stats', error);
      return json({ code: 'server_error' }, 500);
    }
    return json(data);
  }),
};
