import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Recipe } from "../../game/crafting/recipe";
import { readStored, usePersistentState } from "../../hooks/usePersistentState";
import { useBounty } from "../bounty/BountyProvider";
import {
  SIZES,
  at,
  clear,
  craftRef,
  defaultLayout,
  move,
  normalize,
  place,
  other,
  quickMove,
  resolve,
  sameCell,
  type Cell,
  type ContainerId,
  type Layout,
  type Placed,
} from "./items";

export const STASH_SIZE = SIZES.stash;

interface Items {
  cells: Record<ContainerId, (Placed | null)[]>;
  /** The item picked up with a click or Enter, waiting to be placed. */
  held: Cell | null;
  pickUp: (cell: Cell) => void;
  /** Places the held item (or `from`, for a drag) on `to`, swapping with whatever is there. */
  dropOn: (to: Cell, from?: Cell) => void;
  /** Ctrl+click: sends the item to the other container. Returns false when that one is full. */
  quickMove: (cell: Cell) => boolean;
  cancel: () => void;
  remove: (cell: Cell) => void;
  /** Saves a crafted recipe into the first free stash cell; returns the index or -1 when full. */
  save: (recipe: Recipe) => number;
  announce: (message: string) => void;
}

const ItemsContext = createContext<Items | null>(null);

const isLayout = (v: unknown): v is Layout => normalize(v) !== null;
const isLegacy = (v: unknown): v is unknown[] => Array.isArray(v);

/** Bag and stash contents, persisted together so items can move freely between them. */
export function StashProvider({ children }: { children: ReactNode }) {
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
  const [message, setMessage] = useState("");

  const cells = useMemo(
    () => ({
      bag: layout.bag.map((ref) => (ref ? resolve(ref) : null)),
      stash: layout.stash.map((ref) => (ref ? resolve(ref) : null)),
    }),
    [layout],
  );

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

  const pickUp = useCallback((cell: Cell) => {
    if (at(latest.current, cell)) setHeld(cell);
  }, []);

  const dropOn = useCallback(
    (to: Cell, from?: Cell) => {
      const source = from ?? held;
      setHeld(null);
      if (!source || sameCell(source, to)) return;
      commit(move(latest.current, source, to));
    },
    [held, commit],
  );

  const quick = useCallback(
    (cell: Cell) => {
      setHeld(null);
      // Find the Bugs, "dupe": while planted, the item is copied across instead of moved.
      if (bounty.isPlanted("dupe")) {
        const ref = at(latest.current, cell);
        const copy = ref ? place(latest.current, other(cell.container), ref) : null;
        if (!copy) return false;
        commit(copy.layout);
        bounty.addEvidence("dupe", `${other(cell.container)}:${copy.index}|${ref}`);
        return true;
      }
      const result = quickMove(latest.current, cell);
      if (!result) return false;
      commit(result.layout);
      return true;
    },
    [commit, bounty],
  );

  const save = useCallback(
    (recipe: Recipe) => {
      // Find the Bugs, "stale-save": while planted, the stash gets the item one orb earlier.
      const stale = bounty.isPlanted("stale-save") && recipe.orbs.length > 0;
      const saved = stale ? { ...recipe, orbs: recipe.orbs.slice(0, -1) } : recipe;
      const ref = craftRef(saved);
      const result = place(latest.current, "stash", ref);
      if (!result) return -1;
      commit(result.layout);
      if (stale) bounty.addEvidence("stale-save", ref);
      return result.index;
    },
    [commit, bounty],
  );

  // Once the dupe bug is fixed (found, or the hunt given up), the copies it made disappear.
  const dupes = bounty.evidence("dupe");
  const dupePlanted = bounty.isPlanted("dupe");
  useEffect(() => {
    if (dupePlanted || dupes.length === 0) return;
    let next = latest.current;
    for (const key of dupes) {
      const [where, ref] = key.split("|") as [string, string];
      const [container, index] = where.split(":") as [ContainerId, string];
      const cell = { container, index: Number(index) };
      if (at(next, cell) === ref) next = clear(next, cell);
    }
    if (next !== latest.current) commit(next);
    bounty.clearEvidence("dupe");
  }, [dupePlanted, dupes, commit, bounty]);

  // Stale saves stay (that's what was saved); their evidence goes once the bug is fixed.
  const staleSaves = bounty.evidence("stale-save");
  const stalePlanted = bounty.isPlanted("stale-save");
  useEffect(() => {
    if (!stalePlanted && staleSaves.length > 0) bounty.clearEvidence("stale-save");
  }, [stalePlanted, staleSaves, bounty]);

  const remove = useCallback((cell: Cell) => commit(clear(latest.current, cell)), [commit]);
  const cancel = useCallback(() => setHeld(null), []);

  const value = useMemo(
    () => ({ cells, held, pickUp, dropOn, quickMove: quick, cancel, remove, save, announce: setMessage }),
    [cells, held, pickUp, dropOn, quick, cancel, remove, save],
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
  if (!ctx) throw new Error("useItems must be used inside <StashProvider>");
  return ctx;
}

/** The crafting bench only needs to save into the stash. */
export const useStash = () => {
  const { save } = useItems();
  return { save };
};
