// The two AI providers, behind small interfaces so the pipeline can be
// tested with fakes. Keys come only from Edge Function secrets.
import Anthropic from 'npm:@anthropic-ai/sdk@1.6.0';

import { imageEditPrompt, phraseSystemPrompt, phraseUserPrompt, type Language } from './prompts.ts';

export type PhraseResult = { isPet: boolean; phrase: string };

export interface PhraseWriter {
  write(args: {
    imageUrl: string;
    language: Language;
    voice: string;
    scene: string;
    exclude: string[];
  }): Promise<PhraseResult>;
}

export interface ImageEditor {
  /** Returns the bytes of the restyled image. */
  edit(args: { imageUrl: string; style: string }): Promise<{ bytes: Uint8Array; contentType: string }>;
}

// ───────────────────────── Claude (phrase + "is there a pet?") ─────────────────────────

const PHRASE_SCHEMA = {
  type: 'object',
  properties: {
    is_pet: { type: 'boolean' },
    phrase: { type: 'string' },
  },
  required: ['is_pet', 'phrase'],
  additionalProperties: false,
};

export class ClaudePhraseWriter implements PhraseWriter {
  private client: Anthropic;

  constructor(
    apiKey: string,
    private model: string,
  ) {
    this.client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  }

  async write(args: Parameters<PhraseWriter['write']>[0]): Promise<PhraseResult> {
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: 4000,
      // Re-runs on a fallback model if the main one declines on a safety false positive.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: PHRASE_SCHEMA },
      },
      system: phraseSystemPrompt(args.language),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: args.imageUrl } },
            {
              type: 'text',
              text: phraseUserPrompt({ voice: args.voice, scene: args.scene, exclude: args.exclude }),
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') throw new Error('phrase_refused');
    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') throw new Error('phrase_empty');
    return parsePhrase(text.text);
  }
}

export function parsePhrase(raw: string): PhraseResult {
  const data = JSON.parse(raw);
  const isPet = data.is_pet === true;
  const phrase =
    typeof data.phrase === 'string'
      ? data.phrase
          .replace(/<[^>]*>/g, ' ') // stray markup such as </br>
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/^["“”']+|["“”']+$/g, '')
      : '';
  if (isPet && phrase.length === 0) throw new Error('phrase_empty');
  return { isPet, phrase: phrase.slice(0, 160) };
}

// ───────────────────────── fal.ai (image restyle) ─────────────────────────

/** Each fal model names its inputs slightly differently. */
export function falInput(model: string, prompt: string, imageUrl: string): Record<string, unknown> {
  if (model.startsWith('fal-ai/flux-pro/kontext')) {
    return { prompt, image_url: imageUrl, num_images: 1, output_format: 'jpeg' };
  }
  if (model.startsWith('openai/gpt-image')) {
    return { prompt, image_urls: [imageUrl], num_images: 1, output_format: 'jpeg', quality: 'medium' };
  }
  // Nano Banana family (default).
  return { prompt, image_urls: [imageUrl], num_images: 1, output_format: 'jpeg', resolution: '1K', aspect_ratio: 'auto' };
}

export class FalImageEditor implements ImageEditor {
  constructor(
    private apiKey: string,
    private model: string,
    private fetchFn: typeof fetch = fetch,
  ) {}

  async edit({ imageUrl, style }: { imageUrl: string; style: string }) {
    const response = await this.fetchFn(`https://fal.run/${this.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
        // Don't keep the user's photo in fal's request history; expire outputs fast.
        'X-Fal-Store-IO': '0',
        'X-Fal-Object-Lifecycle-Preference': JSON.stringify({ expiration_duration_seconds: 3600 }),
      },
      body: JSON.stringify(falInput(this.model, imageEditPrompt(style), imageUrl)),
      signal: AbortSignal.timeout(110_000),
    });
    if (!response.ok) {
      throw new Error(`image_failed_${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    const result = await response.json();
    const url: string | undefined = result?.images?.[0]?.url;
    if (!url) throw new Error('image_missing');

    const image = await this.fetchFn(url, { signal: AbortSignal.timeout(30_000) });
    if (!image.ok) throw new Error(`image_download_${image.status}`);
    return {
      bytes: new Uint8Array(await image.arrayBuffer()),
      contentType: image.headers.get('content-type') ?? 'image/jpeg',
    };
  }
}
