import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, openBench, openTree, test } from "./fixtures";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
}

test("main sheet has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("./");
  await expectNoViolations(page);
});

test("passive tree dialog has no WCAG A/AA violations", async ({ page }) => {
  await openTree(page);
  await expectNoViolations(page);
});

test("crafting bench dialog has no WCAG A/AA violations", async ({ page }) => {
  const bench = await openBench(page);
  await bench.getByTestId("orb-transmute").click();
  await bench.getByTestId("item-slot").click();
  // Also scan with an orb on the cursor (the pressed/targeted state).
  await bench.getByTestId("orb-alteration").click();
  await expectNoViolations(page);
});

test("quest log dialog has no WCAG A/AA violations", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-quests").click();
  const log = page.getByRole("dialog", { name: "Quest Log" });
  await expect(log.getByRole("tab", { name: /Act IV/ })).toHaveAttribute("aria-selected", "true");
  await expectNoViolations(page);
  await log.getByRole("tab", { name: "Side Quests" }).click();
  await expectNoViolations(page);
});

test("divination cards: no WCAG violations, and Esc closes only the zoomed card", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-cards").click();
  const gallery = page.getByRole("dialog", { name: "Divination Cards" });
  await expect(gallery).toBeVisible();
  await expectNoViolations(page);

  await gallery.getByTestId("card-lucas-duarte").click();
  await expect(page.getByRole("dialog", { name: /The Foreseer/ })).toBeVisible();
  await expectNoViolations(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /The Foreseer/ })).toBeHidden();
  await expect(gallery).toBeVisible();
});

test("Find the Bugs and QA Report dialogs have no WCAG A/AA violations", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-bounty").click();
  await expectNoViolations(page); // the explanation and start button
  await page.getByTestId("bounty-start").click();
  await page.getByRole("dialog", { name: "Find the Bugs" }).getByRole("button", { name: "Hint" }).first().click();
  await expectNoViolations(page); // the board mid-hunt
  await page.keyboard.press("Escape");
  await expectNoViolations(page); // the sheet with the bugs planted
  await page.keyboard.press("Escape");
  await page.getByTestId("open-qa").click();
  await expect(page.getByRole("dialog", { name: "QA Report" })).toBeVisible();
  await expectNoViolations(page);
});
