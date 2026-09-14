/**
 * i18n/index.ts — Translation helper and hook for NitiSaathi.
 */
import { useAuth } from '../context/AuthContext';
import { translations, Language, TranslationSchema } from './translations';

export { translations, Language, TranslationSchema };

export const useTranslation = () => {
  const { language, setLanguage } = useAuth();
  const t: TranslationSchema = translations[language] || translations.hi;

  return {
    t,
    language,
    setLanguage,
  };
};

export const getTranslation = (lang: Language = 'hi'): TranslationSchema => {
  return translations[lang] || translations.hi;
};
