import type { Page } from "@playwright/test";
import { expect, openBench, test } from "./fixtures";

/**
 * The certification checklist (src/data/certification.ts), as tests. Each title carries its
 * checklist ID in brackets: scripts/qa-report.mjs reads the results back by that tag, and the
 * in-app checklist shows them. A unit test fails if any checklist ID has no tagged test.
 */

/** Emulates the tab being hidden or shown again (what a console calls suspend / resume). */
async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((h) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => h });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (h ? "hidden" : "visible") });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

const coffeeLevel = async (page: Page) =>
  Number(await page.getByRole("meter", { name: "Coffee" }).getAttribute("aria-valuenow"));

test.describe("save data", () => {
  test("[CERT-SAVE-01] corrupted save data doesn't crash: defaults load and the player is told", async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("arpg:locale", "{not json");
      localStorage.setItem("arpg:items", '{"bag": "nope"}');
      localStorage.setItem("arpg:bounty", '{"active": "yes"}');
      localStorage.setItem("arpg:achievements", "42");
      localStorage.setItem("arpg:sound", '"loud"');
    });
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vladmir Prates");
    await expect(page.getByRole("alert")).toContainText("Some saved data couldn't be read");
    // Defaults: English, sound on, an empty achievement board.
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "Sound on" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("open-achievements")).toContainText("0 of");
    // The unreadable values were dropped, so the warning doesn't come back.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("alert")).toBeEmpty();
  });

  test("[CERT-SAVE-02] progress survives a reload", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: "PT-BR" }).click();
    await page.getByRole("button", { name: "Som ligado" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("button", { name: "Som desligado" })).toHaveAttribute("aria-pressed", "false");
    await page.getByTestId("open-achievements").click();
    await expect(page.getByTestId("ach-polyglot")).toHaveAttribute("data-unlocked", "true");
  });

  test("[CERT-SAVE-03] storage that throws (private mode, full quota) doesn't block play", async ({ page }) => {
    await page.addInitScript(() => {
      const fail = () => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      };
      Storage.prototype.setItem = fail;
      Storage.prototype.getItem = fail;
    });
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vladmir Prates");
    // Everything still works for this visit; it just isn't remembered.
    await page.getByRole("button", { name: "PT-BR" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Atributos" })).toBeVisible();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    const bench = await openBench(page);
    await bench.getByTestId("orb-transmute").click();
    await bench.getByTestId("item-slot").click();
    await expect(bench.getByTestId("crafted-item")).toHaveAttribute("data-rarity", "magic");
  });
});

test.describe("suspend and resume", () => {
  test.use({ reducedMotion: "no-preference" });

  test("[CERT-SUSP-01] a hidden tab pauses animation and game time; resuming picks up where it was", async ({
    page,
  }) => {
    await page.goto("./");
    await page.getByTestId("skill-R").click();
    await expect.poll(() => coffeeLevel(page)).toBeLessThan(100);
    const ember = page.locator(".ember-field span").first();
    // (Background animation also pauses under an open dialog, so check it with none open.)
    await expect(ember).toHaveCSS("animation-play-state", "running");

    await setHidden(page, true);
    await expect(page.locator("html")).toHaveAttribute("data-suspended", "");
    await expect(ember).toHaveCSS("animation-play-state", "paused");
    // Coffee regenerates with game time, which stops while suspended.
    const before = await coffeeLevel(page);
    await page.waitForTimeout(1500);
    expect(await coffeeLevel(page)).toBe(before);

    await setHidden(page, false);
    await expect(page.locator("html")).not.toHaveAttribute("data-suspended", "");
    await expect(ember).toHaveCSS("animation-play-state", "running");
    await expect.poll(() => coffeeLevel(page)).toBeGreaterThan(before);

    // An open dialog, and what's in it, survive a suspend.
    await page.getByTestId("open-quests").click();
    const log = page.getByRole("dialog", { name: "Quest Log" });
    await log.getByRole("tab", { name: "Side Quests" }).click();
    await setHidden(page, true);
    await setHidden(page, false);
    await expect(log).toBeVisible();
    await expect(log.getByRole("tab", { name: "Side Quests" })).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("errors and network", () => {
  test("[CERT-ERR-01] going offline shows a clear message instead of hanging", async ({
    page,
    context,
    consoleErrors,
  }) => {
    await page.goto("./");
    await context.setOffline(true);
    await page.getByTestId("open-qa").click();
    await expect(page.getByRole("dialog", { name: "QA Report" })).toContainText("No report yet");
    await page.keyboard.press("Escape");
    await page.getByTestId("open-cert").click();
    await expect(page.getByRole("dialog", { name: "Certification" })).toContainText("No pipeline results here");
    await context.setOffline(false);
    // The failed requests are the point of this test: the browser logging them isn't an app error.
    const unexpected = consoleErrors.filter(
      (e) => !/Failed to (load resource|fetch)|ERR_INTERNET_DISCONNECTED/.test(e),
    );
    consoleErrors.splice(0, consoleErrors.length, ...unexpected);
  });

  test("[CERT-ERR-02] errors are plain, localized sentences", async ({ page }) => {
    const bench = await openBench(page);
    // Alteration needs a Magic item; the bench starts with a Normal one.
    await bench.getByTestId("orb-alteration").click();
    await bench.getByTestId("item-slot").click();
    await expect(page.getByRole("alert")).toHaveText("Item must be Magic");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "PT-BR" }).click();
    await page.getByTestId("open-bench").click();
    const bancada = page.getByRole("dialog", { name: "Bancada de Criação" });
    await bancada.getByTestId("orb-alteration").click();
    await bancada.getByTestId("item-slot").click();
    await expect(page.getByRole("alert")).toHaveText("O item precisa ser Mágico");
  });
});

test.describe("accessibility settings", () => {
  test("[CERT-A11Y-02] the system's reduced-motion setting turns ambient motion off", async ({ page }) => {
    // The fixture already emulates prefers-reduced-motion: reduce.
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "");
    await expect(page.locator(".ember-field")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".ember-field")).toHaveCount(1);
  });
});

test.describe("first boot language", () => {
  test.use({ locale: "pt-BR" });

  test("[CERT-LOC-02] a Brazilian Portuguese system gets PT-BR on the first visit", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("heading", { level: 2, name: "Atributos" })).toBeVisible();
    // An explicit choice wins over the system language from then on.
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
