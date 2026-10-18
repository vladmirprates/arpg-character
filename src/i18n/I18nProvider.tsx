import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { accent, pseudoize } from "./pseudo";
import { STRINGS, type StringKey } from "./strings";
import { LOCALES, type L, type Locale, type Localizer } from "./types";

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Pseudo-localization (localization testing): every string comes out accented and longer. */
  pseudo: boolean;
  setPseudo: (on: boolean) => void;
  /** UI string, with `{name}` placeholders filled from `vars`. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Picks the current locale from a content string. */
  l: (text: L) => string;
  /** { locale, l } for pure code that takes a Lang (item descriptions). */
  lang: Localizer;
  /** Formats a date for the current locale (pseudo-localized too, since month names are text). */
  date: (value: Date | string | number, options: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18n | null>(null);

function detectLocale(): Locale {
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
/** `?pseudo` in the URL turns it on, e.g. for a test run or a link in a localization bug report. */
const pseudoFromUrl = () => typeof location !== "undefined" && new URLSearchParams(location.search).has("pseudo");

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = usePersistentState<Locale>("locale", initialLocale ?? detectLocale(), isLocale);
  const [pseudo, setPseudo] = usePersistentState("pseudo", false, isBool);

  useEffect(() => {
    if (pseudoFromUrl()) setPseudo(true);
  }, [setPseudo]);

  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);

  const t = useCallback<I18n["t"]>(
    (key, vars) => {
      // Pseudo-localize the template, not the result: values passed in are localized on their own.
      const template = pseudo ? pseudoize(STRINGS[locale][key]) : STRINGS[locale][key];
      return vars ? template.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m)) : template;
    },
    [locale, pseudo],
  );
  const l = useCallback((text: L) => (pseudo ? pseudoize(text[locale], false) : text[locale]), [locale, pseudo]);
  const date = useCallback<I18n["date"]>(
    (value, options) => {
      const text = new Date(value).toLocaleString(locale === "pt" ? "pt-BR" : "en-GB", options);
      return pseudo ? accent(text) : text;
    },
    [locale, pseudo],
  );
  const lang = useMemo(() => ({ locale, l }), [locale, l]);

  const value = useMemo(
    () => ({ locale, setLocale, pseudo, setPseudo, t, l, lang, date }),
    [locale, setLocale, pseudo, setPseudo, t, l, lang, date],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
