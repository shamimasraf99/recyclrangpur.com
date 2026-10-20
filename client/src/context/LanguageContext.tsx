import React, { createContext, useContext, useState, useEffect } from 'react';
import bnDict from '../i18n/bn.json';
import enDict from '../i18n/en.json';
import { Language } from '../../../shared/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  formatNumber: (num: number | string) => string;
  formatPrice: (amount: number) => string;
}

const dictionaries: Record<Language, any> = {
  bn: bnDict,
  en: enDict
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bikroybd_lang');
    return (saved === 'en' ? 'en' : 'bn') as Language;
  });

  useEffect(() => {
    localStorage.setItem('bikroybd_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current = dictionaries[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  };

  const formatNumber = (num: number | string): string => {
    if (language === 'en') return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  const formatPrice = (amount: number): string => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
    return `৳ ${formatNumber(formatted)}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
