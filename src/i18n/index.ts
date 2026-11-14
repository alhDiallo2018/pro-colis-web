// Initialisation i18next pour SENDPROCOLIS.
//
// La langue par défaut reste le français : toutes les écrans métier existants
// l'utilisent littéralement. L'infrastructure i18n est néanmoins installée
// pour que les nouvelles chaînes (shell, nav, settings) soient
// internationalisées, et pour permettre la migration progressive des écrans
// existants sans réintroduire de framework par la suite.
//
// Détection de langue : localStorage > navigator. Pas de détection
// serveur-side : le web est un SPA, la locale est purement côté client.
// Fallback explicite vers `fr`.

import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { wo } from './locales/wo'

export const SUPPORTED_LOCALES = ['fr', 'en', 'wo'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const LOCALE_STORAGE_KEY = 'procolis-locale'

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      wo: { translation: wo },
    },
    fallbackLng: 'fr',
    supportedLngs: [...SUPPORTED_LOCALES],
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    returnNull: false,
  })

// Garde `<html lang>` synchronisé avec la locale résolue. Les lecteurs d'écran
// et les moteurs de recherche s'appuient sur cet attribut.
if (typeof document !== 'undefined') {
  const sync = () => {
    const lang = i18next.resolvedLanguage ?? 'fr'
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang
  }
  sync()
  i18next.on('languageChanged', sync)
}

export { i18next }
