import { expect, openTree, test } from "./fixtures";

/**
 * Visual regression snapshots, tagged @visual. Baselines are platform-specific, so CI (Linux)
 * owns them: run the "Update visual baselines" workflow to (re)generate.
 */
test.describe("@visual", () => {
  // Level and experience follow the calendar: pin the date so the snapshots don't drift daily.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-17T12:00:00"));
  });

  test("character sheet", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveScreenshot("sheet.png", { fullPage: true });
  });

  test("passive tree — my build", async ({ page }) => {
    await openTree(page);
    await expect(page).toHaveScreenshot("tree.png");
  });
});
