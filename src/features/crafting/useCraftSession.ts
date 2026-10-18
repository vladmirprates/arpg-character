import { useCallback, useRef, useState } from "react";
import { craft, replay } from "../../game/crafting/engine";
import type { Recipe } from "../../game/crafting/recipe";
import { createRng, randomSeed } from "../../game/rng";
import type { BaseType, CraftError, CraftItem, CorruptionOutcome, OrbId } from "../../game/crafting/types";

export interface LogEntry {
  orb: OrbId;
  error?: CraftError;
  corruption?: CorruptionOutcome;
}

export interface CraftOutcome {
  ok: boolean;
  error?: CraftError;
  corruption?: CorruptionOutcome;
  added: string[];
  item: CraftItem;
}

export interface Session {
  recipe: Recipe;
  item: CraftItem;
  /** Every attempt, including failures — the raw material for the bug report. */
  log: LogEntry[];
  /** RNG stream position after the last craft; part of state so renders stay pure. */
  rngState: number;
}

export function startSession(recipe: Recipe): Session {
  const rng = createRng(recipe.seed);
  const item = replay(recipe.base, recipe.orbs, rng);
  return { recipe, item, log: recipe.orbs.map((orb) => ({ orb })), rngState: rng.state };
}

/** Pure transition: applies an orb to a session. The recipe only records successful orbs. */
export function applyOrb(session: Session, orb: OrbId): { session: Session; outcome: CraftOutcome } {
  const rng = createRng(session.rngState);
  const result = craft(session.item, orb, rng);
  if (!result.ok) {
    return {
      session: { ...session, log: [...session.log, { orb, error: result.error }] },
      outcome: { ok: false, error: result.error, added: [], item: session.item },
    };
  }
  return {
    session: {
      item: result.item,
      recipe: { ...session.recipe, orbs: [...session.recipe.orbs, orb] },
      log: [...session.log, result.corruption ? { orb, corruption: result.corruption } : { orb }],
      rngState: rng.state,
    },
    outcome: { ok: true, corruption: result.corruption, added: result.added, item: result.item },
  };
}

export function useCraftSession(initialBase: BaseType = "bug") {
  const [session, setSession] = useState(() => startSession({ base: initialBase, seed: randomSeed(), orbs: [] }));
  // Synchronous mirror so rapid clicks never craft on a stale item.
  const current = useRef(session);
  current.current = session;

  const commit = useCallback((next: Session) => {
    current.current = next;
    setSession(next);
  }, []);

  const load = useCallback((recipe: Recipe) => commit(startSession(recipe)), [commit]);
  const reset = useCallback((base: BaseType) => load({ base, seed: randomSeed(), orbs: [] }), [load]);

  const apply = useCallback(
    (orb: OrbId) => {
      const { session: next, outcome } = applyOrb(current.current, orb);
      commit(next);
      return outcome;
    },
    [commit],
  );

  return { ...session, apply, load, reset };
}
