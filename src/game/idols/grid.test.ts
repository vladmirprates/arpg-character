import { ALTARS, BASE_PLAN, IDOLS, STARTING_ALTAR, STARTING_IDOLS } from "../../data/idols";
import {
  candidateAnchors,
  empower,
  firstFit,
  fits,
  footprint,
  isEmpowered,
  isLegal,
  openPlan,
  overlapping,
  parsePlan,
  type Occupant,
} from "./grid";

const single = { w: 1, h: 1 };
const tall = { w: 1, h: 3 };
const big = { w: 2, h: 2 };

describe("grid geometry", () => {
  test("parsePlan reads the size and the blocked and empowered cells by position", () => {
    const plan = parsePlan(["#....", ".*...", "....#"]);
    expect(plan.columns).toBe(5);
    expect(plan.rows).toBe(3);
    expect([...plan.blocked]).toEqual([0, 14]);
    expect([...plan.empowered]).toEqual([6]);
  });

  test("the base board blocks its corners and centre, leaving 20 cells", () => {
    expect([...BASE_PLAN.blocked].sort((a, b) => a - b)).toEqual([0, 4, 12, 20, 24]);
    expect(BASE_PLAN.columns * BASE_PLAN.rows - BASE_PLAN.blocked.size).toBe(20);
    expect(BASE_PLAN.empowered.size).toBe(0);
  });

  test("footprint lists every covered cell, and rejects anything off the grid", () => {
    expect(footprint(BASE_PLAN, 6, big)).toEqual([6, 7, 11, 12]);
    expect(footprint(BASE_PLAN, 4, { w: 2, h: 1 })).toBeNull(); // past the right edge, not wrapping
    expect(footprint(BASE_PLAN, 15, tall)).toBeNull(); // past the bottom edge
    expect(footprint(BASE_PLAN, -1, single)).toBeNull();
    expect(footprint(BASE_PLAN, 25, single)).toBeNull();
    expect(footprint(BASE_PLAN, 1.5, single)).toBeNull();
  });

  test("the same code handles a wider grid", () => {
    const bag = openPlan(12, 5);
    expect(footprint(bag, 7, { w: 4, h: 1 })).toEqual([7, 8, 9, 10]);
    expect(footprint(bag, 9, { w: 4, h: 1 })).toBeNull();
    expect(footprint(bag, 6, { w: 1, h: 4 })).toEqual([6, 18, 30, 42]);
  });

  test("fits rejects blocked cells, overlaps and edges", () => {
    const occupants: Occupant[] = [{ index: 6, shape: single }];
    expect(fits(BASE_PLAN, occupants, 7, single)).toBe(true);
    expect(fits(BASE_PLAN, occupants, 6, single)).toBe(false);
    expect(fits(BASE_PLAN, [], 0, single)).toBe(false); // blocked corner
    expect(fits(BASE_PLAN, [], 2, tall)).toBe(false); // runs into the blocked centre
    expect(fits(BASE_PLAN, [], 15, tall)).toBe(false);
    expect(isLegal(BASE_PLAN, 6, single)).toBe(true); // legal, whatever occupies it
  });

  test("overlapping finds only the pieces actually in the way", () => {
    const a = { index: 6, shape: big };
    const b = { index: 9, shape: single };
    expect(overlapping(BASE_PLAN, [a, b], 12, single)).toEqual([a]);
    expect(overlapping(BASE_PLAN, [a, b], 8, { w: 2, h: 1 })).toEqual([b]);
    expect(overlapping(BASE_PLAN, [a, b], 16, single)).toEqual([]);
  });

  test("firstFit reads row by row and reports when nothing fits", () => {
    expect(firstFit(BASE_PLAN, [], single)).toBe(1);
    expect(firstFit(BASE_PLAN, [], { w: 5, h: 1 })).toBe(5);
    expect(firstFit(parsePlan(["###", "###"]), [], single)).toBe(-1);
  });

  test("a piece is empowered when any covered cell is, and empower rounds down", () => {
    const plan = parsePlan([".....", ".....", "..*..", ".....", "....."]);
    expect(isEmpowered(plan, 7, tall)).toBe(true);
    expect(isEmpowered(plan, 6, tall)).toBe(false);
    expect(empower(10)).toBe(15);
    expect(empower(5)).toBe(7);
  });
});

describe("where a dropped piece lands", () => {
  test("it centres on the target when it can", () => {
    expect(candidateAnchors(BASE_PLAN, 10, tall)[0]).toBe(5); // 1×3 centred on the middle row
    expect(candidateAnchors(openPlan(12, 5), 8, { w: 3, h: 1 })[0]).toBe(7);
  });

  test("every candidate covers the target and is legal", () => {
    for (const anchor of candidateAnchors(BASE_PLAN, 11, big)) {
      expect(footprint(BASE_PLAN, anchor, big)).toContain(11);
      expect(isLegal(BASE_PLAN, anchor, big)).toBe(true);
    }
  });

  test("near an edge it shifts back onto the grid", () => {
    expect(candidateAnchors(BASE_PLAN, 19, big)).toContain(13);
    expect(candidateAnchors(BASE_PLAN, 3, { w: 3, h: 1 })[0]).toBe(1);
  });

  test("around a blocked cell it finds a spot that avoids it", () => {
    // The centre blocks this column: a 1×3 can't cover row 1 of it without touching row 2.
    const anchors = candidateAnchors(BASE_PLAN, 7, tall);
    expect(anchors).not.toContain(2);
    expect(anchors).not.toContain(7);
  });

  test("a drop on a blocked cell snaps to a spot right beside it", () => {
    const anchors = candidateAnchors(BASE_PLAN, 12, single);
    expect(anchors[0]).toBeDefined();
    expect([7, 11, 13, 17]).toContain(anchors[0]);
    expect(anchors).not.toContain(12);
  });
});

describe("idol data", () => {
  test("ids are unique and every starting idol legally fits both the base board and the starting altar's", () => {
    const ids = [...IDOLS, ...ALTARS].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    const altar = ALTARS.find((a) => a.id === STARTING_ALTAR)!;
    for (const plan of [BASE_PLAN, altar.plan]) {
      const placed: Occupant[] = [];
      for (const { id, index } of STARTING_IDOLS) {
        const idol = IDOLS.find((i) => i.id === id)!;
        expect(fits(plan, placed, index, idol.shape), id).toBe(true);
        placed.push({ index, shape: idol.shape });
      }
    }
  });

  test("more idols exist than the starting arrangement uses, in every one of the eight shapes", () => {
    expect(IDOLS.length).toBeGreaterThan(STARTING_IDOLS.length);
    expect([...new Set(IDOLS.map((i) => `${i.shape.w}x${i.shape.h}`))].sort()).toEqual(
      ["1x1", "1x2", "1x3", "1x4", "2x1", "2x2", "3x1", "4x1"].sort(),
    );
  });

  test("each altar empowers open cells and explains what that means", () => {
    for (const altar of ALTARS) {
      expect(altar.plan.empowered.size, altar.id).toBeGreaterThan(0);
      for (const cell of altar.plan.empowered) expect(altar.plan.blocked.has(cell)).toBe(false);
      expect(altar.mods?.some((m) => /Empowered cells/.test(m.en) && /Células fortalecidas/.test(m.pt))).toBe(true);
    }
  });
});
