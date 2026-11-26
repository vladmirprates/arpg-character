import { expect, test } from "./fixtures";

/**
 * Two looks ship side by side: v2 (the default) is a style layer over v1, chosen by `?ui=` and
 * marked on the root element (src/styles/v2/uiVersion.ts). The panel titles' typeface is the
 * cheapest visible difference: v2 sets them in Alegreya, v1 in Marcellus SC.
 */
const titleFont = (page: import("@playwright/test").Page) =>
  page
    .locator(".frame__title")
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily);

test("v2 is the default look", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-ui", "v2");
  expect(await titleFont(page)).toContain("Alegreya");
});

test("?ui=v1 shows the original look", async ({ page }) => {
  await page.goto("./?ui=v1");
  await expect(page.locator("html")).toHaveAttribute("data-ui", "v1");
  expect(await titleFont(page)).toContain("Marcellus");
});

test("an unknown ?ui value falls back to v2", async ({ page }) => {
  await page.goto("./?ui=v3");
  await expect(page.locator("html")).toHaveAttribute("data-ui", "v2");
});
