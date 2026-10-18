/**
 * Latin → Elder Futhark transliteration, so the sigil's runes actually say something.
 * Futhark has no letters for C, Q, V, X; they map to their sound-alikes, as is customary.
 */
const DIGRAPHS: [string, string][] = [
  ["TH", "ᚦ"],
  ["NG", "ᛜ"],
];

const LETTERS: Record<string, string> = {
  A: "ᚨ",
  B: "ᛒ",
  C: "ᚲ",
  D: "ᛞ",
  E: "ᛖ",
  F: "ᚠ",
  G: "ᚷ",
  H: "ᚺ",
  I: "ᛁ",
  J: "ᛃ",
  K: "ᚲ",
  L: "ᛚ",
  M: "ᛗ",
  N: "ᚾ",
  O: "ᛟ",
  P: "ᛈ",
  Q: "ᚲ",
  R: "ᚱ",
  S: "ᛊ",
  T: "ᛏ",
  U: "ᚢ",
  V: "ᚹ",
  W: "ᚹ",
  X: "ᚲᛊ",
  Y: "ᛃ",
  Z: "ᛉ",
};

/** Word separator used in runic inscriptions. */
export const RUNE_SEPARATOR = "᛫";

export function toRunes(text: string): string {
  let s = text.toUpperCase();
  for (const [latin, rune] of DIGRAPHS) s = s.replaceAll(latin, rune);
  return [...s].map((ch) => (ch === " " ? RUNE_SEPARATOR : (LETTERS[ch] ?? ch))).join("");
}

/** What the equipment sigil says, read clockwise from the left. */
export const SIGIL_INSCRIPTION = "Vladmir Prates · Quality Assurance · Trust but verify ·";
