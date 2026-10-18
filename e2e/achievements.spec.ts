import { expect, openBench, test } from "./fixtures";

/** Achievements are tested as event tracking: do the thing, check the event was counted. */

test("crafting a Rare unlocks Rare Find, with a toast and a persisted record", async ({ page }) => {
  const bench = await openBench(page);
  for (const orb of ["transmute", "regal"]) {
    await bench.getByTestId(`orb-${orb}`).click();
    await bench.getByTestId("item-slot").click();
  }
  // The popup itself (the visual toast list, which stays up while it's being read).
  await expect(page.locator(".toasts")).toContainText("Achievement unlocked: Rare Find");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("ach-rare-find")).toHaveAttribute("data-unlocked", "true");
  await expect(page.getByTestId("ach-vaal-it")).toHaveAttribute("data-unlocked", "false");
});

test("reading cards counts distinct cards only", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-cards").click();
  const gallery = page.getByRole("dialog", { name: "Divination Cards" });
  for (const id of ["lucas-duarte", "lucas-duarte"]) {
    await gallery.getByTestId(`card-${id}`).click();
    await page.getByRole("button", { name: "Close", exact: true }).last().click();
  }
  await page.keyboard.press("Escape");
  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("ach-full-set")).toContainText(/^.*1\/\d+$/);
});

test("finding a planted bug unlocks First Blood", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-bounty").click();
  await page.getByTestId("bounty-start").click();
  await page.keyboard.press("Escape");
  // "requirement" is one of the bugs that is visible straight away: Inspect Element (Q), then click it.
  const planted = page.locator('[data-planted-bug="requirement"]');
  await planted.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await planted.boundingBox())!;
  await page.getByTestId("skill-Q").click();
  await expect(page.getByTestId("inspect-overlay")).toBeVisible();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // Check the tracked state, not the toast: live-region text is transient by design, and under load
  // a later announcement can replace it before the assertion polls (this was a flaky test).
  await expect(page.getByTestId("open-bounty")).toContainText("1 of 5 found");
  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("ach-first-blood")).toHaveAttribute("data-unlocked", "true");
});

test("progress can be reset", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "PT-BR" }).click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByTestId("open-achievements").click();
  const panel = page.getByRole("dialog", { name: "Achievements" });
  await expect(panel.getByTestId("ach-polyglot")).toHaveAttribute("data-unlocked", "true");
  await panel.getByRole("button", { name: "Reset progress" }).click();
  await expect(panel.getByTestId("ach-polyglot")).toHaveAttribute("data-unlocked", "false");
  await expect(panel.getByRole("button", { name: "Reset progress" })).toBeDisabled();
});
