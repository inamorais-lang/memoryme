import { describe, expect, it } from '@jest/globals';

import en from '@/i18n/locales/en';
import ptPT from '@/i18n/locales/pt-PT';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it('EN has exactly the same keys as PT-PT', () => {
    expect(keys(en).sort()).toEqual(keys(ptPT).sort());
  });

  it('never ships "em breve" / "coming soon" (App Store rule)', () => {
    const all = JSON.stringify([ptPT, en]).toLowerCase();
    expect(all).not.toContain('em breve');
    expect(all).not.toContain('coming soon');
  });
});
