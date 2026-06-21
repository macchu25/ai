"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

export type Language = 'vi' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Safely access localStorage after hydration to avoid SSR mismatch
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang === 'vi' || storedLang === 'en') {
      setLanguageState(storedLang);
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Vietnamese if not found in current language
        let fallbackValue: any = translations['vi'];
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            fallbackValue = undefined;
            break;
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : (defaultValue || key);
      }
    }

    return typeof value === 'string' ? value : (defaultValue || key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {/* To avoid hydration mismatches, we can render a loading skeleton or simply wait, 
          but rendering children immediately is fine since we start with the default 'vi' and adjust. */}
      {children}
    </LanguageContext.Provider>
  );
};
