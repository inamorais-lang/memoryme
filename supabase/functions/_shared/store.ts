// Store implementation over the Supabase admin client (service role).
// Only used inside Edge Functions; every query is scoped by the IDs the
// SQL functions already validated against the caller.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.119.0';

import type { PersonalityPrompts, Store } from './pipeline.ts';

export function supabaseStore(admin: SupabaseClient): Store {
  return {
    async personality(id) {
      const { data, error } = await admin
        .from('personalities')
        .select('language, voice_prompt, image_prompt, image_prompt_male, outfit_prompt, outfit_prompt_male, faithful, dry_line')
        .eq('id', id)
        .single();
      if (error || !data) throw new Error(`personality_${error?.message ?? 'missing'}`);
      return {
        language: data.language,
        voice: data.voice_prompt,
        style: data.image_prompt,
        styleMale: data.image_prompt_male ?? undefined,
        outfit: data.outfit_prompt ?? undefined,
        outfitMale: data.outfit_prompt_male ?? undefined,
        faithful: data.faithful === true,
        dryLine: data.dry_line ?? undefined,
      } as PersonalityPrompts;
    },
    async scene(id) {
      const { data, error } = await admin
        .from('scenes')
        .select('kind, language, image_prompt, exaggerated, voice_prompt, addon_prompt, faithful')
        .eq('id', id)
        .single();
      if (error || !data) throw new Error(`scene_${error?.message ?? 'missing'}`);
      return {
        kind: data.kind === 'comic' ? 'comic' : 'place',
        language: data.language,
        style: data.image_prompt,
        exaggerated: data.exaggerated === true,
        voice: data.voice_prompt ?? undefined,
        addon: data.addon_prompt ?? undefined,
        faithful: data.faithful === true,
      };
    },
    async signedUrl(bucket, path) {
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 600);
      if (error || !data) throw new Error(`signed_url_${error?.message ?? 'missing'}`);
      return data.signedUrl;
    },
    async upload(bucket, path, bytes, contentType) {
      const { error } = await admin.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
      if (error) throw new Error(`upload_${error.message}`);
    },
    async finish(generationId, imagePath, phrase, head, prop, body) {
      const { data, error } = await admin.rpc('finish_generation', {
        p_generation_id: generationId,
        p_image_path: imagePath,
        p_phrase: phrase,
        p_head: head ?? null,
        p_prop: prop ?? null,
        p_body: body ?? null,
      });
      if (error) throw new Error(`finish_${error.message}`);
      return data === true;
    },
    async removeOriginal(path) {
      const { error } = await admin.storage.from('originals').remove([path]);
      if (error) throw new Error(`remove_original_${error.message}`);
    },
    async recentPhrases(userId) {
      const { data } = await admin
        .from('generations')
        .select('phrase')
        .eq('user_id', userId)
        .not('phrase', 'is', null)
        .order('created_at', { ascending: false })
        .limit(15);
      return (data ?? []).map((r) => r.phrase as string);
    },
    async phraseExamples(language) {
      const { data } = await admin.from('phrase_examples').select('text').eq('language', language).limit(200);
      const all = (data ?? []).map((r) => r.text as string);
      // A different handful each time, so the AI does not lean on the same few.
      return all.sort(() => Math.random() - 0.5).slice(0, 8);
    },
    async setCheck(generationId, info) {
      await admin.from('generations').update({ check_info: info }).eq('id', generationId);
    },
    async setModel(generationId, model) {
      await admin.from('generations').update({ image_model: model }).eq('id', generationId);
    },
    async setStage(generationId, stage, imagePath) {
      // With the picture saved, the app already shows it while the line is written.
      await admin
        .from('generations')
        .update(imagePath ? { stage, image_path: imagePath } : { stage })
        .eq('id', generationId)
        .eq('status', 'pending');
    },
    async fail(generationId, reason) {
      const { data, error } = await admin.rpc('fail_generation', {
        p_generation_id: generationId,
        p_reason: reason,
      });
      if (error) throw new Error(`fail_${error.message}`);
      return data === true;
    },
  };
}
