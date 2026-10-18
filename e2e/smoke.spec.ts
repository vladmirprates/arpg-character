import { expect, test } from "./fixtures";

test("character sheet renders every panel", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vladmir Prates");
  for (const name of ["Attributes", "Stash", "Inventory"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByTestId("equip-helmet")).toBeVisible();
});

test("hovering an item shows its tooltip, Ctrl+C copies it", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover + keyboard shortcut is a desktop interaction");
  await page.goto("./");
  await page.getByTestId("equip-weapon1").hover();
  await expect(page.locator(".tooltip-layer")).toContainText("The Null Pointer");
  await page.keyboard.press("ControlOrMeta+c");
  await expect(page.getByRole("status")).toHaveText("Item copied to clipboard");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("Rarity: Unique");
  expect(clip).toContain("Adds 10 to 20 Scripts per Commit");
});

test("language toggle switches to Portuguese and persists", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "PT-BR" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Atributos" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});

test("skills cast from the keyboard and respect cooldowns", async ({ page, isMobile }) => {
  test.skip(isMobile, "hotkeys are a desktop interaction");
  await page.goto("./");
  await expect(page.getByTestId("skill-R")).toBeVisible();
  const coffee = page.getByRole("meter", { name: "Coffee" });
  // R has an 8s cooldown, so the second press is reliably still on cooldown even on a slow CI box.
  await page.keyboard.press("r");
  await expect(page.getByRole("status")).toContainText("PRODUCTION IS DOWN");
  await expect(coffee).not.toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("r");
  await expect(page.getByRole("alert")).toHaveText("Skill is on cooldown");
});

for (const width of [320, 360, 390, 412]) {
  test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("./");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}
