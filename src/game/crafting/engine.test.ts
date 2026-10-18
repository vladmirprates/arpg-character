import { createRng } from "../rng";
import { scriptedRng } from "../../test/rng";
import { craft, createItem, replay } from "./engine";
import { POOLS } from "./pools";
import type { CraftItem, OrbId } from "./types";

const rng = () => createRng(1234);

function must(item: CraftItem, orb: OrbId, r = rng()) {
  const result = craft(item, orb, r);
  if (!result.ok) throw new Error(`Expected ${orb} to succeed, got ${result.error}`);
  return result;
}

const magic = (affixes: CraftItem["affixes"] = [{ kind: "prefix", id: "bug_p_urgent" }]): CraftItem => ({
  ...createItem("bug"),
  rarity: "magic",
  affixes,
});

const rare = (n: number): CraftItem => {
  const prefixes = POOLS.bug.prefixes.slice(0, Math.min(n, 3)).map((p) => ({ kind: "prefix" as const, id: p.id }));
  const suffixes = POOLS.bug.suffixes.slice(0, Math.max(0, n - 3)).map((s) => ({ kind: "suffix" as const, id: s.id }));
  return { ...createItem("bug"), rarity: "rare", rareName: [0, 0], affixes: [...prefixes, ...suffixes] };
};

describe("craft — rarity gates", () => {
  test.each<[OrbId, CraftItem, string]>([
    ["transmute", magic(), "mustBeNormal"],
    ["augmentation", createItem("bug"), "mustBeMagic"],
    ["alteration", rare(3), "mustBeMagic"],
    ["regal", createItem("bug"), "mustBeMagic"],
    ["chaos", magic(), "mustBeRare"],
    ["exalted", magic(), "mustBeRare"],
    ["annulment", createItem("bug"), "noMods"],
    ["vaal", createItem("bug"), "cannotCorrupt"],
    ["scouring", createItem("bug"), "alreadyNormal"],
  ])("%s on the wrong rarity fails with %s", (orb, item, error) => {
    expect(craft(item, orb, rng())).toEqual({ ok: false, error });
  });

  test("corrupted items reject every orb except scouring", () => {
    const corrupted = { ...magic(), corrupted: true };
    for (const orb of [
      "transmute",
      "augmentation",
      "alteration",
      "regal",
      "chaos",
      "exalted",
      "annulment",
      "vaal",
    ] as const) {
      expect(craft(corrupted, orb, rng())).toEqual({ ok: false, error: "corrupted" });
    }
    expect(must(corrupted, "scouring").item).toEqual(createItem("bug"));
  });
});

describe("craft — orb behaviour", () => {
  test("transmute makes a Normal item Magic with exactly one affix", () => {
    const { item, added } = must(createItem("bug"), "transmute");
    expect(item.rarity).toBe("magic");
    expect(item.affixes).toHaveLength(1);
    expect(added).toEqual([item.affixes[0]!.id]);
  });

  test("augmentation adds the missing affix kind and caps Magic at 2", () => {
    const { item } = must(magic(), "augmentation");
    expect(item.affixes.map((a) => a.kind).sort()).toEqual(["prefix", "suffix"]);
    expect(craft(item, "augmentation", rng())).toEqual({ ok: false, error: "magicMaxMods" });
  });

  test("alteration replaces one affix and keeps the count", () => {
    const start = magic([
      { kind: "prefix", id: "bug_p_urgent" },
      { kind: "suffix", id: "bug_s_friday" },
    ]);
    const { item } = must(start, "alteration");
    expect(item.affixes).toHaveLength(2);
  });

  test("alteration on an affix-less Magic item still adds one", () => {
    expect(must(magic([]), "alteration").item.affixes).toHaveLength(1);
  });

  test("regal upgrades Magic to Rare, names it and adds an affix", () => {
    const { item } = must(magic(), "regal");
    expect(item.rarity).toBe("rare");
    expect(item.rareName).not.toBeNull();
    expect(item.affixes).toHaveLength(2);
  });

  test("chaos keeps a Rare's affix count stable (remove 1, add 1)", () => {
    const { item } = must(rare(3), "chaos");
    expect(item.affixes).toHaveLength(3);
    expect(item.rarity).toBe("rare");
  });

  test("exalted adds to a Rare and refuses past 6 affixes", () => {
    expect(must(rare(5), "exalted").item.affixes).toHaveLength(6);
    expect(craft(rare(6), "exalted", rng())).toEqual({ ok: false, error: "maxMods" });
  });

  test("annulment removes one affix and downgrades to Normal when none remain", () => {
    expect(must(rare(3), "annulment").item.affixes).toHaveLength(2);
    const { item } = must(magic(), "annulment");
    expect(item).toMatchObject({ rarity: "normal", affixes: [], rareName: null });
  });

  test("craft never mutates its input", () => {
    const start = rare(4);
    const snapshot = structuredClone(start);
    for (const orb of ["chaos", "exalted", "annulment", "vaal", "scouring"] as const) craft(start, orb, rng());
    expect(start).toEqual(snapshot);
  });
});

describe("craft — Deployment Orb (vaal) outcomes", () => {
  test("roll < 1/3 adds an implicit from the base's pool", () => {
    // roll 0.1 → implicit, then pick index floor(0.5 * 3) = 1
    const result = must(magic(), "vaal", scriptedRng([0.1, 0.5]));
    expect(result.corruption).toBe("implicit");
    expect(result.item.corrupted).toBe(true);
    expect(result.item.implicitId).toBe(POOLS.bug.implicits[1]!.id);
  });

  test("1/3 ≤ roll < 2/3 rerolls between 1 and 3 affixes", () => {
    const result = must(rare(3), "vaal", createRng(7));
    if (result.corruption === "reroll") {
      expect(result.item.affixes).toHaveLength(3);
    }
    const forced = must(rare(3), "vaal", scriptedRng([0.5, 0.99, 0, 0, 0, 0, 0, 0]));
    expect(forced.corruption).toBe("reroll");
    expect(forced.item.affixes).toHaveLength(3);
    expect(forced.added).toHaveLength(3);
  });

  test("roll ≥ 2/3 bricks the item into the Undocumented Feature unique", () => {
    const result = must(rare(4), "vaal", scriptedRng([0.9]));
    expect(result.corruption).toBe("brick");
    expect(result.item).toMatchObject({ rarity: "unique", bricked: true, affixes: [], corrupted: true });
  });

  test("scouring restores a bricked item to its original base", () => {
    const bricked = must(rare(4), "vaal", scriptedRng([0.9])).item;
    expect(must(bricked, "scouring").item).toEqual(createItem("bug"));
  });
});

describe("replay", () => {
  test("same seed and orbs always produce the same item", () => {
    const orbs: OrbId[] = ["transmute", "augmentation", "regal", "exalted", "chaos", "vaal"];
    expect(replay("script", orbs, createRng(99))).toEqual(replay("script", orbs, createRng(99)));
  });

  test("different seeds diverge", () => {
    const orbs: OrbId[] = ["transmute", "augmentation", "regal", "exalted", "exalted"];
    const items = new Set(
      Array.from({ length: 20 }, (_, seed) => JSON.stringify(replay("bug", orbs, createRng(seed)))),
    );
    expect(items.size).toBeGreaterThan(1);
  });
});
