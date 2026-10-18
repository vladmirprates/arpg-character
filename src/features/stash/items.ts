import { BACKPACK, type DisplayItem } from "../../data/equipment";
import { cook, decodeRecipe, encodeRecipe, type Recipe } from "../../game/crafting/recipe";
import type { CraftItem } from "../../game/crafting/types";

/**
 * Where every movable item lives: the 12 × 5 bag and the 8 × 3 stash tab. Each cell holds a ref —
 * "d:<id>" for one of the bag's display items, "c:<recipe code>" for a crafted item — or null.
 * Stored as refs, not item snapshots: crafted items are re-cooked from their recipe on load, so
 * tampered or outdated storage can never produce an illegal item.
 */
export type ContainerId = "bag" | "stash";
export const SIZES = { bag: 60, stash: 24 } as const;
export const COLUMNS = { bag: 12, stash: 8 } as const;

export type Ref = string;
export type Layout = Record<ContainerId, (Ref | null)[]>;
export interface Cell {
  container: ContainerId;
  index: number;
}

export type Placed =
  { kind: "display"; ref: Ref; item: DisplayItem } | { kind: "craft"; ref: Ref; recipe: Recipe; item: CraftItem };

const DISPLAY_BY_ID = new Map(BACKPACK.map((item) => [item.id, item]));
export const displayRef = (id: string): Ref => `d:${id}`;
export const craftRef = (recipe: Recipe): Ref => `c:${encodeRecipe(recipe)}`;

export function resolve(ref: Ref): Placed | null {
  if (ref.startsWith("d:")) {
    const item = DISPLAY_BY_ID.get(ref.slice(2));
    return item ? { kind: "display", ref, item } : null;
  }
  if (ref.startsWith("c:")) {
    const recipe = decodeRecipe(ref.slice(2));
    return recipe ? { kind: "craft", ref, recipe, item: cook(recipe) } : null;
  }
  return null;
}

const empty = (n: number) => Array.from({ length: n }, () => null as Ref | null);

/** The starting layout: the bag's display items in its first cells, plus any stash saved by older versions. */
export function defaultLayout(legacyStash: unknown): Layout {
  const bag = empty(SIZES.bag);
  BACKPACK.forEach((item, i) => (bag[i] = displayRef(item.id)));
  const stash = empty(SIZES.stash);
  if (Array.isArray(legacyStash)) {
    legacyStash.slice(0, SIZES.stash).forEach((code, i) => {
      if (typeof code === "string" && decodeRecipe(code)) stash[i] = `c:${code}`;
    });
  }
  return { bag, stash };
}

/** Validates untrusted storage: right shape, valid refs only, each display item at most once. */
/**
 * `allowDuplicates` is only for the Find the Bugs "dupe" bug, whose whole point is a duplicated item;
 * everywhere else a display item can exist once.
 */
export function normalize(raw: unknown, { allowDuplicates = false } = {}): Layout | null {
  if (typeof raw !== "object" || raw === null) return null;
  const seen = new Set<string>();
  const out = {} as Layout;
  for (const id of ["bag", "stash"] as const) {
    const list: unknown = (raw as Record<string, unknown>)[id];
    if (!Array.isArray(list) || list.length > SIZES[id]) return null;
    out[id] = empty(SIZES[id]).map((_, i) => {
      const ref: unknown = list[i];
      if (typeof ref !== "string" || !resolve(ref)) return null;
      if (ref.startsWith("d:") && !allowDuplicates) {
        if (seen.has(ref)) return null;
        seen.add(ref);
      }
      return ref;
    });
  }
  return out;
}

const copy = (layout: Layout): Layout => ({ bag: [...layout.bag], stash: [...layout.stash] });
export const at = (layout: Layout, cell: Cell) => layout[cell.container][cell.index] ?? null;
export const sameCell = (a: Cell, b: Cell) => a.container === b.container && a.index === b.index;

/** Moves the item at `from` to `to`; whatever was at `to` swaps into `from`. */
export function move(layout: Layout, from: Cell, to: Cell): Layout {
  if (sameCell(from, to) || !at(layout, from)) return layout;
  const next = copy(layout);
  const moving = next[from.container][from.index]!;
  next[from.container][from.index] = next[to.container][to.index] ?? null;
  next[to.container][to.index] = moving;
  return next;
}

export const firstFree = (list: (Ref | null)[]) => list.findIndex((ref) => ref === null);
export const other = (container: ContainerId): ContainerId => (container === "bag" ? "stash" : "bag");

/** PoE's Ctrl+click: send the item to the first free cell of the other container. */
export function quickMove(layout: Layout, from: Cell): { layout: Layout; to: Cell } | null {
  const target = other(from.container);
  const index = firstFree(layout[target]);
  if (index === -1 || !at(layout, from)) return null;
  const to = { container: target, index };
  return { layout: move(layout, from, to), to };
}

/** Puts a new ref in the first free cell of `container`. */
export function place(layout: Layout, container: ContainerId, ref: Ref): { layout: Layout; index: number } | null {
  const index = firstFree(layout[container]);
  if (index === -1) return null;
  const next = copy(layout);
  next[container][index] = ref;
  return { layout: next, index };
}

export function clear(layout: Layout, cell: Cell): Layout {
  const next = copy(layout);
  next[cell.container][cell.index] = null;
  return next;
}
