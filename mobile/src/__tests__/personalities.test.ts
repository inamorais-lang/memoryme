import { describe, expect, it } from '@jest/globals';

import { personalities, personalitiesFor, personalitiesForMarket } from '@/features/personalities/data';
import { pickPhrase } from '@/features/translate/translate';

describe('personalities', () => {
  it.each([['pt-PT', 19], ['en', 19], ['es', 19], ['fr', 18]] as const)('has the moods for %s (18 + its local one)', (language, n) => {
    expect(personalitiesFor(language)).toHaveLength(n);
  });

  it.each([['PT', 19], ['US', 18], ['GB', 19], ['ES', 19], ['FR', 18]] as const)('offers %s its own cast of %i', (market, n) => {
    expect(personalitiesForMarket(market)).toHaveLength(n);
  });

  it('keeps every offline phrase within the 45-character balloon', () => {
    for (const p of personalities) for (const phrase of p.phrases) expect(phrase.length).toBeLessThanOrEqual(45);
  });

  it('has no political personality', () => {
    expect(personalities.find((p) => p.id === 'en-campaign-rally')).toBeUndefined();
  });

  it('has unique ids and at least 5 phrases each', () => {
    const ids = personalities.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of personalities) {
      expect(p.phrases.length).toBeGreaterThanOrEqual(5);
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
