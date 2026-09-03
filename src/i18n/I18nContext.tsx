import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations } from './translations';
import type { Language } from '@/types';

type TranslationType = (typeof translations)['en'];

interface I18nContextType {
  lang: Language;
  t: TranslationType;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const requested = new URLSearchParams(window.location.search).get('lang') as Language | null;
    if (requested && ['pt', 'en', 'de'].includes(requested)) return requested;
    const saved = localStorage.getItem('hybridtracker-lang') as Language;
    if (saved && ['pt', 'en', 'de'].includes(saved)) return saved;
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('pt')) return 'pt';
    if (browserLanguage.startsWith('de')) return 'de';
    return 'en';
  });

  const t = translations[lang] as TranslationType;

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('hybridtracker-lang', newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    localStorage.setItem('hybridtracker-lang', lang);
  }, [lang]);

  useEffect(() => {
    const syncAccountLanguage = (event: Event) => {
      const accountLanguage = (event as CustomEvent<Language>).detail;
      if (accountLanguage && ['pt', 'en', 'de'].includes(accountLanguage)) setLang(accountLanguage);
    };
    window.addEventListener('hybridtracker-language', syncAccountLanguage);
    return () => window.removeEventListener('hybridtracker-language', syncAccountLanguage);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, setLang: handleSetLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
