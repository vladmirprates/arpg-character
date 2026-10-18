import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const planted = (page: Page, id?: string) => page.locator(id ? `[data-planted-bug="${id}"]` : "[data-planted-bug]");

async function startHunt(page: Page) {
  await page.getByTestId("open-bounty").click();
  await page.getByTestId("bounty-start").click();
  // The board switches to the hunt view (progress and hints); close it to start hunting.
  const board = page.getByRole("dialog", { name: "Find the Bugs" });
  await expect(board.getByText("0 of 5 found")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(board).toBeHidden();
}

/** Inspect Element, then click the centre of the affected element — like a visitor would. */
async function inspect(page: Page, target: Locator, wait = true) {
  await target.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await target.boundingBox())!;
  await page.getByTestId("skill-Q").click();
  await expect(page.getByTestId("inspect-overlay")).toBeVisible();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId("inspect-overlay")).toBeHidden();
  if (wait) await page.waitForTimeout(700); // Inspect's cooldown
}

async function craftAndKeep(page: Page) {
  await page.getByTestId("open-bench").click();
  const bench = page.getByRole("dialog", { name: "Crafting Bench" });
  for (const orb of ["transmute", "augmentation"]) {
    await bench.getByTestId(`orb-${orb}`).click();
    await bench.getByTestId("item-slot").click();
  }
  await bench.getByRole("button", { name: "Keep item" }).click();
  await page.keyboard.press("Escape");
  await expect(bench).toBeHidden();
}

test("the page is clean until a hunt starts; functional bugs only show once triggered", async ({ page }) => {
  await page.goto("./");
  await expect(planted(page)).toHaveCount(0);
  await startHunt(page);
  // Visible bugs are on the page straight away…
  await expect(planted(page, "requirement")).toHaveCount(1);
  await expect(planted(page, "stack")).toHaveCount(1);
  // …functional ones leave no trace until the feature is used.
  for (const id of ["overdraft", "stale-save", "dupe"]) await expect(planted(page, id)).toHaveCount(0);
});

test("stale save: keeping a craft stashes the previous version; inspecting it reports the bug", async ({ page }) => {
  await page.goto("./");
  await startHunt(page);
  await craftAndKeep(page);
  const stashed = page.getByTestId("stash-0");
  await expect(stashed).toHaveAttribute("data-planted-bug", "stale-save");
  await inspect(page, stashed);
  await expect(page.getByTestId("open-bounty")).toContainText("1/5");
  await expect(planted(page, "stale-save")).toHaveCount(0);
});

test("dupe: Ctrl+click copies instead of moving; finding it removes the copy", async ({ page }) => {
  await page.goto("./");
  await startHunt(page);
  const original = await page.getByTestId("bag-0").getAttribute("aria-label");
  await page.getByTestId("bag-0").click({ modifiers: ["Control"] });
  await expect(page.getByTestId("bag-0")).toHaveAttribute("aria-label", original!); // still in the bag…
  const copy = page.getByTestId("stash-0");
  await expect(copy).toHaveAttribute("aria-label", original!); // …and in the stash
  await expect(copy).toHaveAttribute("data-planted-bug", "dupe");

  await inspect(page, copy);
  await expect(page.getByTestId("open-bounty")).toContainText("1/5");
  await expect(page.getByTestId("stash-0")).toHaveCount(0); // the duplicate is gone
  await expect(page.getByTestId("bag-0")).toHaveAttribute("aria-label", original!);
});

test("overdraft: Coffee goes negative; finding it restores a legal value", async ({ page }) => {
  // Freeze time so Coffee regeneration can't hide the overdraft.
  await page.clock.install();
  await page.goto("./");
  await startHunt(page);
  await page.clock.pauseAt(Date.now() + 60_000);
  for (const key of ["R", "E", "T"]) await page.getByTestId(`skill-${key}`).click(); // 60 + 30 + 15 = 105
  await page.getByRole("button", { name: "Leave meeting" }).click();
  const coffee = page.locator('[role="meter"][aria-label="Coffee"]');
  await expect(coffee).toHaveAttribute("aria-valuenow", "-5");

  await inspect(page, page.locator('ul.skills[data-planted-bug="overdraft"]'), false);
  await expect(page.getByTestId("open-bounty")).toContainText("1/5");
  await expect(coffee).toHaveAttribute("aria-valuenow", "0");
});

test("all five found: the hunt ends with a clean page and every report filed", async ({ page }) => {
  await page.clock.install();
  await page.goto("./");
  await startHunt(page);
  await page.clock.pauseAt(Date.now() + 60_000);
  const advance = () => page.clock.runFor(700); // Inspect's cooldown, on the frozen clock
  await inspect(page, planted(page, "requirement"), false);
  await advance();
  await inspect(page, planted(page, "stack"), false);
  await advance();
  await craftAndKeep(page);
  await inspect(page, planted(page, "stale-save"), false);
  await advance();
  await page.getByTestId("bag-1").click({ modifiers: ["Control"] });
  await inspect(page, planted(page, "dupe"), false);
  await advance();
  await expect(page.getByTestId("open-bounty")).toContainText("4/5");

  // Overdraft last: Coffee is around 90 (4 inspects spent 20, regen gave some back); 105 more overdraws it.
  for (const key of ["R", "E", "T"]) await page.getByTestId(`skill-${key}`).click();
  await page.getByRole("button", { name: "Leave meeting" }).click();
  await inspect(page, page.locator('ul.skills[data-planted-bug="overdraft"]'), false);

  await expect(planted(page)).toHaveCount(0);
  await page.getByTestId("open-bounty").click();
  const board = page.getByRole("dialog", { name: "Find the Bugs" });
  await expect(board.getByText("Bounty complete!")).toBeVisible();
  await expect(board.getByText("Steps to reproduce").first()).toBeVisible();
});

test("giving up fixes the page, including any duplicates", async ({ page }) => {
  await page.goto("./");
  await startHunt(page);
  await page.getByTestId("bag-0").click({ modifiers: ["Control"] });
  await expect(page.getByTestId("stash-0")).toBeVisible();
  await page.getByTestId("open-bounty").click();
  await page.getByRole("button", { name: "Give up and fix the page" }).click();
  await page.keyboard.press("Escape");
  await expect(planted(page)).toHaveCount(0);
  await expect(page.getByTestId("stash-0")).toHaveCount(0);
});

test("inspecting an ordinary element finds nothing", async ({ page }) => {
  await page.goto("./");
  await startHunt(page);
  await inspect(page, page.locator(".frame__title").first());
  await expect(page.getByTestId("open-bounty")).toContainText("0/5");
});

test("keyboard: Q, Tab to the culprit, Enter", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow");
  await page.goto("./");
  await startHunt(page);
  const target = (await planted(page, "requirement").boundingBox())!;
  await page.keyboard.press("q");
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press("Tab");
    const at = await page
      .locator(".inspect-box")
      .evaluate((el) => el.getBoundingClientRect())
      .catch(() => null);
    if (at && Math.abs(at.x - target.x) < 1 && Math.abs(at.y - target.y) < 1) break;
  }
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("open-bounty")).toContainText("1/5");
});
