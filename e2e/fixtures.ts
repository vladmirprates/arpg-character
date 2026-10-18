import { test as base, expect, type Page } from "@playwright/test";

/** English UI, reduced motion for stable timing, and a fail-on-console-error guard. */
export const test = base.extend<{ consoleErrors: string[] }>({
  locale: "en-US",
  reducedMotion: "reduce",
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function openBench(page: Page) {
  await page.goto("./");
  await page.getByTestId("open-bench").click();
  return page.getByRole("dialog", { name: "Crafting Bench" });
}

export async function openTree(page: Page) {
  await page.goto("./");
  await page.getByTestId("open-tree").click();
  return page.getByRole("dialog", { name: "Passive Skill Tree" });
}
