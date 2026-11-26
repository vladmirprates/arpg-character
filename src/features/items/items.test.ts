import fc from "fast-check";
import { CUBE, CUBE_RECIPES } from "../../data/cube";
import { BACKPACK } from "../../data/equipment";
import { ALTARS, IDOLS, STARTING_ALTAR, STARTING_BAG, STARTING_IDOLS } from "../../data/idols";
import { RULES_LAYOUT } from "../../test/itemsFixture";
import { encodeRecipe } from "../../game/crafting/recipe";
import { footprint } from "../../game/idols/grid";
import {
  BAG_SIZE,
  at,
  boardIdols,
  boardPlan,
  clear,
  craftRef,
  defaultLayout,
  displayRef,
  duplicateAcross,
  moveItem,
  normalize,
  pieceAt,
  piecesIn,
  place,
  planOf,
  quickMove,
  replaceRef,
  resolve,
  stackedItem,
  transmute,
  type Cell,
  type ContainerId,
  type Layout,
} from "./items";

const code = encodeRecipe({ base: "bug", seed: 7, orbs: ["transmute"] });
const bag = (index: number): Cell => ({ container: "bag", index });
const board = (index: number): Cell => ({ container: "idols", index });
const socket: Cell = { container: "altar", index: 0 };
const ref = (id: string) => displayRef(id);

const bagCellOf = (layout: Layout, id: string) => bag(layout.bag.indexOf(ref(id)));
/** Rules are tested on a fixed arrangement, so the site's default can change freely. */
const start = () => normalize(RULES_LAYOUT)!;
const moved = (layout: Layout, from: Cell, to: Cell) => {
  const result = moveItem(layout, from, to);
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result.layout;
};

const ALL_DISPLAY = [...BACKPACK, ...IDOLS, ...ALTARS, CUBE].map((i) => ref(i.id));
const refsIn = (layout: Layout) =>
  [...layout.bag, ...layout.idols.map((p) => p.ref), ...layout.cube.map((p) => p.ref), layout.altar].filter(
    (r): r is string => r !== null,
  );

/** No overlaps, nothing off a grid, nothing on a blocked cell. */
function expectLegal(layout: Layout) {
  for (const container of ["bag", "idols", "cube"] as const) {
    const plan = planOf(container, layout.altar);
    const seen = new Set<number>();
    for (const piece of piecesIn(layout, container)) {
      const cells = footprint(plan, piece.index, piece.shape);
      expect(cells, `${piece.ref} at ${piece.index}`).not.toBeNull();
      for (const c of cells!) {
        expect(plan.blocked.has(c), `${piece.ref} on blocked ${c}`).toBe(false);
        expect(seen.has(c), `${piece.ref} overlaps at ${c}`).toBe(false);
        seen.add(c);
      }
    }
  }
}

describe("starting layout", () => {
  test("is the chosen arrangement: altar socketed, idols placed, currency along the top of the bag", () => {
    const layout = defaultLayout(null);
    expect(layout.altar).toBe(ref(STARTING_ALTAR));
    expect(layout.bag.slice(0, BACKPACK.length)).toEqual(BACKPACK.map((i) => ref(i.id)));
    expect(layout.idols).toEqual(STARTING_IDOLS.map(({ id, index }) => ({ ref: ref(id), index })));
    for (const { id, index } of STARTING_BAG) expect(at(layout, bag(index)), id).toBe(ref(id));
    expect(refsIn(layout).sort()).toEqual([...ALL_DISPLAY].sort());
    expectLegal(layout);
  });

  test("its arrangement is what was asked for, cell by cell", () => {
    const layout = defaultLayout(null);
    const expected: Record<number, string> = {
      1: "idol-playthrough",
      2: "idol-exploration",
      5: "idol-patch-notes",
      9: "idol-regression",
      10: "idol-cassandra",
      17: "idol-reproduction",
      18: "idol-telemetry",
      21: "idol-sisyphus",
    };
    for (const [index, id] of Object.entries(expected)) expect(at(layout, board(Number(index)))).toBe(ref(id));
    expect(at(layout, board(13))).toBeNull(); // the one free cell
  });

  test("leaves the bag's crafts room: a kept item lands right after the currency", () => {
    expect(place(defaultLayout(null), `c:${code}`)!.index).toBe(BACKPACK.length);
  });

  test("crafts from the very old stash-only save move into the bag", () => {
    const layout = defaultLayout([code, null, code]);
    expect(layout.bag.filter((r) => r === `c:${code}`)).toHaveLength(2);
  });
});

describe("the bag", () => {
  test("idols keep their real size in it", () => {
    const layout = start();
    const release = bagCellOf(layout, "idol-release"); // 4×1
    expect(at(layout, bag(release.index + 3))).toBe(ref("idol-release"));
    const playthrough = bagCellOf(layout, "idol-playthrough"); // 1×4
    expect(at(layout, bag(playthrough.index + 36))).toBe(ref("idol-playthrough"));
    const cube = bagCellOf(layout, CUBE.id); // 2×2
    expect(at(layout, bag(cube.index + 13))).toBe(ref(CUBE.id));
  });

  test("moving onto an empty cell moves; onto an item swaps", () => {
    const layout = start();
    const one = moved(layout, bag(0), bag(40));
    expect(at(one, bag(40))).toBe(layout.bag[0]);
    expect(at(one, bag(0))).toBeNull();

    const two = moved(layout, bag(0), bag(1));
    expect(at(two, bag(0))).toBe(layout.bag[1]);
    expect(at(two, bag(1))).toBe(layout.bag[0]);
  });

  test("a wide item moved over others pushes them out of the way, and nothing is lost", () => {
    const layout = start();
    const next = moved(layout, bagCellOf(layout, "idol-release"), bag(1));
    expect(at(next, bag(1))).toBe(ref("idol-release"));
    expect(refsIn(next).sort()).toEqual(refsIn(layout).sort());
    expectLegal(next);
  });

  test("new crafts take the first free cell, skipping cells under big items", () => {
    const layout = start();
    const placed = place(layout, `c:${code}`)!;
    expect(pieceAt(layout, bag(placed.index))).toBeUndefined();
  });

  test("a full bag refuses new items", () => {
    const full = { ...start(), bag: Array(BAG_SIZE).fill(`c:${code}`) };
    expect(place(full, craftRef({ base: "bug", seed: 1, orbs: [] }))).toBeNull();
  });
});

describe("the idol board", () => {
  test("only idols go on it", () => {
    const layout = start();
    expect(moveItem(layout, bag(0), board(7))).toEqual({ ok: false, reason: "not-idol" });
    const crafted = place(layout, `c:${code}`)!;
    expect(moveItem(crafted.layout, bag(crafted.index), board(7))).toEqual({ ok: false, reason: "not-idol" });
  });

  test("an idol from the bag lands where it fits and leaves the bag", () => {
    const layout = start();
    const from = bagCellOf(layout, "idol-patch-notes");
    const next = moved(layout, from, board(7));
    expect(at(next, board(7))).toBe(ref("idol-patch-notes"));
    expect(at(next, from)).toBeNull();
  });

  test("any covered cell reports the idol on it", () => {
    const layout = start();
    expect(at(layout, board(5))).toBe(ref("idol-regression"));
    expect(at(layout, board(15))).toBe(ref("idol-regression")); // its third cell
    expect(at(layout, board(7))).toBeNull();
  });

  test("the square idol replaces the long one: the long one moves, nothing is refused", () => {
    // 2×2 Exploration dropped on the 1×3 Regression, on each of its three cells.
    for (const target of [5, 10, 15]) {
      const layout = start();
      const result = moveItem(layout, board(8), board(target));
      expect(result.ok, `dropped on ${target}`).toBe(true);
      if (!result.ok) continue;
      const covered = footprint(boardPlan(null), result.to.index, { w: 2, h: 2 })!;
      expect(covered).toContain(target);
      expect(refsIn(result.layout).sort()).toEqual(refsIn(layout).sort());
      expectLegal(result.layout);
    }
  });

  test("a plain swap stays a swap: the other idol takes the old spot when it fits", () => {
    const layout = start();
    const next = moved(layout, board(6), board(7 + 9)); // 1×1 onto the 2×1 at 16
    expect(at(next, board(16))).toBe(ref("idol-reproduction"));
    const swapped = moved(start(), bagCellOf(start(), "idol-patch-notes"), board(6));
    expect(at(swapped, board(6))).toBe(ref("idol-patch-notes"));
    expect(at(swapped, bagCellOf(start(), "idol-patch-notes"))).toBe(ref("idol-reproduction"));
  });

  test("a displaced idol that fits nowhere on the board goes to the bag instead of blocking the move", () => {
    const layout = start();
    const release = bagCellOf(layout, "idol-release"); // 4×1 across row 1 hits three idols
    const next = moved(layout, release, board(5));
    expect(at(next, board(6))).toBe(ref("idol-release"));
    expect(refsIn(next).sort()).toEqual(refsIn(layout).sort());
    expectLegal(next);
  });

  test("dropping on a blocked cell snaps the idol beside it", () => {
    const next = moveItem(start(), board(6), board(12));
    expect(next.ok).toBe(true);
    if (next.ok) expect([7, 11, 13, 17]).toContain(next.to.index);
  });

  test("near an edge an idol shifts back onto the board", () => {
    const next = moved(start(), board(16), board(19)); // 2×1 on the last column
    expect(at(next, board(18))).toBe(ref("idol-hotfix"));
    expect(at(next, board(19))).toBe(ref("idol-hotfix"));
  });

  test("an idol goes back to any bag cell, moving what's there", () => {
    const layout = start();
    const off = moved(layout, board(6), bag(40));
    expect(at(off, bag(40))).toBe(ref("idol-reproduction"));
    expect(at(off, board(6))).toBeNull();

    const onCurrency = moved(layout, board(6), bag(0));
    expect(at(onCurrency, bag(0))).toBe(ref("idol-reproduction"));
    expect(refsIn(onCurrency).sort()).toEqual(refsIn(layout).sort());
  });

  test("Ctrl+click: an idol takes the first free spot; currency stays; a board idol returns to the bag", () => {
    const layout = start();
    expect(quickMove(layout, bagCellOf(layout, "idol-patch-notes"))).toMatchObject({ ok: true, to: board(7) });
    expect(quickMove(layout, bag(0))).toEqual({ ok: false, reason: "not-idol" });
    expect(quickMove(layout, board(6))).toMatchObject({ ok: true, to: { container: "bag" } });
  });

  test("Ctrl+click reports when the idol has no room or the bag is full", () => {
    const layout = start();
    expect(quickMove(layout, bagCellOf(layout, "idol-playthrough"))).toEqual({ ok: false, reason: "no-fit" });
    const fullBag = { ...layout, bag: Array(BAG_SIZE).fill(`c:${code}`) };
    expect(quickMove(fullBag, board(6))).toEqual({ ok: false, reason: "bag-full" });
  });

  test("clearing removes the idol wherever it was addressed", () => {
    expect(at(clear(start(), board(15)), board(5))).toBeNull();
  });
});

describe("altars", () => {
  const hourglass = "altar-hourglass";

  test("only altars go in the socket", () => {
    expect(moveItem(start(), bag(0), socket)).toEqual({ ok: false, reason: "not-altar" });
    expect(moveItem(start(), board(5), socket)).toEqual({ ok: false, reason: "not-altar" });
  });

  test("socketing one changes the board, and idols that no longer fit return to the bag", () => {
    const layout = start();
    const next = moved(layout, bagCellOf(layout, hourglass), socket);
    expect(next.altar).toBe(ref(hourglass));
    expect(next.idols.map((p) => p.ref)).not.toContain(ref("idol-exploration")); // on now-blocked cells
    expect(next.bag).toContain(ref("idol-exploration"));
    expect(refsIn(next).sort()).toEqual([...ALL_DISPLAY].sort());
    expectLegal(next);
  });

  test("unsocketing restores the base board and keeps the altar in the chosen cell", () => {
    const layout = start();
    const socketed = moved(layout, bagCellOf(layout, hourglass), socket);
    const next = moved(socketed, socket, bag(50));
    expect(next.altar).toBeNull();
    expect(at(next, bag(50))).toBe(ref(hourglass));
    expectLegal(next);
  });

  test("another altar swaps with the socketed one, by drag or Ctrl+click", () => {
    const layout = start();
    const first = moved(layout, bagCellOf(layout, hourglass), socket);
    const cell = bagCellOf(first, "altar-crossroads");
    const second = quickMove(first, cell);
    expect(second).toMatchObject({ ok: true, to: socket });
    if (!second.ok) return;
    expect(second.layout.altar).toBe(ref("altar-crossroads"));
    expect(at(second.layout, cell)).toBe(ref(hourglass));
  });

  test("a change that would strand idols with a full bag is refused, and nothing moves", () => {
    const layout = start();
    const altarCell = bagCellOf(layout, hourglass);
    const covered = new Set(piecesIn(layout, "bag").flatMap((p) => footprint(planOf("bag"), p.index, p.shape)!));
    const full = { ...layout, bag: layout.bag.map((r, i) => r ?? (covered.has(i) ? null : `c:${code}`)) };
    expect(moveItem(full, altarCell, socket)).toEqual({ ok: false, reason: "bag-full" });
  });

  test("idols on empowered cells have stronger resistances; others are untouched", () => {
    const layout = start();
    const crossroads = moved(layout, bagCellOf(layout, "altar-crossroads"), socket);
    // Localization (3×1 on cells 1-3) covers empowered cell 2, so its 5 becomes 7.
    const idols = boardIdols(crossroads);
    const localization = idols.find((e) => e.ref === ref("idol-localization"))!;
    expect(localization.empowered).toBe(true);
    expect(localization.idol.resists).toEqual({ scope: 7 });
    expect(IDOLS.find((i) => i.id === "idol-localization")!.resists).toEqual({ scope: 5 }); // data unchanged

    const reproduction = idols.find((e) => e.ref === ref("idol-reproduction"))!;
    expect(reproduction.empowered).toBe(false);
    expect(reproduction.idol.resists).toEqual({ flaky: 2 });
  });
});

describe("the cube", () => {
  const cube = (index: number): Cell => ({ container: "cube", index });
  const recipe = CUBE_RECIPES[0]!;
  /** The fixture with a recipe's inputs already in the cube. */
  const loaded = () => {
    let layout = start();
    recipe.inputs.forEach((id, i) => {
      layout = moved(layout, bagCellOf(layout, id), cube(i));
    });
    return layout;
  };

  test("holds any item its shape allows, but never itself", () => {
    const layout = start();
    expect(at(moved(layout, bag(0), cube(5)), cube(5))).toBe(layout.bag[0]);
    expect(moveItem(layout, bagCellOf(layout, CUBE.id), cube(0))).toEqual({ ok: false, reason: "cube-in-cube" });
    // Square, so the longest shapes fit either way round.
    expect(at(moved(layout, bagCellOf(layout, "idol-release"), cube(0)), cube(3))).toBe(ref("idol-release"));
    expect(at(moved(layout, bagCellOf(layout, "idol-playthrough"), cube(1)), cube(13))).toBe(ref("idol-playthrough"));
  });

  test("the cube item pushed out by a drop in the bag never lands inside itself", () => {
    const layout = moved(start(), bag(0), cube(0));
    const next = moved(layout, cube(0), bagCellOf(layout, CUBE.id));
    expect(next.cube.map((p) => p.ref)).not.toContain(ref(CUBE.id));
    expect(refsIn(next).sort()).toEqual(refsIn(layout).sort());
  });

  test("Ctrl+click goes to the cube only while its window is open", () => {
    const layout = start();
    expect(quickMove(layout, bag(0))).toEqual({ ok: false, reason: "not-idol" });
    expect(quickMove(layout, bag(0), { toCube: true })).toMatchObject({ ok: true, to: cube(0) });
  });

  test("transmuting makes the result beside the inputs and takes one from each stack", () => {
    const before = loaded();
    const result = transmute(before);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layout.cube).toHaveLength(4);
    expect(at(result.layout, cube(3))).toBe(ref(recipe.result.id));
    expect(result.layout.cube.slice(0, 3)).toEqual(before.cube); // the inputs stay put
    expectLegal(result.layout);

    for (const id of recipe.inputs) {
      const item = BACKPACK.find((i) => i.id === id)!;
      const now = stackedItem(item, result.layout);
      expect(now.stack).toBe(item.stack! - 1);
      expect(now.properties![0]!.en).toBe(`Stack Size: {${item.stack! - 1}/${item.maxStack}}`);
    }
    const untouched = BACKPACK.find((i) => !(recipe.inputs as readonly string[]).includes(i.id))!;
    expect(stackedItem(untouched, result.layout)).toBe(untouched);
  });

  test("a wrong mix changes nothing, and neither does pressing it again straight after", () => {
    expect(transmute(moved(start(), bag(0), cube(0)))).toEqual({ ok: false, reason: "nothing" });
    expect(transmute(start())).toEqual({ ok: false, reason: "nothing" });
    const made = transmute(loaded());
    if (!made.ok) throw new Error("expected a result");
    expect(transmute(made.layout)).toEqual({ ok: false, reason: "nothing" }); // the result spoils the mix
  });

  test("a result already made can't be made again, and costs nothing to try", () => {
    const made = transmute(loaded());
    if (!made.ok) throw new Error("expected a result");
    const layout = moved(made.layout, cube(3), bag(40));
    expect(transmute(layout)).toEqual({ ok: false, reason: "known" });
    const item = BACKPACK.find((i) => i.id === recipe.inputs[0])!;
    expect(stackedItem(item, layout).stack).toBe(item.stack! - 1);
  });

  test("every stack outlasts every recipe, so nothing can be run out", () => {
    for (const item of BACKPACK) {
      const uses = CUBE_RECIPES.filter((r) => (r.inputs as readonly string[]).includes(item.id)).length;
      expect(item.stack! - uses, item.id).toBeGreaterThan(0);
      expect(item.stack!, item.id).toBeLessThanOrEqual(item.maxStack!);
    }
  });

  test("a transmuted result is a 1×1 idol: it goes on the board and counts there", () => {
    const made = transmute(loaded());
    if (!made.ok) throw new Error("expected a result");
    const onBoard = moved(made.layout, cube(3), board(7));
    expect(at(onBoard, board(7))).toBe(ref(recipe.result.id));
    expect(boardIdols(onBoard).find((e) => e.ref === ref(recipe.result.id))?.idol.resists).toEqual(
      recipe.result.resists,
    );
    expectLegal(onBoard);
  });

  test("results survive loading, and are not forced to exist before they're made", () => {
    expect(refsIn(normalize(RULES_LAYOUT)!)).not.toContain(ref(recipe.result.id));
    const made = transmute(loaded());
    if (!made.ok) throw new Error("expected a result");
    expect(normalize(made.layout)).toEqual(made.layout);
  });
});

describe("the planted dupe bug", () => {
  test("copies an idol across, in either direction, but never currency", () => {
    const layout = start();
    const cell = bagCellOf(layout, "idol-patch-notes");
    const copy = duplicateAcross(layout, cell)!;
    expect(at(copy.layout, cell)).toBe(ref("idol-patch-notes"));
    expect(at(copy.layout, copy.to)).toBe(ref("idol-patch-notes"));

    const out = duplicateAcross(layout, board(6))!;
    expect(at(out.layout, board(6))).toBe(ref("idol-reproduction"));
    expect(out.layout.bag).toContain(ref("idol-reproduction"));

    expect(duplicateAcross(layout, bag(0))).toBeNull();
  });

  test("its duplicates survive only while allowed", () => {
    const layout = start();
    const copy = duplicateAcross(layout, bagCellOf(layout, "idol-patch-notes"))!;
    const count = (l: Layout) => refsIn(l).filter((r) => r === ref("idol-patch-notes")).length;
    expect(count(normalize(copy.layout)!)).toBe(1);
    expect(count(normalize(copy.layout, { allowDuplicates: true })!)).toBe(2);
  });
});

describe("the planted stale-save bug", () => {
  const crafted = craftRef({ base: "bug", seed: 7, orbs: ["transmute", "augmentation"] });
  const stale = craftRef({ base: "bug", seed: 7, orbs: ["transmute"] });

  test("fixing it swaps the stale item for what was crafted, wherever it was moved", () => {
    const saved = place(start(), stale)!;
    const elsewhere = moved(saved.layout, bag(saved.index), bag(50));
    const fixed = replaceRef(elsewhere, stale, crafted);
    expect(at(fixed, bag(50))).toBe(crafted);
    expect(refsIn(fixed)).not.toContain(stale);
    expect(refsIn(fixed).length).toBe(refsIn(elsewhere).length);
  });

  test("a layout without the stale item comes back unchanged", () => {
    const layout = start();
    expect(replaceRef(layout, stale, crafted)).toBe(layout);
  });
});

describe("loading untrusted storage", () => {
  test("bad shapes are rejected", () => {
    expect(normalize("nope")).toBeNull();
    expect(normalize({})).toBeNull();
    expect(normalize({ bag: Array(BAG_SIZE + 1).fill(null) })).toBeNull();
    expect(normalize({ bag: [], stash: "x" })).toBeNull();
    expect(normalize({ bag: [], idols: "x" })).toBeNull();
  });

  test("bad refs and duplicates are cleaned, and missing items return", () => {
    const id = ref(BACKPACK[0]!.id);
    const clean = normalize({ bag: [id, id, "c:not-a-recipe", 42, "x:nope"], idols: [] })!;
    expect(clean.bag.filter((r) => r === id)).toHaveLength(1);
    expect(refsIn(clean).sort()).toEqual([...ALL_DISPLAY].sort());
  });

  test("overlapping bag items and illegal idols or altars are dropped back to the bag", () => {
    const clean = normalize({
      bag: [ref("idol-release"), ref("idol-telemetry")], // the 4×1 covers the second cell
      altar: ref(BACKPACK[0]!.id), // not an altar
      idols: [
        { ref: ref("idol-reproduction"), index: 0 }, // blocked corner
        { ref: ref("idol-playthrough"), index: 22 }, // off the board
        { ref: ref(BACKPACK[0]!.id), index: 7 }, // not an idol
        { ref: ref("idol-patch-notes"), index: 7 }, // fine
        { ref: ref("idol-hotfix"), index: 6 }, // overlaps the one above
        null,
        { ref: 3, index: "x" },
      ],
    })!;
    expect(clean.altar).toBeNull();
    expect(clean.idols).toEqual([{ ref: ref("idol-patch-notes"), index: 7 }]);
    expect(refsIn(clean).sort()).toEqual([...ALL_DISPLAY].sort());
    expectLegal(clean);
  });

  test("a { bag, stash } save keeps its crafts, moves the stash into the bag and gains the idols", () => {
    const craft = `c:${code}`;
    const old = {
      bag: [ref(BACKPACK[1]!.id), ref(BACKPACK[0]!.id), null, null, null],
      stash: [craft, null, ref(BACKPACK[2]!.id), craft],
    };
    const migrated = normalize(old)!;
    expect(migrated.bag[0]).toBe(ref(BACKPACK[1]!.id)); // the player's arrangement is kept
    expect(migrated.bag.filter((r) => r === craft)).toHaveLength(2);
    expect(migrated.idols).toEqual(STARTING_IDOLS.map(({ id, index }) => ({ ref: ref(id), index })));
    expect(migrated.altar).toBe(ref(STARTING_ALTAR));
    expectLegal(migrated);
    expect(
      refsIn(migrated)
        .filter((r) => r.startsWith("d:"))
        .sort(),
    ).toEqual([...ALL_DISPLAY].sort());
    // Saved again, it's stable: nothing is added or lost a second time.
    expect(normalize(migrated)).toEqual(migrated);
  });

  test("refs resolve to hand-written items or re-cooked crafts", () => {
    expect(resolve(ref(BACKPACK[0]!.id))?.kind).toBe("display");
    expect(resolve(ref(IDOLS[0]!.id))?.kind).toBe("display");
    expect(resolve(`c:${code}`)?.kind).toBe("craft");
    expect(resolve("d:unknown")).toBeNull();
  });
});

describe("invariants (property-based)", () => {
  const containers: ContainerId[] = ["bag", "idols", "altar", "cube"];
  const cell = fc.record({
    container: fc.constantFrom(...containers),
    index: fc.integer({ min: 0, max: BAG_SIZE - 1 }),
  });
  /** Keeps generated cells inside their container. */
  const clamp = ({ container, index }: Cell): Cell => ({
    container,
    index: container === "bag" ? index : container === "idols" ? index % 25 : container === "cube" ? index % 16 : 0,
  });
  const action = fc.record({ quick: fc.boolean(), from: cell, to: cell });

  test("no sequence of moves loses an item, duplicates one or breaks a grid", () => {
    fc.assert(
      fc.property(fc.array(action, { maxLength: 60 }), (actions) => {
        let layout = defaultLayout([code]);
        const before = refsIn(layout).sort();
        for (const { quick, from, to } of actions) {
          const result = quick ? quickMove(layout, clamp(from)) : moveItem(layout, clamp(from), clamp(to));
          if (result.ok) layout = result.layout;
          expect(refsIn(layout).sort()).toEqual(before);
          expectLegal(layout);
        }
      }),
    );
  });

  test("a move of an idol onto any open board cell succeeds while the bag has room", () => {
    const open = [...Array(25).keys()].filter((i) => !boardPlan(null).blocked.has(i));
    fc.assert(
      fc.property(fc.constantFrom(...RULES_LAYOUT.idols), fc.constantFrom(...open), ({ index }, target) => {
        const result = moveItem(start(), board(index), board(target));
        // Only a shape that can't cover this cell legally at all may be refused.
        if (!result.ok) expect(result.reason).toBe("no-fit");
      }),
    );
  });

  test("a refused move changes nothing", () => {
    fc.assert(
      fc.property(cell, cell, (from, to) => {
        const layout = start();
        const snapshot = JSON.stringify(layout);
        moveItem(layout, clamp(from), clamp(to));
        expect(JSON.stringify(layout)).toBe(snapshot);
      }),
    );
  });

  test("whatever is in storage, loading gives a legal, stable layout", () => {
    const anyRef = fc.oneof(
      fc.constantFrom(...ALL_DISPLAY, `c:${code}`, "d:unknown", "junk"),
      fc.constant(null),
      fc.integer(),
    );
    const stored = fc.record(
      {
        bag: fc.array(anyRef, { maxLength: BAG_SIZE }),
        stash: fc.array(anyRef, { maxLength: 24 }),
        altar: anyRef,
        cube: fc.array(fc.record({ ref: anyRef, index: fc.integer({ min: -3, max: 15 }) }), { maxLength: 12 }),
        idols: fc.array(fc.record({ ref: anyRef, index: fc.integer({ min: -3, max: 30 }) }), { maxLength: 12 }),
      },
      { requiredKeys: ["bag"] },
    );
    fc.assert(
      fc.property(stored, (raw) => {
        const layout = normalize(raw)!;
        expectLegal(layout);
        const display = refsIn(layout).filter((r) => r.startsWith("d:"));
        expect(new Set(display).size).toBe(display.length);
        expect(normalize(layout)).toEqual(layout);
      }),
    );
  });
});
