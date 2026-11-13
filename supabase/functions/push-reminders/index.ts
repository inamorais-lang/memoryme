// POST (daily, from pg_cron) → 200 { sent }.
// One reminder per absence to people who left credits unused for 7+ days (owner-approved).
// No caller auth on purpose, like cleanup-originals: it can only send that reminder, once,
// to the people who qualify, and returns a count, never data.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';
import { reminderMessage, sendPush } from '../_shared/push.ts';

export default {
  fetch: withSupabase({ auth: 'none' }, async (_req, ctx) => {
    const admin = ctx.supabaseAdmin;
    const { data, error } = await admin.rpc('credit_reminder_targets', { p_limit: 1000 });
    if (error) {
      console.error('reminder targets', error);
      return json({ code: 'server_error' }, 500);
    }
    const rows = (data ?? []) as { user_id: string; token: string; language: string; credits: number }[];
    if (rows.length === 0) return json({ sent: 0 });
    // Marked first: a crash halfway never sends the same reminder twice.
    await admin.rpc('mark_credit_reminded', { p_user_ids: [...new Set(rows.map((r) => r.user_id))] });
    const { sent, dead } = await sendPush(rows.map((r) => reminderMessage(r.token, r.language, r.credits)));
    if (dead.length) await admin.rpc('drop_push_tokens', { p_tokens: dead });
    return json({ sent });
  }),
};
