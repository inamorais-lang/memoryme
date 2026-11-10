import { findPersonality } from '@/features/personalities/data';

export type TranslateRequest = {
  photoUri: string;
  personalityId: string;
  /** Phrases already shown for this photo, so a retry gives a new one. */
  exclude?: string[];
};

export type TranslateResult = { phrase: string };

/**
 * The single entry point for "photo → phrase".
 *
 * Phase 1: picks a local phrase (no AI, no cost).
 * Phase 2: this calls the `generate` Edge Function, which checks and
 * spends a credit on the server before calling the AI. Screens don't change.
 */
export async function translatePhoto(req: TranslateRequest): Promise<TranslateResult> {
  const personality = findPersonality(req.personalityId);
  if (!personality) throw new Error(`Unknown personality: ${req.personalityId}`);

  await delay(1400); // Feels like work is being done; matches real AI latency.

  return { phrase: pickPhrase(personality.phrases, req.exclude ?? []) };
}

export function pickPhrase(phrases: string[], exclude: string[], random = Math.random): string {
  const fresh = phrases.filter((p) => !exclude.includes(p));
  const pool = fresh.length > 0 ? fresh : phrases;
  return pool[Math.floor(random() * pool.length)];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
