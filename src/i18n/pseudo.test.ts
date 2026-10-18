import { EXPANSION, pseudoize, PSEUDO_CLOSE, PSEUDO_OPEN } from "./pseudo";

describe("pseudoize", () => {
  it("accents every ASCII letter, wraps the text and pads it", () => {
    expect(pseudoize("Skill Tree")).toBe("⟦Šķîļļ Ţŕéé ~~~~⟧");
  });

  it("leaves no plain ASCII letter behind", () => {
    const all = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    expect(pseudoize(all)).not.toMatch(/[A-Za-z]/);
  });

  it("keeps digits, punctuation and existing accents", () => {
    expect(pseudoize("Nível 25: 100%!")).toMatch(/^⟦Ñíṽéļ 25: 100%! ~+⟧$/);
  });

  it("grows the text by about the expansion budget", () => {
    const text = "Not enough Coffee";
    const out = pseudoize(text);
    const added = out.length - text.length - PSEUDO_OPEN.length - PSEUDO_CLOSE.length - 1;
    expect(added).toBe(Math.round(text.length * EXPANSION));
  });

  it("always pads short strings by at least one character", () => {
    expect(pseudoize("OK")).toBe("⟦ÖĶ ~⟧");
  });

  it("keeps {placeholders} intact for t() to fill in", () => {
    expect(pseudoize("Cast {name} now")).toBe("⟦Çášţ {name} ñöŵ ~~~~~⟧");
  });

  it("accents {markup} content in content strings when asked", () => {
    expect(pseudoize("Adds {10} to {20}", false)).toBe("⟦Åððš {10} ţö {20} ~~~~~~⟧");
  });

  it("keeps item markup brackets, so Markup still parses them", () => {
    expect(pseudoize("[Bug] ((warn))", false)).toBe("⟦[Ɓûĝ] ((ŵáŕñ)) ~~~~~⟧");
  });

  it("returns empty and blank strings unchanged", () => {
    expect(pseudoize("")).toBe("");
    expect(pseudoize("  ")).toBe("  ");
  });
});
