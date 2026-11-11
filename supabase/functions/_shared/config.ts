// Secrets and settings, read from Edge Function secrets
// (`supabase secrets set ...`). Never shipped in the app.
import { ClaudePhraseWriter, FalImageEditor } from './ai.ts';

function required(name: string): string {
  // Keys pasted in a dashboard often carry stray spaces or line breaks.
  const value = Deno.env.get(name)?.replace(/\s+/g, '');
  if (!value) throw new Error(`missing_secret_${name}`);
  return value;
}

export function phraseWriter() {
  return new ClaudePhraseWriter(required('ANTHROPIC_API_KEY'), Deno.env.get('TEXT_MODEL') ?? 'claude-opus-5-5');
}

/** Fast model (~20 s), used by default. */
export function imageEditor() {
  return new FalImageEditor(required('FAL_KEY'), Deno.env.get('IMAGE_MODEL') ?? 'fal-ai/flux-pro/kontext');
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
  );
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
