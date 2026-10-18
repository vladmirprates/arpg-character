import { computePosition } from "./Tooltip";

const rect = (x: number, y: number, w: number, h: number) =>
  ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y }) as DOMRect;

describe("computePosition", () => {
  const tip = rect(0, 0, 200, 100);

  test("uses the preferred side when it fits", () => {
    expect(computePosition(rect(100, 300, 50, 50), tip, "right", 1000, 800)).toMatchObject({
      placement: "right",
      x: 160,
    });
  });

  test("flips to the opposite side at the viewport edge", () => {
    expect(computePosition(rect(900, 300, 50, 50), tip, "right", 1000, 800).placement).toBe("left");
  });

  test("never leaves the viewport, even when nothing fits", () => {
    const pos = computePosition(rect(0, 0, 50, 50), rect(0, 0, 400, 400), "top", 320, 320);
    expect(pos.x).toBeGreaterThanOrEqual(8);
    expect(pos.y).toBeGreaterThanOrEqual(8);
  });
});
