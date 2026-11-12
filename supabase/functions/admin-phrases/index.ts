// "Frases das pessoas" (admin page): lines people wrote with "Escrever a minha frase".
// The owner stars the good ones; starred lines become style examples for the AI.
// POST { list: true } → { recent: [{ text, language, starred }], starred: [{ id, text, language }] }
//      { star: { text, language } } → { ok }   ·   { unstar: id } → { ok }
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json } from '../_shared/config.ts';

const LANGUAGES = ['pt-PT', 'en', 'es', 'fr'];
const PREFIX: Record<string, string> = { pt: 'pt-PT', en: 'en', es: 'es', fr: 'fr' };

/** The language of a picture: stored for custom scenes, otherwise the prefix of its mode or scene id. */
function languageOf(row: { language: string | null; personality_id: string | null; scene_id: string | null }): string | null {
  if (row.language) return row.language;
  const id = row.personality_id ?? row.scene_id;
  return id ? PREFIX[id.split('-')[0]] ?? null : null;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const admin = ctx.supabaseAdmin;
    const { data: isAdmin } = await admin.rpc('is_admin', { p_user_id: userId });
    if (isAdmin !== true) return json({ code: 'not_admin' }, 403);
    const body = await req.json().catch(() => null);

    if (body?.star && typeof body.star.text === 'string' && LANGUAGES.includes(body.star.language)) {
      const text = body.star.text.replace(/\s+/g, ' ').trim().slice(0, 45);
      if (!text) return json({ code: 'invalid' }, 400);
      const { error } = await admin.from('phrase_examples').upsert({ text, language: body.star.language }, { onConflict: 'language,text' });
      return error ? json({ code: 'server_error' }, 500) : json({ ok: true });
    }
    if (Number.isInteger(body?.unstar)) {
      const { error } = await admin.from('phrase_examples').delete().eq('id', body.unstar);
      return error ? json({ code: 'server_error' }, 500) : json({ ok: true });
    }

    const [{ data: rows }, { data: starred }] = await Promise.all([
      admin
        .from('generations')
        .select('custom_phrase, language, personality_id, scene_id, created_at')
        .not('custom_phrase', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100),
      admin.from('phrase_examples').select('id, text, language').order('created_at', { ascending: false }),
    ]);
    const starredKeys = new Set((starred ?? []).map((s) => `${s.language}|${s.text}`));
    const seen = new Set<string>();
    const recent = [];
    for (const r of rows ?? []) {
      const language = languageOf(r);
      const text = (r.custom_phrase as string).trim();
      const key = `${language}|${text}`;
      if (!language || seen.has(key)) continue;
      seen.add(key);
      recent.push({ text, language, starred: starredKeys.has(key) });
    }
    return json({ recent, starred: starred ?? [] });
  }),
};
