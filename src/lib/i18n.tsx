"use client";

import * as React from "react";

export type Language = "en" | "uk";

const LANGUAGE_KEY = "moneyok:language";
const LANGUAGE_EVENT = "moneyok:language-change";

function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(LANGUAGE_KEY) === "uk" ? "uk" : "en";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_EVENT, onStoreChange);
  };
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  text: (english: string, ukrainian: string) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = React.useSyncExternalStore(subscribe, getLanguage, () => "en" as Language);

  const setLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  };

  const text = (english: string, ukrainian: string) =>
    language === "uk" ? ukrainian : english;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, text }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }
  return context;
}
