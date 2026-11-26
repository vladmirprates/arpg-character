import { CUBE, CUBE_PLAN, CUBE_RECIPES, CUBE_RESULTS, findRecipe, type CubeRecipe } from "../../data/cube";
import { BACKPACK, stackLine, type DisplayItem } from "../../data/equipment";
import {
  ALTARS,
  BASE_PLAN,
  IDOLS,
  STARTING_ALTAR,
  STARTING_BAG,
  STARTING_IDOLS,
  type Altar,
  type Idol,
} from "../../data/idols";
import { cook, decodeRecipe, encodeRecipe, type Recipe } from "../../game/crafting/recipe";
import type { CraftItem } from "../../game/crafting/types";
import {
  SINGLE,
  candidateAnchors,
  empower,
  firstFit,
  fits,
  footprint,
  isEmpowered,
  openPlan,
  overlapping,
  type GridPlan,
  type Shape,
} from "../../game/idols/grid";

/**
 * Where every movable item lives: the 12 × 5 bag, the idol board with the altar socket above it, and
 * the 4 × 4 grid inside the Triage Cube. Items can span several cells in any grid. A ref is "d:<id>"
 * for a hand-written item or "c:<recipe code>" for a craft. Stored as refs, not item snapshots: crafted
 * items are re-cooked from their recipe on load, so tampered or outdated storage can never produce an
 * illegal item.
 */
export type GridId = "bag" | "idols" | "cube";
export type ContainerId = GridId | "altar";
export const BAG_COLUMNS = 12;
export const BAG_SIZE = 60;
const BAG_PLAN = openPlan(BAG_COLUMNS, BAG_SIZE / BAG_COLUMNS);
const LEGACY_STASH_SIZE = 24;

export type Ref = string;
export interface Placement {
  ref: Ref;
  /** The item's top-left cell. */
  index: number;
}
export interface Layout {
  /** One entry per bag cell: the ref sits on the item's top-left cell. */
  bag: (Ref | null)[];
  idols: Placement[];
  cube: Placement[];
  altar: Ref | null;
}
export interface Cell {
  container: ContainerId;
  index: number;
}
export interface Piece extends Placement {
  shape: Shape;
}

export type Placed =
  { kind: "display"; ref: Ref; item: DisplayItem } | { kind: "craft"; ref: Ref; recipe: Recipe; item: CraftItem };

/** Why a move was refused. */
export type Refusal = "empty" | "not-idol" | "not-altar" | "cube-in-cube" | "no-fit" | "bag-full";
export type MoveResult = { ok: true; layout: Layout; to: Cell } | { ok: false; reason: Refusal };

const refuse = (reason: Refusal) => ({ ok: false, reason }) as const;

/** Every idol, transmuted ones included: those exist only once made, but slot in like the rest. */
const IDOL_BY_ID = new Map<string, Idol>([...IDOLS, ...CUBE_RESULTS].map((idol) => [idol.id, idol]));
const ALTAR_BY_ID = new Map<string, Altar>(ALTARS.map((altar) => [altar.id, altar]));
/** Items that must always exist. Transmuted results don't: they exist once they've been made. */
const ALL_DISPLAY: readonly DisplayItem[] = [...BACKPACK, ...IDOLS, ...ALTARS, CUBE];
const DISPLAY_BY_ID = new Map<string, DisplayItem>([...ALL_DISPLAY, ...CUBE_RESULTS].map((item) => [item.id, item]));

export const displayRef = (id: string): Ref => `d:${id}`;
export const craftRef = (recipe: Recipe): Ref => `c:${encodeRecipe(recipe)}`;

const displayId = (ref: Ref) => (ref.startsWith("d:") ? ref.slice(2) : "");
export const idolOf = (ref: Ref) => IDOL_BY_ID.get(displayId(ref));
export const altarOf = (ref: Ref) => ALTAR_BY_ID.get(displayId(ref));
export const isCube = (ref: Ref) => displayId(ref) === CUBE.id;
export const shapeOf = (ref: Ref): Shape => DISPLAY_BY_ID.get(displayId(ref))?.shape ?? SINGLE;

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

/** The idol board's plan: the socketed altar's, or the base one. */
export const boardPlan = (altar: Ref | null): GridPlan => (altar && altarOf(altar)?.plan) || BASE_PLAN;

/** The plan of a container. The socket isn't a grid; it reports the bag's so callers needn't special-case it. */
export const planOf = (container: ContainerId, altar: Ref | null = null): GridPlan =>
  container === "idols" ? boardPlan(altar) : container === "cube" ? CUBE_PLAN : BAG_PLAN;

/** Whether a grid takes an item at all: only idols on the board, and anything but itself in the cube. */
const refusalFor = (grid: GridId, ref: Ref): Refusal | null => {
  if (grid === "idols" && !idolOf(ref)) return "not-idol";
  if (grid === "cube" && isCube(ref)) return "cube-in-cube";
  return null;
};

/** Every hand-written item that must exist. */
const ALL_DISPLAY_REFS = ALL_DISPLAY.map((item) => displayRef(item.id));

const toPiece = (p: Placement): Piece => ({ ...p, shape: shapeOf(p.ref) });

/** The pieces in a grid. */
export function piecesIn(layout: Layout, grid: GridId): Piece[] {
  if (grid === "bag") return layout.bag.flatMap((ref, index) => (ref ? [toPiece({ ref, index })] : []));
  return layout[grid].map(toPiece);
}

type Grids = Record<GridId, readonly Placement[]>;

const gridsOf = (layout: Layout): Record<GridId, Piece[]> => ({
  bag: piecesIn(layout, "bag"),
  idols: piecesIn(layout, "idols"),
  cube: piecesIn(layout, "cube"),
});

function build({ bag, idols, cube }: Grids, altar: Ref | null): Layout {
  const flat = Array.from({ length: BAG_SIZE }, () => null as Ref | null);
  for (const { ref, index } of bag) flat[index] = ref;
  const plain = (list: readonly Placement[]) => list.map(({ ref, index }) => ({ ref, index }));
  return { bag: flat, idols: plain(idols), cube: plain(cube), altar };
}

/** The piece covering a grid cell, if any. */
export function pieceAt(layout: Layout, cell: Cell): Piece | undefined {
  if (cell.container === "altar") return layout.altar ? toPiece({ ref: layout.altar, index: 0 }) : undefined;
  const plan = planOf(cell.container, layout.altar);
  return piecesIn(layout, cell.container).find((p) => footprint(plan, p.index, p.shape)?.includes(cell.index));
}

export const at = (layout: Layout, cell: Cell): Ref | null => pieceAt(layout, cell)?.ref ?? null;

const samePiece = (a: Placement, b: Placement) => a.ref === b.ref && a.index === b.index;

/** The starting layout, plus any crafts saved by the old stash-only versions. */
export function defaultLayout(legacyStash: unknown): Layout {
  const stash = Array.isArray(legacyStash)
    ? legacyStash.slice(0, LEGACY_STASH_SIZE).flatMap((code) => (typeof code === "string" ? [`c:${code}`] : []))
    : [];
  const bag = Array.from({ length: BAG_SIZE }, () => null as Ref | null);
  for (const { id, index } of STARTING_BAG) bag[index] = displayRef(id);
  return normalize({
    bag,
    altar: displayRef(STARTING_ALTAR),
    idols: STARTING_IDOLS.map(({ id, index }) => ({ ref: displayRef(id), index })),
    stash,
  })!;
}

/**
 * Validates untrusted storage. Accepts the current shape and the older { bag, stash } one, whose
 * stash contents move to the bag. The result is always legal: refs resolve, nothing overlaps, each
 * grid holds only what it takes, and every hand-written item exists exactly once (missing ones return
 * to the bag, space permitting).
 *
 * `allowDuplicates` is only for the Find the Bugs "dupe" bug, whose whole point is a duplicated idol.
 */
export function normalize(raw: unknown, { allowDuplicates = false } = {}): Layout | null {
  if (typeof raw !== "object" || raw === null) return null;
  const {
    bag: rawBag,
    idols: rawIdols,
    cube: rawCube,
    altar: rawAltar,
    stash: rawStash,
  } = raw as Record<string, unknown>;
  if (!Array.isArray(rawBag) || rawBag.length > BAG_SIZE) return null;
  if (rawStash !== undefined && (!Array.isArray(rawStash) || rawStash.length > LEGACY_STASH_SIZE)) return null;
  if (rawIdols !== undefined && !Array.isArray(rawIdols)) return null;
  if (rawCube !== undefined && !Array.isArray(rawCube)) return null;

  const seen = new Set<string>();
  const accept = (ref: string) => {
    if (!ref.startsWith("d:")) return true;
    if (!seen.has(ref)) {
      seen.add(ref);
      return true;
    }
    return allowDuplicates && !!idolOf(ref); // only an idol can be duplicated by the planted bug
  };

  // A save from before the idol board gets the default arrangement, altar included.
  const preBoard = rawIdols === undefined && rawAltar === undefined;
  const altar = preBoard
    ? displayRef(STARTING_ALTAR)
    : typeof rawAltar === "string" && altarOf(rawAltar)
      ? rawAltar
      : null;
  if (altar) seen.add(altar);

  const bag: Piece[] = [];
  rawBag.forEach((ref: unknown, index) => {
    if (typeof ref !== "string" || !resolve(ref)) return;
    const shape = shapeOf(ref);
    if (fits(BAG_PLAN, bag, index, shape) && accept(ref)) bag.push({ ref, index, shape });
  });

  const readGrid = (grid: "idols" | "cube", candidates: unknown[], plan: GridPlan) => {
    const pieces: Piece[] = [];
    for (const candidate of candidates) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const { ref, index } = candidate as { ref?: unknown; index?: unknown };
      if (typeof ref !== "string" || typeof index !== "number" || !resolve(ref) || refusalFor(grid, ref)) continue;
      const shape = shapeOf(ref);
      if (fits(plan, pieces, index, shape) && accept(ref)) pieces.push({ ref, index, shape });
    }
    return pieces;
  };
  const startingIdols = STARTING_IDOLS.map(({ id, index }) => ({ ref: displayRef(id), index }));
  const idols = readGrid("idols", rawIdols ?? startingIdols, boardPlan(altar));
  const cube = readGrid("cube", rawCube ?? [], CUBE_PLAN);

  const addToBag = (ref: string) => {
    const shape = shapeOf(ref);
    const index = firstFit(BAG_PLAN, bag, shape);
    if (index !== -1) bag.push({ ref, index, shape });
  };
  const stash = ((rawStash ?? []) as unknown[]).filter((r): r is string => typeof r === "string" && !!resolve(r));
  // Items the old stash held count as present, so they aren't restored and then added a second time.
  const inStash = new Set(stash);
  for (const ref of ALL_DISPLAY_REFS) if (!seen.has(ref) && !inStash.has(ref)) addToBag(ref);
  for (const ref of stash) if (accept(ref)) addToBag(ref);
  return build({ bag, idols, cube }, altar);
}

/**
 * Changes the socketed altar. Idols the new board can't hold go to the bag; if the bag can't take
 * them all, nothing changes.
 */
function withAltar(layout: Layout, altar: Ref | null, bag: Piece[]): MoveResult {
  const plan = boardPlan(altar);
  const kept: Piece[] = [];
  const nextBag = [...bag];
  for (const idol of piecesIn(layout, "idols")) {
    if (fits(plan, kept, idol.index, idol.shape)) {
      kept.push(idol);
      continue;
    }
    const spot = firstFit(BAG_PLAN, nextBag, idol.shape);
    if (spot === -1) return refuse("bag-full");
    nextBag.push({ ...idol, index: spot });
  }
  return {
    ok: true,
    layout: build({ bag: nextBag, idols: kept, cube: layout.cube }, altar),
    to: { container: "altar", index: 0 },
  };
}

function placeAltar(layout: Layout, piece: Piece, from: Cell): MoveResult {
  if (from.container !== "bag" || !altarOf(piece.ref)) return refuse("not-altar");
  const bag = piecesIn(layout, "bag").filter((p) => !samePiece(p, piece));
  // The altar it replaces takes the cell it came from.
  if (layout.altar) bag.push(toPiece({ ref: layout.altar, index: piece.index }));
  return withAltar(layout, piece.ref, bag);
}

function takeAltar(layout: Layout, piece: Piece, to: Cell): MoveResult {
  if (to.container === "idols") return refuse("not-idol");
  if (to.container !== "bag") return refuse("no-fit");
  const bag = piecesIn(layout, "bag");
  const there = pieceAt(layout, to);
  const anchors = candidateAnchors(BAG_PLAN, to.index, piece.shape);
  if (there && altarOf(there.ref)) return placeAltar(layout, there, { container: "bag", index: there.index });
  // Whatever sits on the cell moves over, as with any other drop.
  const rest = bag.filter((p) => !there || !samePiece(p, there));
  const placed = [...rest, { ...piece, index: anchors[0] ?? to.index }];
  if (there) {
    const spot = firstFit(BAG_PLAN, placed, there.shape);
    if (spot === -1) return refuse("bag-full");
    placed.push({ ...there, index: spot });
  }
  const result = withAltar(layout, null, placed);
  return result.ok ? { ...result, to } : result;
}

/**
 * Moves a piece to `to`. The target is the cell under the pointer: the piece takes the nearest legal
 * spot around it, and whatever it lands on is moved out of the way — back to where the piece came
 * from if it fits there, otherwise anywhere with room. A move is refused only when no arrangement
 * works, and a refusal changes nothing.
 */
export function moveItem(layout: Layout, from: Cell, to: Cell): MoveResult {
  const piece = pieceAt(layout, from);
  if (!piece) return refuse("empty");
  if (to.container === "altar") return placeAltar(layout, piece, from);
  if (from.container === "altar") return takeAltar(layout, piece, to);
  const refusal = refusalFor(to.container, piece.ref);
  if (refusal) return refuse(refusal);

  let failure: Refusal = "no-fit";
  for (const index of candidateAnchors(planOf(to.container, layout.altar), to.index, piece.shape)) {
    const attempt = placeAt(layout, piece, from.container, to.container, index);
    if (attempt.ok) return attempt;
    failure = attempt.reason;
  }
  return refuse(failure);
}

function placeAt(layout: Layout, piece: Piece, source: GridId, dest: GridId, index: number): MoveResult {
  const lists = gridsOf(layout);
  lists[source] = lists[source].filter((p) => !samePiece(p, piece));
  const displaced = overlapping(planOf(dest, layout.altar), lists[dest], index, piece.shape);
  lists[dest] = lists[dest].filter((p) => !displaced.includes(p));
  lists[dest].push({ ...piece, index });

  // Biggest first: they're the hardest to rehome.
  const queue = [...displaced].sort((a, b) => b.shape.w * b.shape.h - a.shape.w * a.shape.h);
  for (const item of queue) {
    let placed = false;
    for (const home of [source, "bag"] as const) {
      if (refusalFor(home, item.ref)) continue;
      const plan = planOf(home, layout.altar);
      // The spot the moved piece left behind comes first, so a plain swap stays a swap.
      const preferred = home === source && fits(plan, lists[home], piece.index, item.shape) ? piece.index : -1;
      const spot = preferred !== -1 ? preferred : firstFit(plan, lists[home], item.shape);
      if (spot === -1) continue;
      lists[home].push({ ...item, index: spot });
      placed = true;
      break;
    }
    if (!placed) return refuse("bag-full");
  }
  return { ok: true, layout: build(lists, layout.altar), to: { container: dest, index } };
}

/**
 * Ctrl+click: where an item would go by itself. From the bag that's the board or socket, or the cube
 * when its window is open (`toCube`); from anywhere else, back to the bag.
 */
function quickTarget(layout: Layout, from: Cell, toCube: boolean): Cell | Refusal {
  const piece = pieceAt(layout, from);
  if (!piece) return "empty";
  if (from.container !== "bag") {
    const index = firstFit(BAG_PLAN, piecesIn(layout, "bag"), piece.shape);
    return index === -1 ? "bag-full" : { container: "bag", index };
  }
  if (toCube) {
    if (isCube(piece.ref)) return "cube-in-cube";
    const index = firstFit(CUBE_PLAN, piecesIn(layout, "cube"), piece.shape);
    return index === -1 ? "no-fit" : { container: "cube", index };
  }
  if (altarOf(piece.ref)) return { container: "altar", index: 0 };
  if (!idolOf(piece.ref)) return "not-idol";
  const index = firstFit(boardPlan(layout.altar), piecesIn(layout, "idols"), piece.shape);
  return index === -1 ? "no-fit" : { container: "idols", index };
}

export function quickMove(layout: Layout, from: Cell, { toCube = false } = {}): MoveResult {
  const to = quickTarget(layout, from, toCube);
  if (typeof to === "string") return refuse(to);
  return moveItem(layout, from, to);
}

/** The planted "dupe" bug: Ctrl+click copies an idol across instead of moving it. */
export function duplicateAcross(layout: Layout, from: Cell): { layout: Layout; to: Cell; ref: Ref } | null {
  const ref = at(layout, from);
  const to = quickTarget(layout, from, false);
  if (!ref || !idolOf(ref) || typeof to === "string" || to.container === "altar") return null;
  const lists = gridsOf(layout);
  lists[to.container].push(toPiece({ ref, index: to.index }));
  return { layout: build(lists, layout.altar), to, ref };
}

/** Puts a new ref in the first bag spot it fits. */
export function place(layout: Layout, ref: Ref): { layout: Layout; index: number } | null {
  const lists = gridsOf(layout);
  const index = firstFit(BAG_PLAN, lists.bag, shapeOf(ref));
  if (index === -1) return null;
  lists.bag.push(toPiece({ ref, index }));
  return { layout: build(lists, layout.altar), index };
}

/** Swaps every copy of one ref for another, wherever it now sits. Both must have the same shape. */
export function replaceRef(layout: Layout, from: Ref, to: Ref): Layout {
  if (from === to) return layout;
  const swap = (ref: Ref | null) => (ref === from ? to : ref);
  const swapAll = (list: Placement[]) => list.map((p) => (p.ref === from ? { ...p, ref: to } : p));
  const next = {
    bag: layout.bag.map(swap),
    idols: swapAll(layout.idols),
    cube: swapAll(layout.cube),
    altar: swap(layout.altar),
  };
  const same =
    next.altar === layout.altar &&
    next.bag.every((r, i) => r === layout.bag[i]) &&
    next.idols.every((p, i) => p === layout.idols[i]) &&
    next.cube.every((p, i) => p === layout.cube[i]);
  return same ? layout : next;
}

export function clear(layout: Layout, cell: Cell): Layout {
  if (cell.container === "altar") return { ...layout, altar: null };
  const piece = pieceAt(layout, cell);
  if (!piece) return layout;
  const lists = gridsOf(layout);
  lists[cell.container] = lists[cell.container].filter((p) => !samePiece(p, piece));
  return build(lists, layout.altar);
}

/** Whether a transmuted result exists anywhere. A made result is never lost, so this is also "discovered". */
export function hasResult(layout: Layout, recipe: CubeRecipe): boolean {
  const ref = displayRef(recipe.result.id);
  return layout.bag.includes(ref) || layout.cube.some((p) => p.ref === ref);
}

/**
 * A currency as it stands now: one less for every recipe already made with it. Counting from the
 * results, rather than storing counts, means a tampered save can't refill a stack without also
 * losing what it made.
 */
export function stackedItem(item: DisplayItem, layout: Layout): DisplayItem {
  if (!item.stack || !item.maxStack) return item;
  const used = CUBE_RECIPES.filter((recipe) => recipe.inputs.includes(item.id) && hasResult(layout, recipe)).length;
  if (!used) return item;
  const stack = item.stack - used;
  return { ...item, stack, properties: [stackLine(stack, item.maxStack)] };
}

export type TransmuteResult =
  { ok: true; layout: Layout; recipe: CubeRecipe } | { ok: false; reason: "nothing" | "known" };

/**
 * The Transmute button. The cube must hold exactly a recipe's three currencies: each loses one from its
 * stack and stays where it is, and the result appears beside them. Anything else changes nothing.
 */
export function transmute(layout: Layout): TransmuteResult {
  const recipe = findRecipe(layout.cube.map((p) => displayId(p.ref)));
  if (!recipe) return { ok: false, reason: "nothing" };
  if (hasResult(layout, recipe)) return { ok: false, reason: "known" };
  const lists = gridsOf(layout);
  const result = toPiece({ ref: displayRef(recipe.result.id), index: 0 });
  // Only the three inputs are in here, so a 4 × 4 grid always has room.
  lists.cube.push({ ...result, index: firstFit(CUBE_PLAN, lists.cube, result.shape) });
  return { ok: true, layout: build(lists, layout.altar), recipe };
}

/** An idol as it works on the board: an empowered one has its resistances raised. */
export function effectiveIdol(idol: Idol, empowered: boolean): Idol {
  if (!empowered) return idol;
  const resists = Object.fromEntries(Object.entries(idol.resists ?? {}).map(([id, value]) => [id, empower(value)]));
  return { ...idol, resists };
}

/** The idols on the board as they currently work. */
export function boardIdols(layout: Layout) {
  const plan = boardPlan(layout.altar);
  return layout.idols.flatMap(({ ref, index }) => {
    const idol = idolOf(ref);
    if (!idol) return [];
    const empowered = isEmpowered(plan, index, idol.shape);
    return [{ ref, index, empowered, idol: effectiveIdol(idol, empowered) }];
  });
}
