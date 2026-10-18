import { BACKPACK } from "../../data/equipment";
import { encodeRecipe } from "../../game/crafting/recipe";
import { SIZES, at, craftRef, defaultLayout, displayRef, move, normalize, place, quickMove, resolve } from "./items";

const code = encodeRecipe({ base: "bug", seed: 7, orbs: ["transmute"] });
const bag = (index: number) => ({ container: "bag" as const, index });
const stash = (index: number) => ({ container: "stash" as const, index });

describe("item layout", () => {
  test("starts with the bag's items in its first cells and migrates an old stash", () => {
    const layout = defaultLayout([code, null, code]);
    expect(layout.bag.slice(0, BACKPACK.length)).toEqual(BACKPACK.map((i) => displayRef(i.id)));
    expect(layout.stash[0]).toBe(`c:${code}`);
    expect(layout.stash[1]).toBeNull();
    expect(layout.stash[2]).toBe(`c:${code}`);
    expect(layout.stash).toHaveLength(SIZES.stash);
  });

  test("moving onto an empty cell moves; onto an item swaps", () => {
    const start = defaultLayout(null);
    const moved = move(start, bag(0), stash(5));
    expect(at(moved, stash(5))).toBe(start.bag[0]);
    expect(at(moved, bag(0))).toBeNull();

    const swapped = move(start, bag(0), bag(1));
    expect(at(swapped, bag(0))).toBe(start.bag[1]);
    expect(at(swapped, bag(1))).toBe(start.bag[0]);
  });

  test("Ctrl+click quick move goes to the first free cell of the other container", () => {
    const start = defaultLayout([code]);
    const result = quickMove(start, bag(0))!;
    expect(result.to).toEqual(stash(1));
    expect(at(result.layout, stash(1))).toBe(start.bag[0]);
  });

  test("a full container refuses new items", () => {
    let layout = defaultLayout(Array(SIZES.stash).fill(code));
    expect(place(layout, "stash", craftRef({ base: "bug", seed: 1, orbs: [] }))).toBeNull();
    expect(quickMove(layout, bag(0))).toBeNull();
    layout = move(layout, stash(0), bag(30));
    expect(place(layout, "stash", `c:${code}`)!.index).toBe(0);
  });

  test("tampered storage is cleaned: bad refs dropped, duplicate display items removed, bad shapes rejected", () => {
    const id = displayRef(BACKPACK[0]!.id);
    const clean = normalize({ bag: [id, id, "c:not-a-recipe", 42, "x:nope"], stash: [] })!;
    expect(clean.bag.slice(0, 5)).toEqual([id, null, null, null, null]);
    expect(clean.stash).toHaveLength(SIZES.stash);
    expect(normalize({ bag: Array(SIZES.bag + 1).fill(null), stash: [] })).toBeNull();
    expect(normalize("nope")).toBeNull();
  });

  test("duplicates survive only when explicitly allowed (the planted dupe bug)", () => {
    const id = displayRef(BACKPACK[0]!.id);
    expect(normalize({ bag: [id], stash: [id] })!.stash[0]).toBeNull();
    expect(normalize({ bag: [id], stash: [id] }, { allowDuplicates: true })!.stash[0]).toBe(id);
  });

  test("refs resolve to display items or re-cooked crafts", () => {
    expect(resolve(displayRef(BACKPACK[0]!.id))?.kind).toBe("display");
    expect(resolve(`c:${code}`)?.kind).toBe("craft");
    expect(resolve("d:unknown")).toBeNull();
  });
});
