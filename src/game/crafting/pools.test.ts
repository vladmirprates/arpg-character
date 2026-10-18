import { BASE_TYPES } from "./types";
import { BRICKED, POOLS, RARE_NAME_PARTS, getAffix, getImplicit } from "./pools";

const bilingual = (l: { en: string; pt: string }) => l.en.trim() !== "" && l.pt.trim() !== "";

describe("mod pools", () => {
  test("every base has prefixes, suffixes and implicits, all bilingual", () => {
    for (const base of BASE_TYPES) {
      const pool = POOLS[base];
      expect(pool.prefixes.length).toBeGreaterThan(0);
      expect(pool.suffixes.length).toBeGreaterThan(0);
      expect(pool.implicits.length).toBeGreaterThan(0);
      expect(bilingual(pool.baseName)).toBe(true);
      for (const affix of [...pool.prefixes, ...pool.suffixes]) {
        expect(bilingual(affix.effect)).toBe(true);
        expect(bilingual(affix.name)).toBe(true);
      }
      for (const implicit of pool.implicits) expect(bilingual(implicit.text)).toBe(true);
    }
  });

  test("affix and implicit ids are unique across every pool", () => {
    const ids = BASE_TYPES.flatMap((b) => [...POOLS[b].prefixes, ...POOLS[b].suffixes].map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
    const implicits = BASE_TYPES.flatMap((b) => POOLS[b].implicits.map((i) => i.id));
    expect(new Set(implicits).size).toBe(implicits.length);
  });

  test("lookups find every id and refuse unknown ones loudly", () => {
    for (const base of BASE_TYPES) {
      for (const affix of [...POOLS[base].prefixes, ...POOLS[base].suffixes]) expect(getAffix(affix.id)).toBe(affix);
      for (const implicit of POOLS[base].implicits) expect(getImplicit(implicit.id)).toBe(implicit.text);
    }
    expect(() => getAffix("nope")).toThrow('Unknown affix "nope"');
    expect(() => getImplicit("nope")).toThrow('Unknown implicit "nope"');
  });

  test("the bricked unique is fully translated; rare names have words to combine", () => {
    for (const line of [BRICKED.name, BRICKED.implicit, ...BRICKED.mods]) expect(bilingual(line)).toBe(true);
    expect(RARE_NAME_PARTS.adjectives.length).toBeGreaterThan(1);
    expect(RARE_NAME_PARTS.nouns.length).toBeGreaterThan(1);
  });
});
