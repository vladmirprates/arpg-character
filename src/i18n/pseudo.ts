/**
 * Pseudo-localization, the standard localization-testing pass: every translatable string is
 * replaced with an accented, ~35% longer version wrapped in markers, e.g.
 *
 *   "Skill Tree"  →  "⟦Šķîļļ Ţŕéé ~~~~⟧"
 *
 * Still readable, but it shows at a glance:
 *  - hardcoded strings: anything still in plain ASCII letters never went through the i18n layer;
 *  - clipped or overflowing text: the extra length is what longer languages (German, PT-BR) need;
 *  - concatenation: a sentence built from pieces shows several ⟦…⟧ pairs instead of one;
 *  - encoding / font problems: accented glyphs that a font can't draw show up as boxes.
 *
 * The markers are ⟦ ⟧ rather than [ ] because item text uses [ ] as markup (components/Markup).
 */
// prettier-ignore
const ACCENTED: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "î", j: "ĵ", k: "ķ", l: "ļ", m: "ɱ",
  n: "ñ", o: "ö", p: "þ", q: "ǫ", r: "ŕ", s: "š", t: "ţ", u: "û", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž",
  A: "Å", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Î", J: "Ĵ", K: "Ķ", L: "Ļ", M: "Ṁ",
  N: "Ñ", O: "Ö", P: "Þ", Q: "Ǫ", R: "Ŕ", S: "Š", T: "Ţ", U: "Û", V: "Ṽ", W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ž",
};

export const PSEUDO_OPEN = "⟦";
export const PSEUDO_CLOSE = "⟧";
/** How much longer the text gets: the usual budget for EN → DE / PT-BR expansion. */
export const EXPANSION = 0.35;

/** Accents letters only, without markers or padding: for text a locale formatter (Intl) produced. */
export const accent = (text: string) => text.replace(/[A-Za-z]/g, (c) => ACCENTED[c]!);

/**
 * Pseudo-localizes `text`. `{placeholder}` tokens (filled in later by t()) are kept as they are,
 * unless `keepPlaceholders` is false — content strings use {…} as highlight markup, not variables.
 */
export function pseudoize(text: string, keepPlaceholders = true): string {
  if (!text.trim()) return text;
  const body = keepPlaceholders
    ? text
        .split(/(\{\w+\})/)
        .map((part, i) => (i % 2 ? part : accent(part)))
        .join("")
    : accent(text);
  const pad = "~".repeat(Math.max(1, Math.round(text.length * EXPANSION)));
  return `${PSEUDO_OPEN}${body} ${pad}${PSEUDO_CLOSE}`;
}
