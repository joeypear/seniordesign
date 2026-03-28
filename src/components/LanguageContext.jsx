import React, { createContext, useContext, useState } from 'react';
import en from '@/i18n/en';
import de from '@/i18n/de';
import es from '@/i18n/es';
import fr from '@/i18n/fr';
import ar from '@/i18n/ar';
import zh from '@/i18n/zh';
import pt from '@/i18n/pt';
import hi from '@/i18n/hi';

export const languages = {
  en: { label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  de: { label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  es: { label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  fr: { label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  ar: { label: 'العربية', flag: 'https://flagcdn.com/w40/sa.png', rtl: true },
  zh: { label: '中文', flag: 'https://flagcdn.com/w40/cn.png' },
  pt: { label: 'Português', flag: 'https://flagcdn.com/w40/br.png' },
  hi: { label: 'हिन्दी', flag: 'https://flagcdn.com/w40/in.png' },
};

export const translations = { en, de, es, fr, ar, zh, pt, hi };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('appLanguage') || 'en');

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const isRtl = languages[lang]?.rtl || false;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
