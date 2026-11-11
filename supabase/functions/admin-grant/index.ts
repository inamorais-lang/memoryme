// Private admin page (docs/admin): the owner gives credits to an account by its code.
// POST { check: true } → { admin }   ·   POST { accountCode, credits, note? } → { balance, accountCode }
// Only accounts listed in private.admins can give credits; every gift is logged (admin_grants).
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

const KNOWN = ['not_admin', 'invalid_amount', 'unknown_account'];

// CORS: the wrapper answers the browser's preflight (the page lives on GitHub Pages).
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const body = await req.json().catch(() => null);

    if (body?.check === true) {
      const { data } = await ctx.supabaseAdmin.rpc('is_admin', { p_user_id: userId });
      return json({ admin: data === true });
    }

    const credits = Number(body?.credits);
    if (typeof body?.accountCode !== 'string' || !Number.isInteger(credits)) return json({ code: 'bad_request' }, 400);
    const { data, error } = await ctx.supabaseAdmin.rpc('admin_grant_credits', {
      p_admin_id: userId,
      p_account_code: body.accountCode,
      p_amount: credits,
      p_note: typeof body?.note === 'string' ? body.note.slice(0, 200) : null,
    });
    if (error) {
      const code = KNOWN.find((c) => error.message.includes(c));
      if (!code) console.error('admin-grant', error);
      return json({ code: code ?? 'server_error' }, code === 'not_admin' ? 403 : code ? 400 : 500);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return json({ balance: row?.balance ?? null, accountCode: row?.account_code ?? null });
  }),
};
