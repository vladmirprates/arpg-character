import type { GameEvent } from "./events";

/**
 * An achievement is a rule over the event stream. `match` returns:
 *  - false: the event doesn't count;
 *  - true: it counts once (one step towards `target`);
 *  - a string: it counts as that distinct key, so repeats of the same key don't add progress
 *    (e.g. reading the same card twice still counts one card).
 * `requiresAll` makes a meta-achievement that unlocks once every other one has.
 */
export interface AchievementRule {
  id: string;
  match?: (event: GameEvent) => boolean | string;
  /** Steps needed; 1 when omitted. */
  target?: number;
  requiresAll?: boolean;
}

export interface AchievementState {
  /** Achievement id → when it unlocked (epoch ms). */
  unlocked: Record<string, number>;
  /** Achievement id → distinct keys counted so far, for multi-step achievements. */
  progress: Record<string, string[]>;
}

export const EMPTY_ACHIEVEMENTS: AchievementState = { unlocked: {}, progress: {} };

export const targetOf = (rule: AchievementRule) => rule.target ?? 1;

/** Steps done towards a rule, capped at its target. */
export function progressOf(state: AchievementState, rule: AchievementRule): number {
  if (state.unlocked[rule.id] !== undefined) return targetOf(rule);
  return Math.min(targetOf(rule), state.progress[rule.id]?.length ?? 0);
}

/**
 * Applies one event. Returns the new state (the same object when nothing changed, so React can
 * skip a render) and the ids unlocked by this event, in rule order.
 */
export function applyEvent(
  state: AchievementState,
  event: GameEvent,
  rules: readonly AchievementRule[],
  now: number,
): { state: AchievementState; unlocked: string[] } {
  let unlocked = state.unlocked;
  let progress = state.progress;
  const fresh: string[] = [];

  for (const rule of rules) {
    if (rule.requiresAll || !rule.match || unlocked[rule.id] !== undefined) continue;
    const hit = rule.match(event);
    if (hit === false) continue;
    const seen = progress[rule.id] ?? [];
    // `true` counts as a new step every time; a string key counts once.
    const key = hit === true ? String(seen.length) : hit;
    if (seen.includes(key)) continue;
    const next = [...seen, key];
    if (next.length >= targetOf(rule)) {
      unlocked = { ...unlocked, [rule.id]: now };
      const { [rule.id]: _, ...rest } = progress;
      progress = rest;
      fresh.push(rule.id);
    } else {
      progress = { ...progress, [rule.id]: next };
    }
  }

  // Meta-achievements: unlock once every non-meta rule is done.
  if (fresh.length) {
    const others = rules.filter((r) => !r.requiresAll);
    for (const rule of rules) {
      if (!rule.requiresAll || unlocked[rule.id] !== undefined) continue;
      if (others.every((r) => unlocked[r.id] !== undefined)) {
        unlocked = { ...unlocked, [rule.id]: now };
        fresh.push(rule.id);
      }
    }
  }

  if (unlocked === state.unlocked && progress === state.progress) return { state, unlocked: [] };
  return { state: { unlocked, progress }, unlocked: fresh };
}

/** Stored data is untrusted: validate its shape before using it. */
export function isAchievementState(v: unknown): v is AchievementState {
  if (typeof v !== "object" || v === null) return false;
  const { unlocked, progress } = v as AchievementState;
  if (typeof unlocked !== "object" || unlocked === null || Array.isArray(unlocked)) return false;
  if (typeof progress !== "object" || progress === null || Array.isArray(progress)) return false;
  return (
    Object.values(unlocked).every((t) => typeof t === "number" && Number.isFinite(t)) &&
    Object.values(progress).every((keys) => Array.isArray(keys) && keys.every((k) => typeof k === "string"))
  );
}
