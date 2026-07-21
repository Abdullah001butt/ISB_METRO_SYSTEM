"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Lang, TranslationKey } from "@/lib/translations";

const STORAGE_KEY = "metrobus_lang";

type LanguageContextValue = {
  lang: Lang;
  toggle: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ur" || stored === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading persisted preference from localStorage on mount
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  function toggle() {
    const next = lang === "en" ? "ur" : "en";
    setLang(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: TranslationKey): string {
    return translations[key]?.[lang] ?? key;
  }

  return <LanguageContext.Provider value={{ lang, toggle, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
