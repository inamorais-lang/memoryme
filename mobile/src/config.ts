/**
 * App Store page of PetBubble. Known once the app exists in App Store Connect
 * (Phase 3). While empty, sharing sends only the picture.
 */
export const APP_STORE_URL = '';

/** Terms and privacy pages (GitHub Pages, from docs/legal in the repository). */
const LEGAL_BASE = 'https://inamorais-lang.github.io/memoryme/legal/';

export function legalUrl(page: 'terms' | 'privacy', language: string): string {
  const pt = language.startsWith('pt');
  if (page === 'terms') return LEGAL_BASE + (pt ? 'termos.html' : 'terms.html');
  return LEGAL_BASE + (pt ? 'privacidade.html' : 'privacy.html');
}
