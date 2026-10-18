import { RUNE_SEPARATOR, toRunes } from "./runes";

describe("toRunes", () => {
  test("transliterates letters and digraphs into Elder Futhark", () => {
    expect(toRunes("QA")).toBe("ᚲᚨ");
    expect(toRunes("thing")).toBe("ᚦᛁᛜ");
  });

  test("spaces become word separators and every letter maps to a rune", () => {
    const out = toRunes("Trust but verify");
    expect(out.split(RUNE_SEPARATOR)).toHaveLength(3);
    expect(out).not.toMatch(/[A-Za-z]/);
  });
});
