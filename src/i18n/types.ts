export type Locale = "en" | "pt";
export const LOCALES: readonly Locale[] = ["en", "pt"];

/** A localized string. Content data uses this so translations live next to the source text. */
export type L = Record<Locale, string>;

/** A locale plus the function that reads content in it: useI18n().lang, which also pseudo-localizes. */
export interface Localizer {
  locale: Locale;
  l: (text: L) => string;
}

/** Pure code takes either: a bare locale (tests, generated reports) or the UI's localizer. */
export type Lang = Locale | Localizer;

export const localizer = (lang: Lang): Localizer =>
  typeof lang === "string" ? { locale: lang, l: (text) => text[lang] } : lang;
