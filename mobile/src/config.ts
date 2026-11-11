/**
 * App Store page of PetBubble. Known once the app exists in App Store Connect
 * (Phase 3). While empty, sharing sends only the picture.
 */
export const APP_STORE_URL = '';

/** Terms and privacy pages (GitHub Pages, from docs/legal in the repository). */
const LEGAL_BASE = 'https://inamorais-lang.github.io/memoryme/legal/';

const LEGAL_PAGES: Record<string, { terms: string; privacy: string }> = {
  'pt-PT': { terms: 'termos.html', privacy: 'privacidade.html' },
  es: { terms: 'terminos.html', privacy: 'privacidad.html' },
  fr: { terms: 'conditions.html', privacy: 'confidentialite.html' },
  en: { terms: 'terms.html', privacy: 'privacy.html' },
};

export function legalUrl(page: 'terms' | 'privacy', language: string): string {
  return LEGAL_BASE + (LEGAL_PAGES[language] ?? LEGAL_PAGES.en)[page];
}
