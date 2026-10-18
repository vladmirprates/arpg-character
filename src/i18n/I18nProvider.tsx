import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { STRINGS, type StringKey } from "./strings";
import { LOCALES, type L, type Locale } from "./types";

interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** UI string, with `{name}` placeholders filled from `vars`. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Picks the current locale from a content string. */
  l: (text: L) => string;
}

const I18nContext = createContext<I18n | null>(null);

function detectLocale(): Locale {
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = usePersistentState<Locale>("locale", initialLocale ?? detectLocale(), isLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);

  const t = useCallback<I18n["t"]>(
    (key, vars) => {
      const template = STRINGS[locale][key];
      return vars ? template.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m)) : template;
    },
    [locale],
  );
  const l = useCallback((text: L) => text[locale], [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, l }), [locale, setLocale, t, l]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
