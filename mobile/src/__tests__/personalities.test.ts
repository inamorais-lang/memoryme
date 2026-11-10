import { describe, expect, it } from '@jest/globals';

import { personalities, personalitiesFor } from '@/features/personalities/data';
import { pickPhrase } from '@/features/translate/translate';

describe('personalities', () => {
  it.each(['pt-PT', 'en'] as const)('has 6 personalities for %s', (language) => {
    expect(personalitiesFor(language)).toHaveLength(6);
  });

  it('has unique ids and at least 10 phrases each', () => {
    const ids = personalities.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of personalities) {
      expect(p.phrases.length).toBeGreaterThanOrEqual(10);
      expect(new Set(p.phrases).size).toBe(p.phrases.length);
    }
  });
});

describe('pickPhrase', () => {
  const phrases = ['a', 'b', 'c'];

  it('never repeats a phrase that was already shown', () => {
    for (let i = 0; i < 50; i++) {
      expect(['c']).toContain(pickPhrase(phrases, ['a', 'b']));
    }
  });

  it('falls back to any phrase when all were shown', () => {
    expect(phrases).toContain(pickPhrase(phrases, phrases));
  });
});
