import { createRng } from "../rng";
import { replay } from "./engine";
import { BASE_TYPES, ORB_IDS, type BaseType, type CraftItem, type OrbId } from "./types";

/**
 * A craft is fully described by its base, seed and the orbs applied in order.
 * That makes every item reproducible — the "steps to reproduce" of the crafting bench.
 */
export interface Recipe {
  base: BaseType;
  seed: number;
  orbs: OrbId[];
}

export function cook(recipe: Recipe): CraftItem {
  return replay(recipe.base, recipe.orbs, createRng(recipe.seed));
}

/** Compact, URL-safe form: `bug.1a2b3c.0124` (base, hex seed, one char per orb). */
export function encodeRecipe(recipe: Recipe): string {
  const orbs = recipe.orbs.map((o) => ORB_IDS.indexOf(o).toString(36)).join("");
  return `${recipe.base}.${recipe.seed.toString(16)}.${orbs}`;
}

/**
 * The most orbs a share link may carry. Far beyond any real craft, and small enough that a
 * hand-made link can't freeze the recipient's tab by replaying (and logging) a million orbs.
 */
export const MAX_SHARED_ORBS = 500;

export function decodeRecipe(code: string): Recipe | null {
  const match = /^([a-z]+)\.([0-9a-f]{1,8})\.([0-8]*)$/.exec(code.trim());
  if (!match) return null;
  const [, base, seedHex, orbChars] = match;
  if (orbChars!.length > MAX_SHARED_ORBS) return null;
  if (!BASE_TYPES.includes(base as BaseType)) return null;
  const orbs = [...orbChars!].map((c) => ORB_IDS[parseInt(c, 36)]!);
  return { base: base as BaseType, seed: parseInt(seedHex!, 16) >>> 0, orbs };
}
