import type { CorruptionOutcome, Rarity } from "./crafting/types";

/**
 * Gameplay events, like a game's telemetry stream. Features report what the player did; listeners
 * (achievements today) decide what it means. Features never need to know who is listening.
 */
export type GameEvent =
  | { type: "bug.found"; id: string }
  | { type: "bounty.complete" }
  | { type: "craft"; rarity: Rarity; corruption?: CorruptionOutcome }
  | { type: "card.read"; id: string }
  | { type: "item.copied" }
  | { type: "locale.changed" }
  | { type: "pseudo.enabled" }
  | { type: "perf.opened" }
  | { type: "gamepad.connected" }
  | { type: "cert.opened" };

type Listener = (event: GameEvent) => void;
const listeners = new Set<Listener>();

export function track(event: GameEvent): void {
  for (const listener of [...listeners]) listener(event);
}

/** Returns the unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
