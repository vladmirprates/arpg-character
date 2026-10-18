import {
  BUTTONS,
  deadzone,
  heldActions,
  padName,
  readPad,
  REPEAT_DELAY_MS,
  REPEAT_RATE_MS,
  SCROLL_SPEED,
  type PadInput,
  type PadMemory,
} from "./gamepad";
import { moveScore, nearestInDirection, type Box } from "./spatial";

const box = (left: number, top: number, width = 10, height = 10): Box => ({ left, top, width, height });

describe("spatial navigation", () => {
  //  a b c
  //  d e f      e is in the middle of a 3×3 grid of 10px boxes with 10px gaps
  //  g h i
  const grid = Object.fromEntries(
    ["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((id, i) => [id, box((i % 3) * 20, Math.floor(i / 3) * 20)]),
  ) as Record<string, Box>;
  const candidates = Object.entries(grid).map(([item, b]) => ({ item, box: b }));
  const from = grid.e!;

  it.each([
    ["up", "b"],
    ["down", "h"],
    ["left", "d"],
    ["right", "f"],
  ] as const)("moves %s to the neighbour in line", (dir, expected) => {
    expect(nearestInDirection(from, candidates, dir)).toBe(expected);
  });

  it("returns null when nothing lies that way", () => {
    expect(nearestInDirection(grid.a!, candidates, "up")).toBeNull();
    expect(nearestInDirection(grid.a!, candidates, "left")).toBeNull();
    expect(nearestInDirection(from, [], "up")).toBeNull();
  });

  it("never picks the element itself", () => {
    expect(moveScore(from, from, "right")).toBeNull();
  });

  it("prefers an element in the same row over a closer diagonal one", () => {
    const start = box(0, 0);
    const sameRowFar = box(100, 0);
    const diagonalNear = box(30, 60); // nearer by centre distance, but two rows down
    expect(
      nearestInDirection(
        start,
        [
          { item: "far", box: sameRowFar },
          { item: "diag", box: diagonalNear },
        ],
        "right",
      ),
    ).toBe("far");
  });

  it("measures distance edge to edge, so a wide neighbour isn't penalised for its size", () => {
    const start = box(0, 0, 10, 10);
    const wide = box(0, 20, 300, 10); // starts right below, centre far to the right
    const narrow = box(0, 60, 10, 10);
    expect(
      nearestInDirection(
        start,
        [
          { item: "narrow", box: narrow },
          { item: "wide", box: wide },
        ],
        "down",
      ),
    ).toBe("wide");
  });

  it("breaks exact ties by centre distance", () => {
    // Both overlap the start's row and sit at the same edge distance; the nearer centre wins.
    const start = box(0, 0, 10, 40);
    const high = box(20, 0, 10, 10);
    const low = box(20, 15, 10, 10);
    expect(
      nearestInDirection(
        start,
        [
          { item: "high", box: high },
          { item: "low", box: low },
        ],
        "right",
      ),
    ).toBe("low");
  });
});

const idle = (): PadInput => ({ buttons: Array(17).fill(false), axes: [0, 0, 0, 0] });
const press = (...indices: number[]): PadInput => {
  const input = idle();
  return { ...input, buttons: input.buttons.map((_, i) => indices.includes(i)) };
};

describe("heldActions", () => {
  it("maps every standard button", () => {
    for (const [index, action] of Object.entries(BUTTONS)) {
      expect([...heldActions(press(Number(index)))]).toEqual([action]);
    }
  });

  it("ignores unmapped buttons (LT, stick clicks, home)", () => {
    expect(heldActions(press(6, 10, 11, 16)).size).toBe(0);
  });

  it("reads the left stick as a D-pad past the threshold", () => {
    expect([...heldActions({ buttons: [], axes: [0.49, -0.49] })]).toEqual([]);
    expect([...heldActions({ buttons: [], axes: [-0.5, 0] })]).toEqual(["left"]);
    expect([...heldActions({ buttons: [], axes: [0.9, 0.7] })]).toEqual(["right", "down"]);
    expect([...heldActions({ buttons: [], axes: [0, -1] })]).toEqual(["up"]);
  });

  it("copes with pads that report fewer axes", () => {
    expect(heldActions({ buttons: [true], axes: [] })).toEqual(new Set(["confirm"]));
  });
});

describe("readPad", () => {
  it("fires a button once per press, however long it is held", () => {
    let memory: PadMemory = {};
    const fired: string[] = [];
    for (let t = 0; t <= 2000; t += 16) {
      const frame = readPad(press(0), memory, t);
      fired.push(...frame.actions);
      memory = frame.memory;
    }
    expect(fired).toEqual(["confirm"]);
    // Released, then pressed again: fires again.
    memory = readPad(idle(), memory, 2100).memory;
    expect(readPad(press(0), memory, 2116).actions).toEqual(["confirm"]);
  });

  it("repeats a held direction after the delay, then at the repeat rate", () => {
    let memory: PadMemory = {};
    const times: number[] = [];
    for (let t = 0; t <= 1000; t += 4) {
      const frame = readPad(press(13), memory, t);
      if (frame.actions.includes("down")) times.push(t);
      memory = frame.memory;
    }
    expect(times[0]).toBe(0);
    expect(times[1]).toBe(REPEAT_DELAY_MS);
    expect(times[2]).toBe(REPEAT_DELAY_MS + REPEAT_RATE_MS);
    expect(times.length).toBe(1 + 1 + Math.floor((1000 - REPEAT_DELAY_MS) / REPEAT_RATE_MS));
  });

  it("does not fire again just before the repeat is due", () => {
    const first = readPad(press(12), {}, 0);
    expect(readPad(press(12), first.memory, REPEAT_DELAY_MS - 1).actions).toEqual([]);
  });

  it("forgets released actions", () => {
    const held = readPad(press(0, 12), {}, 0).memory;
    expect(Object.keys(readPad(idle(), held, 16).memory)).toEqual([]);
  });

  it("scrolls with the right stick beyond its dead zone", () => {
    const still = readPad({ buttons: [], axes: [0, 0, 0.1, -0.2] }, {}, 0);
    expect(still.scroll).toEqual({ x: 0, y: 0 });
    const full = readPad({ buttons: [], axes: [0, 0, 1, -1] }, {}, 0);
    expect(full.scroll).toEqual({ x: SCROLL_SPEED, y: -SCROLL_SPEED });
  });
});

describe("deadzone", () => {
  it("is 0 inside the zone and scales to ±1 outside it", () => {
    expect(deadzone(0.2)).toBe(0);
    expect(deadzone(-0.2)).toBe(0);
    expect(deadzone(1)).toBe(1);
    expect(deadzone(-1)).toBe(-1);
    expect(deadzone(0.6)).toBeCloseTo(0.5);
    expect(deadzone(0.5, 0)).toBe(0.5);
  });
});

describe("padName", () => {
  it("drops Chrome's driver details", () => {
    expect(padName("Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)")).toBe(
      "Xbox Wireless Controller",
    );
  });

  it("keeps names without details, and falls back to the raw id", () => {
    expect(padName("054c-0ce6-DualSense Wireless Controller")).toBe("054c-0ce6-DualSense Wireless Controller");
    expect(padName("(weird)")).toBe("(weird)");
  });
});
