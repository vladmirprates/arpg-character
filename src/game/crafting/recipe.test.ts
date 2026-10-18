import fc from "fast-check";
import { cook, decodeRecipe, encodeRecipe, type Recipe } from "./recipe";
import { describeItem, itemName, itemToText } from "./describe";
import { createItem } from "./engine";
import { BASE_TYPES, ORB_IDS } from "./types";

const arbRecipe: fc.Arbitrary<Recipe> = fc.record({
  base: fc.constantFrom(...BASE_TYPES),
  seed: fc.integer({ min: 0, max: 0xffffffff }),
  orbs: fc.array(fc.constantFrom(...ORB_IDS), { maxLength: 40 }),
});

describe("recipe share codes", () => {
  test("encode → decode round-trips any recipe", () => {
    fc.assert(
      fc.property(arbRecipe, (r) => {
        expect(decodeRecipe(encodeRecipe(r))).toEqual(r);
      }),
    );
  });

  test("decoded recipes cook to the identical item", () => {
    fc.assert(
      fc.property(arbRecipe, (r) => {
        expect(cook(decodeRecipe(encodeRecipe(r))!)).toEqual(cook(r));
      }),
      { numRuns: 200 },
    );
  });

  test.each(["", "nope", "sword.ff.01", "bug.zz.01", "bug.ff.9", "bug.123456789.0", "<script>.1.0"])(
    "rejects malformed code %j",
    (code) => expect(decodeRecipe(code)).toBeNull(),
  );
});

describe("item naming", () => {
  test("Normal items are 'Blank <base>' (EN) / '<base> em Branco' (PT)", () => {
    expect(itemName(createItem("testcase"), "en")).toBe("Blank Test Case");
    expect(itemName(createItem("testcase"), "pt")).toBe("Caso de Teste em Branco");
  });

  test("Magic names wrap the base with prefix/suffix, in locale word order", () => {
    const item = {
      ...createItem("bug"),
      rarity: "magic" as const,
      affixes: [
        { kind: "prefix" as const, id: "bug_p_urgent" },
        { kind: "suffix" as const, id: "bug_s_friday" },
      ],
    };
    expect(itemName(item, "en")).toBe("Urgent Bug Report of Friday");
    expect(itemName(item, "pt")).toBe("Relatório de Bug Urgente de Sexta-feira");
  });

  test("clipboard text follows the ARPG item block format", () => {
    const item = {
      ...createItem("bug"),
      rarity: "rare" as const,
      rareName: [0, 0] as [number, number],
      affixes: [{ kind: "prefix" as const, id: "bug_p_clean" }],
      corrupted: true,
    };
    expect(itemToText(describeItem(item, "en"), "Bug Report", "en")).toBe(
      [
        "Item Class: Bug Report",
        "Rarity: Rare",
        "Null Exception",
        "Bug Report",
        "--------",
        "+10% Readability",
        "--------",
        "Corrupted",
      ].join("\n"),
    );
  });
});
