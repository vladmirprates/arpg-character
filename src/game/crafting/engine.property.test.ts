import fc from "fast-check";
import { createRng } from "../rng";
import { MAGIC_MAX_AFFIXES, MAX_AFFIXES, affixLimit, craft, createItem } from "./engine";
import { POOLS } from "./pools";
import { BASE_TYPES, ORB_IDS, type CraftItem } from "./types";

/**
 * Property-based tests: fast-check generates thousands of random orb sequences
 * and these invariants must hold after every single step.
 */
const arbBase = fc.constantFrom(...BASE_TYPES);
const arbOrbs = fc.array(fc.constantFrom(...ORB_IDS), { maxLength: 60 });
const arbSeed = fc.integer({ min: 0, max: 0xffffffff });

function assertInvariants(item: CraftItem) {
  const prefixes = item.affixes.filter((a) => a.kind === "prefix").length;
  const suffixes = item.affixes.filter((a) => a.kind === "suffix").length;
  const pool = POOLS[item.base];

  expect(item.affixes.length).toBeLessThanOrEqual(MAX_AFFIXES);
  expect(new Set(item.affixes.map((a) => a.id)).size).toBe(item.affixes.length);

  for (const affix of item.affixes) {
    const list = affix.kind === "prefix" ? pool.prefixes : pool.suffixes;
    expect(list.some((p) => p.id === affix.id)).toBe(true);
  }

  switch (item.rarity) {
    case "normal":
      expect(item.affixes).toHaveLength(0);
      expect(item.rareName).toBeNull();
      break;
    case "magic":
      expect(item.affixes.length).toBeLessThanOrEqual(MAGIC_MAX_AFFIXES);
      expect(prefixes).toBeLessThanOrEqual(affixLimit("magic"));
      expect(suffixes).toBeLessThanOrEqual(affixLimit("magic"));
      break;
    case "rare":
      expect(item.rareName).not.toBeNull();
      expect(prefixes).toBeLessThanOrEqual(affixLimit("rare"));
      expect(suffixes).toBeLessThanOrEqual(affixLimit("rare"));
      break;
    case "unique":
      expect(item.bricked).toBe(true);
      expect(item.corrupted).toBe(true);
      break;
  }

  if (item.bricked) expect(item.rarity).toBe("unique");
  if (item.implicitId) expect(item.corrupted).toBe(true);
}

describe("crafting invariants (property-based)", () => {
  test("no orb sequence can produce an illegal item", () => {
    fc.assert(
      fc.property(arbBase, arbOrbs, arbSeed, (base, orbs, seed) => {
        const rng = createRng(seed);
        let item = createItem(base);
        for (const orb of orbs) {
          const result = craft(item, orb, rng);
          if (result.ok) item = result.item;
          assertInvariants(item);
        }
      }),
      { numRuns: 500 },
    );
  });

  test("once corrupted, only scouring changes the item", () => {
    fc.assert(
      fc.property(arbBase, arbOrbs, arbSeed, (base, orbs, seed) => {
        const rng = createRng(seed);
        let item = createItem(base);
        for (const orb of orbs) {
          const result = craft(item, orb, rng);
          if (item.corrupted && orb !== "scouring") expect(result.ok).toBe(false);
          if (result.ok) item = result.item;
        }
      }),
      { numRuns: 300 },
    );
  });

  test("failed crafts consume no randomness (keeps replays stable)", () => {
    fc.assert(
      fc.property(arbBase, arbOrbs, arbSeed, (base, orbs, seed) => {
        const rng = createRng(seed);
        let item = createItem(base);
        for (const orb of orbs) {
          const before = rng.state;
          const result = craft(item, orb, rng);
          if (result.ok) item = result.item;
          else expect(rng.state).toBe(before);
        }
      }),
      { numRuns: 300 },
    );
  });
});
