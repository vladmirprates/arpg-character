import type { Rng } from "../game/rng";

/** Rng that replays a fixed script of values in [0, 1); throws if it runs out. */
export function scriptedRng(values: number[]): Rng {
  let i = 0;
  const next = () => {
    if (i >= values.length) throw new Error("scriptedRng exhausted");
    return values[i++]!;
  };
  const int = (max: number) => Math.floor(next() * max);
  return { next, int, pick: (list) => list[int(list.length)]!, state: 0 };
}
