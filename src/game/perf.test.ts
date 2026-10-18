import fc from "fast-check";
import { EMPTY_SUMMARY, FrameRing, percentile, summarize } from "./perf";

describe("percentile", () => {
  it("uses the nearest rank", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(xs, 50)).toBe(5);
    expect(percentile(xs, 90)).toBe(9);
    expect(percentile(xs, 99)).toBe(10);
    expect(percentile(xs, 100)).toBe(10);
    expect(percentile(xs, 0)).toBe(1);
  });

  it("is 0 for no data", () => {
    expect(percentile([], 99)).toBe(0);
  });
});

describe("summarize", () => {
  it("reports a steady 60 fps", () => {
    const s = summarize(Array(120).fill(1000 / 60));
    expect(s).toEqual({ frames: 120, fps: 60, avgMs: 16.7, p99Ms: 16.7, low1Fps: 60, maxMs: 16.7 });
  });

  it("separates the average from the 1% low when a frame stutters", () => {
    // 99 smooth frames and one 100 ms hitch.
    const s = summarize([...Array(99).fill(10), 100]);
    expect(s.avgMs).toBe(10.9);
    expect(s.fps).toBe(91.7);
    expect(s.p99Ms).toBe(10);
    expect(s.maxMs).toBe(100);
    // Two hitches in 100 frames do land in the slowest 1%.
    const worse = summarize([...Array(98).fill(10), 100, 100]);
    expect(worse.p99Ms).toBe(100);
    expect(worse.low1Fps).toBe(10);
  });

  it("ignores impossible samples", () => {
    expect(summarize([16, 0, -5, NaN, Infinity, 16]).frames).toBe(2);
  });

  it("returns the empty summary with no valid samples", () => {
    expect(summarize([])).toBe(EMPTY_SUMMARY);
    expect(summarize([0, -1])).toBe(EMPTY_SUMMARY);
  });

  it("property: every statistic lies between the fastest and the slowest frame", () => {
    fc.assert(
      fc.property(fc.array(fc.double({ min: 1, max: 200, noNaN: true }), { minLength: 1, maxLength: 300 }), (xs) => {
        const s = summarize(xs);
        const [min, max] = [Math.min(...xs), Math.max(...xs)];
        expect(s.frames).toBe(xs.length);
        expect(s.maxMs).toBeCloseTo(max, 0);
        for (const ms of [s.avgMs, s.p99Ms]) {
          expect(ms).toBeGreaterThanOrEqual(Math.floor(min * 10) / 10);
          expect(ms).toBeLessThanOrEqual(Math.ceil(max * 10) / 10);
        }
        // Up to 100 frames, the slowest 1% is the slowest frame itself.
        if (xs.length <= 100) expect(s.p99Ms).toBe(s.maxMs);
      }),
    );
  });
});

describe("FrameRing", () => {
  it("keeps everything until full, in order", () => {
    const r = new FrameRing(3);
    r.push(1);
    r.push(2);
    expect(r.values()).toEqual([1, 2]);
  });

  it("drops the oldest samples once full, oldest first", () => {
    const r = new FrameRing(3);
    for (const x of [1, 2, 3, 4, 5]) r.push(x);
    expect(r.values()).toEqual([3, 4, 5]);
    r.push(6);
    expect(r.values()).toEqual([4, 5, 6]);
  });

  it("clears", () => {
    const r = new FrameRing(2);
    r.push(1);
    r.push(2);
    r.push(3);
    r.clear();
    expect(r.values()).toEqual([]);
    r.push(9);
    expect(r.values()).toEqual([9]);
  });
});
