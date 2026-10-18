import type { Rng } from "../rng";
import { POOLS, RARE_NAME_PARTS } from "./pools";
import type { Affix, BaseType, CorruptionOutcome, CraftItem, CraftResult, OrbId, Rarity } from "./types";

export const MAX_AFFIXES = 6;
export const MAGIC_MAX_AFFIXES = 2;

/** Max prefixes (and, separately, max suffixes) for a rarity. */
export function affixLimit(rarity: Rarity): number {
  return rarity === "magic" ? 1 : 3;
}

export function createItem(base: BaseType): CraftItem {
  return {
    base,
    rarity: "normal",
    affixes: [],
    implicitId: null,
    rareName: null,
    corrupted: false,
    bricked: false,
  };
}

/**
 * Applies an orb to an item. Pure: never mutates `item`; all randomness comes from `rng`,
 * so the same seed + orb sequence always produces the same item.
 */
export function craft(item: CraftItem, orb: OrbId, rng: Rng): CraftResult {
  if (item.corrupted && orb !== "scouring") return { ok: false, error: "corrupted" };

  const next: CraftItem = { ...item, affixes: [...item.affixes] };
  const added: string[] = [];
  const add = (limit: number) => {
    const id = addRandomAffix(next, limit, rng);
    if (id) added.push(id);
  };
  const ok = (corruption?: CorruptionOutcome): CraftResult =>
    corruption ? { ok: true, item: next, added, corruption } : { ok: true, item: next, added };

  switch (orb) {
    case "transmute": {
      if (item.rarity !== "normal") return { ok: false, error: "mustBeNormal" };
      next.rarity = "magic";
      add(1);
      return ok();
    }
    case "augmentation": {
      if (item.rarity !== "magic") return { ok: false, error: "mustBeMagic" };
      if (item.affixes.length >= MAGIC_MAX_AFFIXES) return { ok: false, error: "magicMaxMods" };
      add(1);
      return ok();
    }
    case "alteration": {
      if (item.rarity !== "magic") return { ok: false, error: "mustBeMagic" };
      removeRandomAffix(next, rng);
      add(1);
      return ok();
    }
    case "regal": {
      if (item.rarity !== "magic") return { ok: false, error: "mustBeMagic" };
      next.rarity = "rare";
      next.rareName = rollRareName(rng);
      add(3);
      return ok();
    }
    case "chaos": {
      if (item.rarity !== "rare") return { ok: false, error: "mustBeRare" };
      removeRandomAffix(next, rng);
      add(3);
      next.rareName = rollRareName(rng);
      return ok();
    }
    case "exalted": {
      if (item.rarity !== "rare") return { ok: false, error: "mustBeRare" };
      if (item.affixes.length >= MAX_AFFIXES) return { ok: false, error: "maxMods" };
      add(3);
      return ok();
    }
    case "annulment": {
      if (item.affixes.length === 0) return { ok: false, error: "noMods" };
      removeRandomAffix(next, rng);
      if (next.affixes.length === 0) {
        next.rarity = "normal";
        next.rareName = null;
      }
      return ok();
    }
    case "vaal": {
      if (item.rarity === "normal") return { ok: false, error: "cannotCorrupt" };
      return ok(corrupt(next, rng, added));
    }
    case "scouring": {
      if (item.rarity === "normal" && !item.corrupted) return { ok: false, error: "alreadyNormal" };
      return { ok: true, item: createItem(item.base), added: [] };
    }
  }
}

/** Replays an orb sequence from a fresh item. Failed orbs are no-ops and consume no randomness. */
export function replay(base: BaseType, orbs: readonly OrbId[], rng: Rng): CraftItem {
  let item = createItem(base);
  for (const orb of orbs) {
    const result = craft(item, orb, rng);
    if (result.ok) item = result.item;
  }
  return item;
}

function addRandomAffix(item: CraftItem, limit: number, rng: Rng): string | null {
  const pool = POOLS[item.base];
  const taken = new Set(item.affixes.map((x) => x.id));
  const count = (kind: Affix["kind"]) => item.affixes.filter((x) => x.kind === kind).length;

  const candidates: Affix[] = [];
  if (count("prefix") < limit) {
    for (const p of pool.prefixes) if (!taken.has(p.id)) candidates.push({ kind: "prefix", id: p.id });
  }
  if (count("suffix") < limit) {
    for (const s of pool.suffixes) if (!taken.has(s.id)) candidates.push({ kind: "suffix", id: s.id });
  }
  if (candidates.length === 0) return null;

  const pick = rng.pick(candidates);
  item.affixes.push(pick);
  return pick.id;
}

function removeRandomAffix(item: CraftItem, rng: Rng): void {
  if (item.affixes.length === 0) return;
  item.affixes.splice(rng.int(item.affixes.length), 1);
}

function rollRareName(rng: Rng): [number, number] {
  return [rng.int(RARE_NAME_PARTS.adjectives.length), rng.int(RARE_NAME_PARTS.nouns.length)];
}

/** Deployment Orb: three equally likely outcomes. Mutates the (already copied) item. */
function corrupt(item: CraftItem, rng: Rng, added: string[]): CorruptionOutcome {
  item.corrupted = true;
  const roll = rng.next();

  if (roll < 1 / 3) {
    item.implicitId = rng.pick(POOLS[item.base].implicits).id;
    return "implicit";
  }

  if (roll < 2 / 3) {
    const rerolls = item.affixes.length === 0 ? 0 : rng.int(Math.min(3, item.affixes.length)) + 1;
    const limit = affixLimit(item.rarity);
    for (let i = 0; i < rerolls; i++) {
      removeRandomAffix(item, rng);
      const id = addRandomAffix(item, limit, rng);
      if (id) added.push(id);
    }
    return "reroll";
  }

  item.rarity = "unique";
  item.bricked = true;
  item.rareName = null;
  item.affixes = [];
  item.implicitId = null;
  return "brick";
}
