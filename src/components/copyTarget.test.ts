import { afterEach, vi } from "vitest";
import { clearCopyTarget, copyToClipboard, getCopyText, setCopyTarget } from "./copyTarget";

afterEach(() => {
  setCopyTarget(null);
  vi.unstubAllGlobals();
});

describe("Ctrl+C copy target", () => {
  test("the hovered or focused item provides the text", () => {
    expect(getCopyText()).toBeNull();
    setCopyTarget(() => "Rarity: Unique");
    expect(getCopyText()).toBe("Rarity: Unique");
  });

  test("leaving an item only clears it if it is still the target", () => {
    const first = () => "first";
    const second = () => "second";
    setCopyTarget(first);
    setCopyTarget(second); // the pointer moved on before `first` cleaned up
    clearCopyTarget(first);
    expect(getCopyText()).toBe("second");
    clearCopyTarget(second);
    expect(getCopyText()).toBeNull();
  });

  test("copying reports success, and failure when the clipboard is blocked", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");

    vi.stubGlobal("navigator", { clipboard: { writeText: () => Promise.reject(new Error("denied")) } });
    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });
});
