import type { Direction } from "./spatial";

/**
 * Controller input → UI actions, for the browser's "standard" gamepad layout (Xbox / PlayStation /
 * Switch Pro all report it): https://w3c.github.io/gamepad/#remapping
 *
 * Pure and frame-driven: give it this frame's buttons and sticks plus last frame's memory and it
 * returns the actions to perform. That makes held-button repeat and stick dead zones unit-testable
 * without a controller.
 */
export type PadAction =
  Direction | "confirm" | "back" | "menu" | "overlay" | "skill1" | "skill2" | "skill3" | "skill4" | "skill5";

/** Standard-layout button index → action. */
export const BUTTONS: Readonly<Record<number, PadAction>> = {
  0: "confirm", // A / Cross
  1: "back", // B / Circle
  2: "skill1", // X / Square
  3: "skill2", // Y / Triangle
  4: "skill3", // LB / L1
  5: "skill4", // RB / R1
  7: "skill5", // RT / R2
  8: "overlay", // View / Share / Select
  9: "menu", // Menu / Options / Start
  12: "up",
  13: "down",
  14: "left",
  15: "right",
};

const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

/** Left-stick travel needed to count as a D-pad press. */
export const STICK_THRESHOLD = 0.5;
/** Right-stick travel ignored as drift. */
export const SCROLL_DEADZONE = 0.2;
/** Held directions repeat, like a held arrow key: first after this delay, then at this rate. */
export const REPEAT_DELAY_MS = 400;
export const REPEAT_RATE_MS = 120;
/** Pixels scrolled per frame at full right-stick tilt. */
export const SCROLL_SPEED = 18;

export interface PadInput {
  buttons: readonly boolean[];
  /** [left x, left y, right x, right y], each −1…1 (y is down-positive). */
  axes: readonly number[];
}

/** Held actions → when they next fire. */
export type PadMemory = Readonly<Partial<Record<PadAction, number>>>;

export interface PadFrame {
  actions: PadAction[];
  memory: PadMemory;
  /** Right-stick scroll for this frame, in pixels. */
  scroll: { x: number; y: number };
}

/** The actions held down this frame (D-pad and left stick both give directions). */
export function heldActions({ buttons, axes }: PadInput): Set<PadAction> {
  const held = new Set<PadAction>();
  buttons.forEach((pressed, i) => {
    const action = BUTTONS[i];
    if (pressed && action) held.add(action);
  });
  const [lx = 0, ly = 0] = axes;
  if (lx <= -STICK_THRESHOLD) held.add("left");
  if (lx >= STICK_THRESHOLD) held.add("right");
  if (ly <= -STICK_THRESHOLD) held.add("up");
  if (ly >= STICK_THRESHOLD) held.add("down");
  return held;
}

/** Scales stick travel past the dead zone to 0…1, keeping its sign. */
export function deadzone(v: number, zone = SCROLL_DEADZONE): number {
  if (Math.abs(v) <= zone) return 0;
  return (Math.sign(v) * (Math.abs(v) - zone)) / (1 - zone);
}

export function readPad(input: PadInput, memory: PadMemory, now: number): PadFrame {
  const held = heldActions(input);
  const actions: PadAction[] = [];
  const next: Partial<Record<PadAction, number>> = {};

  for (const action of held) {
    const due = memory[action];
    const repeats = DIRECTIONS.includes(action as Direction);
    if (due === undefined) {
      // Newly pressed: fire now. Directions repeat while held; buttons fire once per press.
      actions.push(action);
      next[action] = repeats ? now + REPEAT_DELAY_MS : Infinity;
    } else if (now >= due) {
      actions.push(action);
      next[action] = now + REPEAT_RATE_MS;
    } else {
      next[action] = due;
    }
  }

  const [, , rx = 0, ry = 0] = input.axes;
  return {
    actions,
    memory: next,
    scroll: { x: deadzone(rx) * SCROLL_SPEED, y: deadzone(ry) * SCROLL_SPEED },
  };
}

/** "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e …)" → "Xbox Wireless Controller". */
export function padName(id: string): string {
  return id.replace(/\s*\(.*$/, "").trim() || id;
}
