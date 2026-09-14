import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { getProfile, saveProfile } from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('language_pref') || 'en';
  });

  // Sync with profile on mount
  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.data?.profile?.language_pref) {
          const pref = res.data.profile.language_pref;
          setLang(pref);
          localStorage.setItem('language_pref', pref);
        }
      })
      .catch(() => {});
  }, []);

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    localStorage.setItem('language_pref', newLang);
    try {
      await saveProfile({ language_pref: newLang });
    } catch (_) {}
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      changeLanguage: () => {},
      t: translations.en,
    };
  }
  return ctx;
};
