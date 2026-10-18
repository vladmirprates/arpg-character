import {
  applyEvent,
  EMPTY_ACHIEVEMENTS,
  isAchievementState,
  progressOf,
  type AchievementRule,
  type AchievementState,
} from "./achievements";
import { subscribe, track, type GameEvent } from "./events";

const RULES: AchievementRule[] = [
  { id: "copy", match: (e) => e.type === "item.copied" },
  { id: "cards", match: (e) => e.type === "card.read" && e.id, target: 3 },
  { id: "bugs", match: (e) => e.type === "bug.found", target: 2 },
  { id: "all", requiresAll: true },
];

const run = (events: GameEvent[], state: AchievementState = EMPTY_ACHIEVEMENTS, now = 1000) =>
  events.reduce<{ state: AchievementState; unlocked: string[] }>(
    (acc, e) => {
      const r = applyEvent(acc.state, e, RULES, now);
      return { state: r.state, unlocked: [...acc.unlocked, ...r.unlocked] };
    },
    { state, unlocked: [] },
  );

describe("applyEvent", () => {
  it("unlocks a single-step achievement and stamps the time", () => {
    const r = applyEvent(EMPTY_ACHIEVEMENTS, { type: "item.copied" }, RULES, 42);
    expect(r.unlocked).toEqual(["copy"]);
    expect(r.state.unlocked).toEqual({ copy: 42 });
    expect(r.state.progress).toEqual({});
  });

  it("returns the same state object when nothing matches", () => {
    const r = applyEvent(EMPTY_ACHIEVEMENTS, { type: "perf.opened" }, RULES, 1);
    expect(r.state).toBe(EMPTY_ACHIEVEMENTS);
    expect(r.unlocked).toEqual([]);
  });

  it("never unlocks the same achievement twice", () => {
    const { state, unlocked } = run([{ type: "item.copied" }, { type: "item.copied" }]);
    expect(unlocked).toEqual(["copy"]);
    expect(state.unlocked.copy).toBe(1000);
    const again = applyEvent(state, { type: "item.copied" }, RULES, 2000);
    expect(again.state).toBe(state);
    expect(again.state.unlocked.copy).toBe(1000);
  });

  it("counts distinct keys only: rereading a card adds nothing", () => {
    const { state, unlocked } = run([
      { type: "card.read", id: "a" },
      { type: "card.read", id: "a" },
      { type: "card.read", id: "b" },
    ]);
    expect(unlocked).toEqual([]);
    expect(state.progress.cards).toEqual(["a", "b"]);
    expect(progressOf(state, RULES[1]!)).toBe(2);
  });

  it("unlocks a multi-step achievement on the last distinct key and drops its progress", () => {
    const { state, unlocked } = run(["a", "b", "c"].map((id) => ({ type: "card.read", id }) as GameEvent));
    expect(unlocked).toEqual(["cards"]);
    expect(state.progress.cards).toBeUndefined();
    expect(progressOf(state, RULES[1]!)).toBe(3);
  });

  it("counts every `true` match as a new step", () => {
    const one = run([{ type: "bug.found", id: "x" }]);
    expect(one.unlocked).toEqual([]);
    expect(progressOf(one.state, RULES[2]!)).toBe(1);
    // Same bug id again still counts: the rule returns true, not the id.
    const two = run([{ type: "bug.found", id: "x" }], one.state);
    expect(two.unlocked).toEqual(["bugs"]);
  });

  it("unlocks the meta-achievement with the last regular one, in the same event", () => {
    const { state, unlocked } = run([
      { type: "item.copied" },
      { type: "bug.found", id: "1" },
      { type: "bug.found", id: "2" },
      { type: "card.read", id: "a" },
      { type: "card.read", id: "b" },
    ]);
    expect(unlocked).toEqual(["copy", "bugs"]);
    expect(state.unlocked.all).toBeUndefined();
    const last = applyEvent(state, { type: "card.read", id: "c" }, RULES, 5);
    expect(last.unlocked).toEqual(["cards", "all"]);
    expect(last.state.unlocked.all).toBe(5);
  });

  it("ignores events for rules without a matcher", () => {
    const rules: AchievementRule[] = [{ id: "meta", requiresAll: true }];
    expect(applyEvent(EMPTY_ACHIEVEMENTS, { type: "item.copied" }, rules, 1).state).toBe(EMPTY_ACHIEVEMENTS);
  });

  it("does not mutate the input state", () => {
    const before = { unlocked: {}, progress: { cards: ["a"] } };
    const snapshot = structuredClone(before);
    applyEvent(before, { type: "card.read", id: "b" }, RULES, 1);
    expect(before).toEqual(snapshot);
  });
});

describe("progressOf", () => {
  it("is 0 with no progress and the target once unlocked", () => {
    expect(progressOf(EMPTY_ACHIEVEMENTS, RULES[1]!)).toBe(0);
    expect(progressOf({ unlocked: { cards: 1 }, progress: {} }, RULES[1]!)).toBe(3);
  });

  it("never reports more than the target", () => {
    expect(progressOf({ unlocked: {}, progress: { copy: ["0", "1"] } }, RULES[0]!)).toBe(1);
  });
});

describe("isAchievementState", () => {
  it("accepts a valid state", () => {
    expect(isAchievementState(EMPTY_ACHIEVEMENTS)).toBe(true);
    expect(isAchievementState({ unlocked: { a: 1 }, progress: { b: ["x"] } })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "nope"],
    ["missing progress", { unlocked: {} }],
    ["missing unlocked", { progress: {} }],
    ["null unlocked", { unlocked: null, progress: {} }],
    ["null progress", { unlocked: {}, progress: null }],
    ["array unlocked", { unlocked: [], progress: {} }],
    ["array progress", { unlocked: {}, progress: [] }],
    ["non-number time", { unlocked: { a: "1" }, progress: {} }],
    ["infinite time", { unlocked: { a: Infinity }, progress: {} }],
    ["non-array progress", { unlocked: {}, progress: { a: "x" } }],
    ["non-string key", { unlocked: {}, progress: { a: [1] } }],
  ])("rejects %s", (_, value) => {
    expect(isAchievementState(value)).toBe(false);
  });
});

describe("event bus", () => {
  it("delivers events to subscribers until they unsubscribe", () => {
    const seen: GameEvent[] = [];
    const off = subscribe((e) => seen.push(e));
    track({ type: "item.copied" });
    off();
    track({ type: "perf.opened" });
    expect(seen).toEqual([{ type: "item.copied" }]);
  });

  it("lets a listener unsubscribe while an event is being delivered", () => {
    const calls: string[] = [];
    const offA = subscribe(() => {
      calls.push("a");
      offA();
    });
    const offB = subscribe(() => calls.push("b"));
    track({ type: "item.copied" });
    track({ type: "item.copied" });
    offB();
    expect(calls).toEqual(["a", "b", "b"]);
  });
});
