/**
 * Spatial navigation: from the focused element, which one is "next" in a direction? This is how a
 * controller's D-pad moves around a UI that was laid out for a mouse.
 */
export type Direction = "up" | "down" | "left" | "right";

/** A rectangle in page coordinates (like a DOMRect). */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** How much a sideways offset costs compared with distance along the direction. */
const SIDEWAYS_WEIGHT = 2;

const centre = (b: Box) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });

/** Gap between two intervals; 0 when they overlap. */
const gap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, b0 - a1, a0 - b1);

/**
 * Scores `to` as a move from `from` in `dir`; lower is better, null when `to` isn't in that
 * direction at all. Distance along the direction counts edge to edge, and lining up sideways
 * (sharing a row for left/right, a column for up/down) is strongly preferred.
 */
export function moveScore(from: Box, to: Box, dir: Direction): number | null {
  const a = centre(from);
  const b = centre(to);
  const horizontal = dir === "left" || dir === "right";
  const sign = dir === "right" || dir === "down" ? 1 : -1;
  const along = horizontal ? (b.x - a.x) * sign : (b.y - a.y) * sign;
  if (along <= 0) return null;

  const fromRight = from.left + from.width;
  const fromBottom = from.top + from.height;
  const toRight = to.left + to.width;
  const toBottom = to.top + to.height;
  const distance = horizontal
    ? gap(from.left, fromRight, to.left, toRight)
    : gap(from.top, fromBottom, to.top, toBottom);
  const sideways = horizontal
    ? gap(from.top, fromBottom, to.top, toBottom)
    : gap(from.left, fromRight, to.left, toRight);
  // Centre distance breaks ties between equally placed candidates.
  return distance + sideways * SIDEWAYS_WEIGHT + Math.hypot(b.x - a.x, b.y - a.y) / 1000;
}

/** The best candidate in `dir`, or null when nothing lies that way. */
export function nearestInDirection<T>(
  from: Box,
  candidates: readonly { box: Box; item: T }[],
  dir: Direction,
): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const score = moveScore(from, c.box, dir);
    if (score !== null && score < bestScore) {
      best = c.item;
      bestScore = score;
    }
  }
  return best;
}
