"use client";

import { createContext, useContext } from "react";
import { es, type TranslationKey } from "./translations/es";
import { en } from "./translations/en";

export type Locale = "es" | "en";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { es, en };

const I18nContext = createContext<Locale>("es");

export const I18nProvider = I18nContext.Provider;

export function useLocale(): Locale {
  return useContext(I18nContext);
}

export function useTranslation() {
  const locale = useLocale();
  const dict = dictionaries[locale];

  function t(key: TranslationKey): string {
    return dict[key] ?? key;
  }

  return { t, locale };
}

/** Detect browser preferred language, falling back to "es" */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  const lang = navigator.language?.slice(0, 2);
  return lang === "en" ? "en" : "es";
}
