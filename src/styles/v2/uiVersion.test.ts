import { applyUiVersion, DEFAULT_UI } from "./uiVersion";

describe("applyUiVersion", () => {
  it("defaults to v2", () => {
    const root = document.createElement("html");
    expect(applyUiVersion("", root)).toBe(DEFAULT_UI);
    expect(DEFAULT_UI).toBe("v2");
    expect(root.dataset.ui).toBe("v2");
  });

  it("honours ?ui=v1 and ?ui=v2", () => {
    const root = document.createElement("html");
    expect(applyUiVersion("?ui=v1", root)).toBe("v1");
    expect(root.dataset.ui).toBe("v1");
    expect(applyUiVersion("?perf&ui=v2", root)).toBe("v2");
    expect(root.dataset.ui).toBe("v2");
  });

  it("ignores unknown versions", () => {
    const root = document.createElement("html");
    expect(applyUiVersion("?ui=v3", root)).toBe(DEFAULT_UI);
  });
});
