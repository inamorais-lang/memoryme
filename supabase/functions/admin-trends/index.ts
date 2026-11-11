// "Tema do momento" (admin page): the owner writes a trending topic; the AI checks it and turns it
// into a scene in the 4 languages, shown at the top of the choice screen.
// POST { list: true } → { trends }   ·   { topic, markets } → { trend }   ·   { end: id } → { ended }
// markets: the countries where it shows (PT, ES, FR, GB, US); topics differ by country.
import { withSupabase } from 'npm:@supabase/server@1.9.2';

import { json, phraseWriter } from '../_shared/config.ts';

const PREFIX = { 'pt-PT': 'pt', en: 'en', es: 'es', fr: 'fr' } as const;
const MARKETS = ['PT', 'ES', 'FR', 'GB', 'US'];

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);
    const userId = ctx.userClaims?.id;
    if (!userId) return json({ code: 'unauthorized' }, 401);
    const admin = ctx.supabaseAdmin;
    const { data: isAdmin } = await admin.rpc('is_admin', { p_user_id: userId });
    if (isAdmin !== true) return json({ code: 'not_admin' }, 403);
    const body = await req.json().catch(() => null);

    if (body?.list === true) {
      const { data } = await admin
        .from('scenes')
        .select('id, name, active, markets, created_at')
        .eq('category', 'trend')
        .eq('language', 'pt-PT')
        .order('created_at', { ascending: false })
        .limit(20);
      return json({ trends: (data ?? []).map((t) => ({ ...t, id: t.id.replace(/^pt-/, '') })) });
    }

    if (typeof body?.end === 'string' && /^trend-[a-z0-9]{6}$/.test(body.end)) {
      const ids = Object.values(PREFIX).map((p) => `${p}-${body.end}`);
      const { error } = await admin.from('scenes').update({ active: false }).in('id', ids);
      return error ? json({ code: 'server_error' }, 500) : json({ ended: body.end });
    }

    const topic = typeof body?.topic === 'string' ? body.topic.replace(/\s+/g, ' ').trim() : '';
    if (topic.length < 3 || topic.length > 120) return json({ code: 'invalid_topic' }, 400);
    const markets = Array.isArray(body?.markets) ? MARKETS.filter((m) => body.markets.includes(m)) : [];
    if (markets.length === 0) return json({ code: 'no_markets' }, 400);
    let scene;
    try {
      scene = await phraseWriter().describeTrend(topic);
    } catch (e) {
      console.error('admin-trends', e);
      return json({ code: 'server_error' }, 500);
    }
    if (!scene) return json({ code: 'topic_rejected' }, 400);

    const key = `trend-${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`;
    const rows = (Object.keys(PREFIX) as (keyof typeof PREFIX)[]).map((language) => ({
      id: `${PREFIX[language]}-${key}`,
      language,
      name: scene.names[language],
      image_prompt: scene.image,
      voice_prompt: scene.voice,
      kind: 'place',
      category: 'trend',
      exaggerated: false,
      // Newest on top, above every other group.
      sort_order: -Math.floor(Date.now() / 1000),
      active: true,
      markets,
    }));
    const { error } = await admin.from('scenes').insert(rows);
    if (error) {
      console.error('admin-trends insert', error);
      return json({ code: 'server_error' }, 500);
    }
    return json({ trend: { id: key, name: scene.names['pt-PT'], names: scene.names, markets } });
  }),
};
