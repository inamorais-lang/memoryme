// Secrets and settings, read from Edge Function secrets
// (`supabase secrets set ...`). Never shipped in the app.
import { type Aspect, ClaudePhraseWriter, FalImageEditor } from './ai.ts';

function aspect(): Aspect {
  const value = Deno.env.get('IMAGE_ASPECT');
  // 2:3 by default (decision of the product owner): room for the balloon, close to the first pictures.
  return value === '4:5' || value === '3:4' || value === '9:16' ? value : '2:3';
}

function required(name: string): string {
  // Keys pasted in a dashboard often carry stray spaces or line breaks.
  const value = Deno.env.get(name)?.replace(/\s+/g, '');
  if (!value) throw new Error(`missing_secret_${name}`);
  return value;
}

export function phraseWriter() {
  const model = Deno.env.get('TEXT_MODEL') ?? 'claude-opus-5-5';
  return new ClaudePhraseWriter(required('ANTHROPIC_API_KEY'), model, Deno.env.get('CHECK_MODEL') ?? 'claude-sonnet-5-5');
}

/** Fast model (~20 s), used by default. */
export function imageEditor() {
  return new FalImageEditor(required('FAL_KEY'), Deno.env.get('IMAGE_MODEL') ?? 'fal-ai/flux-pro/kontext', fetch, 110_000, aspect());
}

/**
 * Faithful model (~1 min): keeps small markings and follows poses and custom scenes better.
 * Shorter wait than the fast one, so a fallback still fits in the function's time.
 */
export function faithfulImageEditor() {
  return new FalImageEditor(
    required('FAL_KEY'),
    Deno.env.get('IMAGE_MODEL_FAITHFUL') ?? 'openai/gpt-image-2/edit',
    fetch,
    90_000,
    aspect(),
    imageQuality(),
  );
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/** GPT Image quality (IMAGE_QUALITY_FAITHFUL): low is faster, medium is the default. */
function imageQuality(): 'low' | 'medium' | 'high' {
  const value = Deno.env.get('IMAGE_QUALITY_FAITHFUL');
  return value === 'low' || value === 'high' ? value : 'medium';
}
