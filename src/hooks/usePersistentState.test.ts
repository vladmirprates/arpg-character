import { renderHook } from "@testing-library/react";
import { readStored, takeCorrupted, usePersistentState, writeStored } from "./usePersistentState";

const isNumber = (v: unknown): v is number => typeof v === "number";

describe("persistent storage", () => {
  test("round-trips valid values", () => {
    writeStored("n", 42);
    expect(readStored("n", isNumber)).toBe(42);
  });

  test("returns null for malformed JSON or values that fail validation", () => {
    localStorage.setItem("arpg:n", "{oops");
    expect(readStored("n", isNumber)).toBeNull();
    localStorage.setItem("arpg:n", '"a string"');
    expect(readStored("n", isNumber)).toBeNull();
  });

  test("survives storage that throws (private mode, quota)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeStored("n", 1)).not.toThrow();
    spy.mockRestore();
  });

  test("reports a corrupted saved value once, and falls back to the default", () => {
    takeCorrupted();
    localStorage.setItem("arpg:c", "{oops");
    const { result } = renderHook(() => usePersistentState("c", 7, isNumber));
    expect(result.current[0]).toBe(7);
    expect(takeCorrupted()).toEqual(["c"]);
    expect(takeCorrupted()).toEqual([]);
    // The unreadable value is dropped, so it isn't reported again on the next load.
    expect(localStorage.getItem("arpg:c")).toBeNull();
  });

  test("a missing value is not corruption", () => {
    takeCorrupted();
    localStorage.removeItem("arpg:missing");
    renderHook(() => usePersistentState("missing", 1, isNumber));
    expect(takeCorrupted()).toEqual([]);
  });
});
