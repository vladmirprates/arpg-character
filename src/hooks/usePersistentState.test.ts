import { readStored, writeStored } from "./usePersistentState";

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
});
