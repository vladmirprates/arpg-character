/**
 * Seeded PRNG (mulberry32). The whole state is a single uint32, so a craft can be
 * replayed exactly from `seed + orb sequence` — the basis for repro links.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, max). */
  int(max: number): number;
  pick<T>(list: readonly T[]): T;
  /** Current internal state; feed back into createRng to resume the stream. */
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number) => Math.floor(next() * max);
  return {
    next,
    int,
    pick: (list) => {
      if (list.length === 0) throw new Error("Cannot pick from an empty list");
      return list[int(list.length)]!;
    },
    get state() {
      return s;
    },
  };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
