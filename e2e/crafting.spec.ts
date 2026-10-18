import type { Locator } from "@playwright/test";
import { expect, openBench, test } from "./fixtures";

/** PoE-style: pick the orb up, then click the item. */
async function craft(bench: Locator, orb: string) {
  await bench.getByTestId(`orb-${orb}`).click();
  await bench.getByTestId("item-slot").click();
}

test("craft an item from Normal to Rare", async ({ page }) => {
  const bench = await openBench(page);
  const item = bench.getByTestId("crafted-item");
  await expect(item).toHaveAttribute("data-rarity", "normal");
  await craft(bench, "transmute");
  await expect(item).toHaveAttribute("data-rarity", "magic");
  await craft(bench, "regal");
  await expect(item).toHaveAttribute("data-rarity", "rare");
});

test("Shift keeps the orb on the cursor; Esc puts it back", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard modifiers");
  const bench = await openBench(page);
  await craft(bench, "transmute");
  await bench.getByTestId("orb-alteration").click();
  await page.keyboard.down("Shift");
  await bench.getByTestId("item-slot").click();
  await bench.getByTestId("item-slot").click();
  await page.keyboard.up("Shift");
  await expect(bench.getByTestId("orb-alteration")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(bench.getByTestId("orb-alteration")).toHaveAttribute("aria-pressed", "false");
  // Esc only dropped the orb: the bench is still open.
  await expect(bench).toBeVisible();
});

test("dragging an orb onto the item applies it", async ({ page, isMobile }) => {
  test.skip(isMobile, "drag is exercised with a mouse");
  const bench = await openBench(page);
  await bench.getByTestId("orb-transmute").dragTo(bench.getByTestId("crafted-item"));
  await expect(bench.getByTestId("crafted-item")).toHaveAttribute("data-rarity", "magic");
});

test("a kept item survives a reload and reopens in the bench", async ({ page }) => {
  const bench = await openBench(page);
  await craft(bench, "transmute");
  const name = (await bench.getByTestId("crafted-item").locator(".item-card__name").textContent())!;
  await bench.getByRole("button", { name: "Keep item" }).click();
  await bench.getByRole("button", { name: "Close" }).click();

  await page.reload();
  const stashed = page.getByTestId("stash-0");
  await expect(stashed).toHaveAccessibleName(name);
  await stashed.dblclick();
  const reopened = page.getByRole("dialog", { name: "Crafting Bench" });
  await expect(reopened.getByTestId("crafted-item").locator(".item-card__name")).toHaveText(name);
});

test("a repro link reproduces the exact same item", async ({ page, context }) => {
  const bench = await openBench(page);
  for (const orb of ["transmute", "augmentation", "regal", "exalted", "chaos"]) {
    await craft(bench, orb);
  }
  const expected = await bench.getByTestId("crafted-item").getAttribute("aria-label");
  await bench.getByRole("button", { name: "Copy repro link" }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/#craft=bug\.[0-9a-f]+\.\d+$/);

  const fresh = await context.newPage();
  await fresh.goto(url);
  const item = fresh.getByRole("dialog", { name: "Crafting Bench" }).getByTestId("crafted-item");
  await expect(item).toHaveAttribute("aria-label", expected!);
});

test("bug report export reads like a real ticket", async ({ page }) => {
  const bench = await openBench(page);
  await craft(bench, "chaos");
  await craft(bench, "transmute");
  await bench.getByRole("button", { name: "Copy bug report" }).click();
  const report = await page.evaluate(() => navigator.clipboard.readText());
  expect(report).toContain("Steps to reproduce");
  expect(report).toContain("FAIL — Item must be Rare");
  expect(report).toContain("Repro link:");
});

test("on a phone a tap on an orb uses it straight away, with nothing left on the cursor", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "touch flow");
  const bench = await openBench(page);
  const item = bench.getByTestId("crafted-item");
  await bench.getByTestId("orb-transmute").tap();
  await expect(item).toHaveAttribute("data-rarity", "magic");
  await expect(bench.getByTestId("orb-transmute")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".orb-ghost")).toHaveCount(0);
  await expect(bench.getByText("Tap a currency to use it on the item.")).toBeVisible();
  // The docked currency tab stays on screen while the item grows above it.
  await bench.getByTestId("orb-regal").tap();
  await expect(item).toHaveAttribute("data-rarity", "rare");
  await expect(bench.getByTestId("orb-exalted")).toBeInViewport();
});
