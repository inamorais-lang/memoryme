import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ptPT from './locales/pt-PT';

export type AppLanguage = 'pt-PT' | 'en';

/** Portuguese speakers get PT-PT for now; everyone else gets English. */
export function detectLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'pt' ? 'pt-PT' : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    'pt-PT': { translation: ptPT },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

/** Which cast of personalities to offer: Portugal, the US or the UK. */
export type Market = 'PT' | 'US' | 'GB';

export function currentMarket(): Market {
  if (currentLanguage() === 'pt-PT') return 'PT';
  return getLocales()[0]?.regionCode === 'GB' ? 'GB' : 'US';
}

export function currentLanguage(): AppLanguage {
  return i18n.language === 'pt-PT' ? 'pt-PT' : 'en';
}

export default i18n;
