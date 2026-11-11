import { describe, expect, it } from '@jest/globals';

import en from '@/i18n/locales/en';
import enUS from '@/i18n/locales/en-US';
import es from '@/i18n/locales/es';
import fr from '@/i18n/locales/fr';
import ptPT from '@/i18n/locales/pt-PT';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it.each([
    ['EN', en],
    ['ES', es],
    ['FR', fr],
  ])('%s has exactly the same keys as PT-PT', (_name, strings) => {
    expect(keys(strings).sort()).toEqual(keys(ptPT).sort());
  });

  it('US English only overrides existing keys', () => {
    const base = keys(en);
    for (const k of keys(enUS)) expect(base).toContain(k);
  });

  it('never ships "em breve" / "coming soon" (App Store rule)', () => {
    const all = JSON.stringify([ptPT, en, enUS, es, fr]).toLowerCase();
    expect(all).not.toContain('em breve');
    expect(all).not.toContain('coming soon');
    expect(all).not.toContain('próximamente');
    expect(all).not.toContain('bientôt');
  });
});
