import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import enUS from './locales/en-US';
import es from './locales/es';
import fr from './locales/fr';
import ptPT from './locales/pt-PT';

/** Language of the content (modes, scenes, AI lines). English is shared by the UK and the US. */
export type AppLanguage = 'pt-PT' | 'en' | 'es' | 'fr';

/** Language of the screens: English comes in British (base) and US spelling. */
type UiLanguage = AppLanguage | 'en-US';

/** Countries we sell in: picks which modes are offered. */
export type Market = 'PT' | 'ES' | 'FR' | 'GB' | 'US';

/** pt → PT-PT, es → Spanish, fr → French, en-GB (and other non-US English) → British; everything else → US English. */
export function detectLanguage(): UiLanguage {
  const locale = getLocales()[0];
  const code = locale?.languageCode?.toLowerCase();
  if (code === 'pt') return 'pt-PT';
  if (code === 'es') return 'es';
  if (code === 'fr') return 'fr';
  if (code === 'en' && locale?.regionCode && locale.regionCode !== 'US') return 'en';
  return 'en-US';
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    'pt-PT': { translation: ptPT },
    en: { translation: en },
    'en-US': { translation: enUS },
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: detectLanguage(),
  // US English only overrides a few spellings; the rest comes from the base English.
  fallbackLng: { 'en-US': ['en'], default: ['en'] },
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export function currentLanguage(): AppLanguage {
  const lng = i18n.language;
  if (lng === 'pt-PT' || lng === 'es' || lng === 'fr') return lng;
  return 'en';
}

export function currentMarket(): Market {
  const lng = currentLanguage();
  if (lng === 'pt-PT') return 'PT';
  if (lng === 'es') return 'ES';
  if (lng === 'fr') return 'FR';
  return i18n.language === 'en-US' ? 'US' : 'GB';
}

/** Spelling for English AI lines (colour/color). */
export function currentSpelling(): 'GB' | 'US' | undefined {
  if (currentLanguage() !== 'en') return undefined;
  return i18n.language === 'en-US' ? 'US' : 'GB';
}

export default i18n;
