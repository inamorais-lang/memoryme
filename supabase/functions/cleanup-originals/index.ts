// POST (hourly, from pg_cron) → 200 { removed }.
// Privacy policy: original photos are kept for at most 24 hours. The pipeline
// already deletes them when a picture is done; this catches the rest
// (uploads that never became a generation, crashes, timeouts).
// No caller auth on purpose: the only thing it can do is delete originals that are
// already older than 23 hours (which the privacy policy requires anyway). It returns
// a count, never data. The work itself uses the admin client.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

export default {
  fetch: withSupabase({ auth: 'none' }, async (_req, ctx) => {
    const admin = ctx.supabaseAdmin;
    let removed = 0;
    for (let round = 0; round < 20; round++) {
      const { data, error } = await admin.rpc('stale_originals', { p_limit: 100 });
      if (error) {
        console.error('cleanup list', error);
        return json({ code: 'server_error', removed }, 500);
      }
      const paths = (data ?? []) as string[];
      if (paths.length === 0) break;
      const { error: removeError } = await admin.storage.from('originals').remove(paths);
      if (removeError) {
        console.error('cleanup remove', removeError);
        return json({ code: 'server_error', removed }, 500);
      }
      removed += paths.length;
    }
    return json({ removed });
  }),
};
