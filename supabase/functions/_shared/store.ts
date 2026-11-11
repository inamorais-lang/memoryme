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
        .select('language, voice_prompt, image_prompt')
        .eq('id', id)
        .single();
      if (error || !data) throw new Error(`personality_${error?.message ?? 'missing'}`);
      return { language: data.language, voice: data.voice_prompt, style: data.image_prompt } as PersonalityPrompts;
    },
    async scene(id) {
      const { data, error } = await admin
        .from('scenes')
        .select('kind, language, image_prompt, exaggerated, voice_prompt, addon_prompt')
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
    async finish(generationId, imagePath, phrase, head, prop) {
      const { data, error } = await admin.rpc('finish_generation', {
        p_generation_id: generationId,
        p_image_path: imagePath,
        p_phrase: phrase,
        p_head: head ?? null,
        p_prop: prop ?? null,
      });
      if (error) throw new Error(`finish_${error.message}`);
      return data === true;
    },
    async removeOriginal(path) {
      const { error } = await admin.storage.from('originals').remove([path]);
      if (error) throw new Error(`remove_original_${error.message}`);
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
