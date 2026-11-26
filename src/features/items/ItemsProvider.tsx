import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Idol } from "../../data/idols";
import type { GridPlan } from "../../game/idols/grid";
import type { Recipe } from "../../game/crafting/recipe";
import { track } from "../../game/events";
import { readStored, usePersistentState } from "../../hooks/usePersistentState";
import { useBounty } from "../bounty/BountyProvider";
import {
  at,
  boardIdols,
  boardPlan,
  clear,
  craftRef,
  defaultLayout,
  duplicateAcross,
  moveItem,
  normalize,
  pieceAt,
  piecesIn,
  place,
  replaceRef,
  quickMove,
  resolve,
  stackedItem,
  transmute,
  type TransmuteResult,
  type Cell,
  type ContainerId,
  type GridId,
  type Layout,
  type Piece,
  type Placed,
  type Refusal,
} from "./items";

export type GridPiece = Piece & { placed: Placed; empowered: boolean };

/** What Ctrl+click reports: where the item went, or why it couldn't. */
export type QuickResult = { to: ContainerId } | { reason: Refusal };

interface Items {
  layout: Layout;
  pieces: Record<GridId, GridPiece[]>;
  /** The socketed altar, and the board it makes. */
  altar: Placed | null;
  plan: GridPlan;
  /** The idols on the board: what the character sheet counts. */
  equippedIdols: Idol[];
  /** The item picked up with a click or Enter, waiting to be placed. */
  held: Cell | null;
  /** The item being dragged or held: what the grids preview. */
  carrying: Cell | null;
  setDragging: (cell: Cell | null) => void;
  placedAt: (cell: Cell) => Placed | null;
  pickUp: (cell: Cell) => void;
  /**
   * Places the held item (or `from`, for a drag) on `to`. A refused item stays held, so another
   * cell can be tried; the reason comes back for the caller to explain.
   */
  dropOn: (to: Cell, from?: Cell) => Refusal | null;
  /** Ctrl+click: sends an idol between the bag and the board, or an altar to and from its socket. */
  quickMove: (cell: Cell, options?: { toCube?: boolean }) => QuickResult;
  /** The cube's Transmute button. */
  transmute: () => TransmuteResult;
  cancel: () => void;
  remove: (cell: Cell) => void;
  /** Saves a crafted recipe into the first free bag cell; returns the index or -1 when full. */
  save: (recipe: Recipe) => number;
  announce: (message: string) => void;
}

const ItemsContext = createContext<Items | null>(null);

const isLayout = (v: unknown): v is Layout => normalize(v) !== null;
const isLegacy = (v: unknown): v is unknown[] => Array.isArray(v);

/** Pieces ready to draw: resolved, with currency showing its current stack. */
const withPlaced = (list: Piece[], layout: Layout): GridPiece[] =>
  list.flatMap((piece) => {
    const placed = resolve(piece.ref);
    if (!placed) return [];
    const shown = placed.kind === "display" ? { ...placed, item: stackedItem(placed.item, layout) } : placed;
    return [{ ...piece, placed: shown, empowered: false }];
  });

/** Bag and idol board, persisted together so items can move freely between them. */
export function ItemsProvider({ children }: { children: ReactNode }) {
  // Older versions stored only the stash, as recipe codes: carried over on first load.
  const [initial] = useState(() => defaultLayout(readStored("stash", isLegacy)));
  const [stored, setStored] = usePersistentState("items", initial, isLayout);
  const bounty = useBounty();
  // While the planted dupe bug is active its duplicates must survive; otherwise they're cleaned up.
  const allowDuplicates = bounty.isPlanted("dupe");
  const layout = useMemo(() => normalize(stored, { allowDuplicates }) ?? initial, [stored, initial, allowDuplicates]);
  const latest = useRef(layout);
  latest.current = layout;
  const [held, setHeld] = useState<Cell | null>(null);
  const [dragging, setDragging] = useState<Cell | null>(null);
  const [message, setMessage] = useState("");

  const board = useMemo(() => boardIdols(layout), [layout]);
  const pieces = useMemo(
    () => ({
      bag: withPlaced(piecesIn(layout, "bag"), layout),
      cube: withPlaced(piecesIn(layout, "cube"), layout),
      // On the board an idol is shown as it works there, empowered or not.
      idols: withPlaced(piecesIn(layout, "idols"), layout).map((piece) => {
        const entry = board.find((b) => b.ref === piece.ref && b.index === piece.index);
        return entry
          ? {
              ...piece,
              empowered: entry.empowered,
              placed: { kind: "display" as const, ref: piece.ref, item: entry.idol },
            }
          : piece;
      }),
    }),
    [layout, board],
  );
  const equippedIdols = useMemo(() => board.map((entry) => entry.idol), [board]);
  const altar = useMemo(() => (layout.altar ? resolve(layout.altar) : null), [layout]);
  const plan = useMemo(() => boardPlan(layout.altar), [layout]);

  const commit = useCallback(
    (next: Layout) => {
      latest.current = next;
      setStored(next);
    },
    [setStored],
  );

  // Esc puts a held item back (and must not close anything else while it does).
  useEffect(() => {
    if (!held) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setHeld(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [held]);

  const placedAt = useCallback((cell: Cell) => {
    const ref = at(latest.current, cell);
    return ref ? resolve(ref) : null;
  }, []);

  const pickUp = useCallback((cell: Cell) => {
    if (at(latest.current, cell)) setHeld(cell);
  }, []);

  const dropOn = useCallback(
    (to: Cell, from?: Cell) => {
      const source = from ?? held;
      if (!source) return null;
      // Clicking the held item again puts it back; dragging it onto itself can still shift it.
      if (!from && source.container === to.container && to.container !== "altar") {
        const target = pieceAt(latest.current, to);
        if (target && target.index === source.index) {
          setHeld(null);
          return null;
        }
      }
      const result = moveItem(latest.current, source, to);
      if (!result.ok) return result.reason;
      setHeld(null);
      commit(result.layout);
      return null;
    },
    [held, commit],
  );

  const quick = useCallback(
    (cell: Cell, { toCube = false } = {}): QuickResult => {
      setHeld(null);
      // Find the Bugs, "dupe": while planted, an idol is copied across instead of moved.
      const copy = bounty.isPlanted("dupe") && !toCube ? duplicateAcross(latest.current, cell) : null;
      if (copy) {
        commit(copy.layout);
        bounty.addEvidence("dupe", `${copy.to.container}:${copy.to.index}|${copy.ref}`);
        return { to: copy.to.container };
      }
      const result = quickMove(latest.current, cell, { toCube });
      if (!result.ok) return { reason: result.reason };
      commit(result.layout);
      return { to: result.to.container };
    },
    [commit, bounty],
  );

  const save = useCallback(
    (recipe: Recipe) => {
      // Find the Bugs, "stale-save": while planted, the bag gets the item one orb earlier.
      const stale = bounty.isPlanted("stale-save") && recipe.orbs.length > 0;
      const saved = stale ? { ...recipe, orbs: recipe.orbs.slice(0, -1) } : recipe;
      const ref = craftRef(saved);
      const result = place(latest.current, ref);
      if (!result) return -1;
      commit(result.layout);
      // The evidence keeps what was crafted too, so fixing the bug can repair the saved item.
      if (stale) bounty.addEvidence("stale-save", `${ref}|${craftRef(recipe)}`);
      return result.index;
    },
    [commit, bounty],
  );

  // Once the dupe bug is fixed (found, or the hunt given up), the copies it made disappear. This
  // starts from the stored layout: the cleaned-up one has already dropped either copy of each idol.
  const dupes = bounty.evidence("dupe");
  const dupePlanted = bounty.isPlanted("dupe");
  useEffect(() => {
    if (dupePlanted || dupes.length === 0) return;
    const start = normalize(stored, { allowDuplicates: true }) ?? latest.current;
    let next = start;
    for (const key of dupes) {
      const [where, ref] = key.split("|") as [string, string];
      const [container, index] = where.split(":") as [ContainerId, string];
      const cell = { container, index: Number(index) };
      if (at(next, cell) === ref) next = clear(next, cell);
    }
    if (next !== start) commit(next);
    bounty.clearEvidence("dupe");
  }, [dupePlanted, dupes, stored, commit, bounty]);

  // Once the stale-save bug is fixed (found, or the hunt given up), each item it saved stale is
  // repaired into what was actually crafted, wherever it has been moved since.
  const staleSaves = bounty.evidence("stale-save");
  const stalePlanted = bounty.isPlanted("stale-save");
  useEffect(() => {
    if (stalePlanted || staleSaves.length === 0) return;
    let next = latest.current;
    for (const key of staleSaves) {
      const [saved, crafted] = key.split("|") as [string, string | undefined];
      if (crafted) next = replaceRef(next, saved, crafted);
    }
    if (next !== latest.current) commit(next);
    bounty.clearEvidence("stale-save");
  }, [stalePlanted, staleSaves, commit, bounty]);

  const doTransmute = useCallback(() => {
    const result = transmute(latest.current);
    if (result.ok) {
      setHeld(null);
      commit(result.layout);
      track({ type: "cube.recipe", id: result.recipe.id });
    }
    return result;
  }, [commit]);

  const remove = useCallback((cell: Cell) => commit(clear(latest.current, cell)), [commit]);
  const cancel = useCallback(() => setHeld(null), []);

  const value = useMemo(
    () => ({
      layout,
      pieces,
      altar,
      plan,
      equippedIdols,
      held,
      carrying: held ?? dragging,
      setDragging,
      placedAt,
      pickUp,
      dropOn,
      quickMove: quick,
      transmute: doTransmute,
      cancel,
      remove,
      save,
      announce: setMessage,
    }),
    [
      layout,
      pieces,
      altar,
      plan,
      equippedIdols,
      held,
      dragging,
      placedAt,
      pickUp,
      dropOn,
      quick,
      doTransmute,
      cancel,
      remove,
      save,
    ],
  );
  return (
    <ItemsContext.Provider value={value}>
      {children}
      <p className="visually-hidden" aria-live="polite" data-testid="items-status">
        {message}
      </p>
    </ItemsContext.Provider>
  );
}

export function useItems(): Items {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used inside <ItemsProvider>");
  return ctx;
}
