// "Imagens reportadas" (admin page): pictures their owners flagged with "Reportar imagem".
// POST {} → { reports: [{ id, reported_at, phrase, account_code, image_url }] } (latest 50).
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const admin = ctx.supabaseAdmin;
    const { data: isAdmin } = await admin.rpc('is_admin', { p_user_id: userId });
    if (isAdmin !== true) return json({ code: 'not_admin' }, 403);

    const { data, error } = await admin
      .from('generations')
      .select('id, user_id, reported_at, phrase, custom_phrase, image_path')
      .not('reported_at', 'is', null)
      .order('reported_at', { ascending: false })
      .limit(50);
    if (error) return json({ code: 'server_error' }, 500);

    const rows = data ?? [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await admin.from('profiles').select('id, account_code').in('id', ids)
      : { data: [] };
    const codes = new Map((profiles ?? []).map((p) => [p.id, p.account_code]));

    const reports = await Promise.all(
      rows.map(async (r) => {
        const signed = r.image_path
          ? await admin.storage.from('generated').createSignedUrl(r.image_path, 3600)
          : null;
        return {
          id: r.id,
          reported_at: r.reported_at,
          phrase: r.custom_phrase ?? r.phrase,
          account_code: codes.get(r.user_id) ?? null,
          image_url: signed?.data?.signedUrl ?? null,
        };
      }),
    );
    return json({ reports });
  }),
};
