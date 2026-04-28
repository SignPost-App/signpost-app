import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import am from './locales/am.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import nl from './locales/nl.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ht from './locales/ht.json';
import hi from './locales/hi.json';
import ig from './locales/ig.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import om from './locales/om.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import so from './locales/so.json';
import tl from './locales/tl.json';
import ti from './locales/ti.json';
import ak from './locales/ak.json';
import uk from './locales/uk.json';
import ur from './locales/ur.json';
import vi from './locales/vi.json';
import yo from './locales/yo.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'am', nativeName: 'አማርኛ' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'zh', nativeName: '中文' },
  { code: 'nl', nativeName: 'Nederlands' },
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'ht', nativeName: 'Kreyòl ayisyen' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'ig', nativeName: 'Igbo' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'om', nativeName: 'Afaan Oromoo' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'so', nativeName: 'Soomaali' },
  { code: 'es', nativeName: 'Español' },
  { code: 'tl', nativeName: 'Filipino' },
  { code: 'ti', nativeName: 'ትግርኛ' },
  { code: 'ak', nativeName: 'Twi' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'ur', nativeName: 'اردو' },
  { code: 'vi', nativeName: 'Tiếng Việt' },
  { code: 'yo', nativeName: 'Yorùbá' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      am: { translation: am },
      ar: { translation: ar },
      zh: { translation: zh },
      nl: { translation: nl },
      fr: { translation: fr },
      de: { translation: de },
      ht: { translation: ht },
      hi: { translation: hi },
      ig: { translation: ig },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      om: { translation: om },
      pl: { translation: pl },
      pt: { translation: pt },
      ru: { translation: ru },
      so: { translation: so },
      tl: { translation: tl },
      ti: { translation: ti },
      ak: { translation: ak },
      uk: { translation: uk },
      ur: { translation: ur },
      vi: { translation: vi },
      yo: { translation: yo },
    },
    fallbackLng: 'en',
    supportedLngs: [
      'en', 'es', 'am', 'ar', 'zh', 'nl', 'fr', 'de', 'ht', 'hi',
      'ig', 'it', 'ja', 'ko', 'om', 'pl', 'pt', 'ru', 'so', 'tl',
      'ti', 'ak', 'uk', 'ur', 'vi', 'yo',
    ],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'signpost-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
