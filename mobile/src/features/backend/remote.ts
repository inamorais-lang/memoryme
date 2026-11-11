import type { SupabaseClient } from '@supabase/supabase-js';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { newId } from '@/features/history/history';
import { currentLanguage, currentSpelling } from '@/i18n';
import type { PickedPhoto } from '@/lib/photos';

import { BackendError, type Backend, type BackendErrorCode, type TranslationView } from './types';

const MAX_SIDE = 1536;
const COLUMNS =
  'id, status, personality_id, image_path, phrase, custom_phrase, free_phrase_used, balloon_position, balloon_x, balloon_y, failure_reason, cost, head, prop, created_at';

type Row = {
  id: string;
  status: TranslationView['status'];
  personality_id: string | null;
  image_path: string | null;
  phrase: string | null;
  free_phrase_used: boolean;
  balloon_position: TranslationView['balloonPosition'];
  custom_phrase: string | null;
  balloon_x: number | null;
  balloon_y: number | null;
  failure_reason: string | null;
  cost: number;
  head: number[] | null;
  prop: number[] | null;
  created_at: string;
};

const KNOWN_CODES: BackendErrorCode[] = ['insufficient_credits', 'rate_limited', 'daily_limit', 'no_free_phrase', 'invalid_scene'];

/** Turns an Edge Function error into a code the screens understand. */
async function toBackendError(error: unknown): Promise<BackendError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    if (response.status === 401) return new BackendError('auth_required');
    const body = await response.json().catch(() => null);
    const code = KNOWN_CODES.find((c) => c === body?.code);
    return new BackendError(code ?? 'server_error');
  }
  return new BackendError('network');
}

/** Smaller uploads: faster, cheaper for the AI, and within Edge Function limits. */
async function prepareUpload(photo: PickedPhoto): Promise<ArrayBuffer> {
  let uri = photo.uri;
  if (Platform.OS !== 'web') {
    const context = ImageManipulator.manipulate(photo.uri);
    if (Math.max(photo.width, photo.height) > MAX_SIDE) {
      context.resize(photo.width >= photo.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
    }
    const image = await context.renderAsync();
    uri = (await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG })).uri;
  }
  return (await fetch(uri)).arrayBuffer();
}

export function remoteBackend(supabase: SupabaseClient): Backend {
  async function userId() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new BackendError('auth_required');
    return id;
  }

  async function toViews(rows: Row[]): Promise<TranslationView[]> {
    const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p);
    const urls = new Map<string, string>();
    if (paths.length > 0) {
      const { data } = await supabase.storage.from('generated').createSignedUrls(paths, 3600);
      for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      personalityId: r.personality_id ?? undefined,
      imageUri: r.image_path ? urls.get(r.image_path) : undefined,
      phrase: r.phrase ?? undefined,
      freePhraseUsed: r.free_phrase_used,
      balloonPosition: r.balloon_position,
      customPhrase: r.custom_phrase ?? undefined,
      balloonX: r.balloon_x ?? undefined,
      balloonY: r.balloon_y ?? undefined,
      failureReason: r.failure_reason ?? undefined,
      cost: r.cost ?? 1,
      head: r.head?.length === 4 ? (r.head as [number, number, number, number]) : undefined,
      prop: r.prop?.length === 4 ? (r.prop as [number, number, number, number]) : undefined,
      createdAt: Date.parse(r.created_at),
    }));
  }

  return {
    mode: 'remote',
    async listPersonalities(market) {
      const { data, error } = await supabase
        .from('personalities')
        .select('id, name, tagline')
        .contains('markets', [market])
        .order('sort_order');
      if (error) throw new BackendError('network');
      return data ?? [];
    },
    async listPacks() {
      const { data, error } = await supabase
        .from('credit_packs')
        .select('product_id, credits')
        .eq('active', true)
        .eq('on_sale', true)
        .order('sort_order');
      if (error) throw new BackendError('network');
      return (data ?? []).map((p) => ({ productId: p.product_id as string, credits: p.credits as number }));
    },
    async verifyPurchase(signedTransaction) {
      const { data, error } = await supabase.functions.invoke('verify-purchase', { body: { signedTransaction } });
      if (error) {
        // A refused transaction (wrong app, wrong account, refunded…) is not a network problem.
        if (error instanceof FunctionsHttpError && (error.context as Response).status === 400) {
          throw new BackendError('purchase_rejected');
        }
        throw await toBackendError(error);
      }
      return { creditsAdded: Number(data?.creditsAdded ?? 0) };
    },
    async listScenes(language, market) {
      const { data, error } = await supabase
        .from('scenes')
        .select('id, name, kind, category')
        .eq('language', language)
        .or(`markets.is.null,markets.cs.{${market}}`)
        .order('sort_order');
      if (error) throw new BackendError('network');
      return data ?? [];
    },
    async createTranslation(photo, choice) {
      const uid = await userId();
      const originalPath = `${uid}/${newId()}.jpg`;
      try {
        const body = await prepareUpload(photo);
        const { error } = await supabase.storage
          .from('originals')
          .upload(originalPath, body, { contentType: 'image/jpeg' });
        if (error) throw error;
      } catch {
        throw new BackendError('network');
      }
      const { data, error } = await supabase.functions.invoke('generate', {
        body: { ...choice, originalPath, aiConsent: true, language: currentLanguage(), spelling: currentSpelling() },
      });
      if (error) throw await toBackendError(error);
      return data.generationId as string;
    },
    async getTranslation(id) {
      const { data, error } = await supabase.from('generations').select(COLUMNS).eq('id', id).maybeSingle();
      if (error) throw new BackendError('network');
      if (!data) return null;
      return (await toViews([data as Row]))[0];
    },
    async newPhrase(id) {
      const { data, error } = await supabase.functions.invoke('new-phrase', { body: { generationId: id } });
      if (error) throw await toBackendError(error);
      return data.phrase as string;
    },
    async setBalloonSpot(id, x, y) {
      const { error } = await supabase.from('generations').update({ balloon_x: x, balloon_y: y }).eq('id', id);
      if (error) throw new BackendError('network');
    },
    async setCustomPhrase(id, text) {
      const { error } = await supabase.from('generations').update({ custom_phrase: text }).eq('id', id);
      if (error) throw new BackendError('network');
    },
    async deleteTranslation(id) {
      const { error } = await supabase.functions.invoke('delete-image', { body: { generationId: id } });
      if (error) throw await toBackendError(error);
    },
    async listHistory() {
      const { data, error } = await supabase
        .from('generations')
        .select(COLUMNS)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw new BackendError('network');
      return toViews((data ?? []) as Row[]);
    },
  };
}
