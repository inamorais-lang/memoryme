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

export function imageEditor() {
  return new FalImageEditor(required('FAL_KEY'), Deno.env.get('IMAGE_MODEL') ?? 'fal-ai/flux-pro/kontext');
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}
