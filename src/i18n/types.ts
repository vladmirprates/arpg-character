export type Locale = "en" | "pt";
export const LOCALES: readonly Locale[] = ["en", "pt"];

/** A localized string. Content data uses this so translations live next to the source text. */
export type L = Record<Locale, string>;
