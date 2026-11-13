// Private admin page (docs/admin): the owner sends news as a push notification.
// POST { list: true } → { broadcasts }
// POST { title, body, markets: ['PT', ...] } → { sent, texts }   (written in Portuguese, translated by Claude)
// At most one every 7 days (enforced in SQL: admin_push_targets raises too_soon).
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json, phraseWriter } from '../_shared/config.ts';
import { lang, sendPush } from '../_shared/push.ts';

const MARKETS = ['PT', 'ES', 'FR', 'GB', 'US'];
const KNOWN = ['not_admin', 'too_soon'];

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const admin = ctx.supabaseAdmin;
    const body = await req.json().catch(() => null);
    const fail = (error: { message: string }) => {
      const code = KNOWN.find((c) => error.message.includes(c));
      if (!code) console.error('admin-push', error);
      return json({ code: code ?? 'server_error' }, code === 'not_admin' ? 403 : code ? 409 : 500);
    };

    if (body?.list === true) {
      const { data, error } = await admin.rpc('admin_list_broadcasts', { p_admin_id: userId });
      return error ? fail(error) : json({ broadcasts: data ?? [] });
    }

    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 60) : '';
    const text = typeof body?.body === 'string' ? body.body.trim().slice(0, 180) : '';
    const markets = Array.isArray(body?.markets) ? body.markets.filter((m: unknown) => MARKETS.includes(m as string)) : [];
    if (!title || !text || markets.length === 0) return json({ code: 'bad_request' }, 400);

    // Checks admin and the weekly limit before spending on the translation.
    const { data: targets, error } = await admin.rpc('admin_push_targets', { p_admin_id: userId, p_markets: markets });
    if (error) return fail(error);
    const texts = await phraseWriter().translateNews(title, text);
    if (!texts) return json({ code: 'translation_failed' }, 502);

    const rows = (targets ?? []) as { token: string; language: string }[];
    const { sent, dead } = await sendPush(rows.map((r) => ({ to: r.token, ...texts[lang(r.language)] })));
    if (dead.length) await admin.rpc('drop_push_tokens', { p_tokens: dead });
    const logged = await admin.rpc('admin_log_broadcast', { p_admin_id: userId, p_markets: markets, p_texts: texts, p_sent: sent });
    if (logged.error) console.error('admin-push log', logged.error);
    return json({ sent, texts });
  }),
};
