import { expect, test } from "./fixtures";

/**
 * The bug hunt minigame. Skills are cast by tapping/clicking the skill buttons, so these run on
 * both desktop and phone; only the keyboard-only flow is desktop-specific.
 */
test.describe("bug hunt", () => {
  test("capturing without revealing a bug fails and costs nothing", async ({ page }) => {
    await page.goto("./");
    await page.waitForSelector("[data-bug-id]", { state: "attached" });
    await page.getByTestId("skill-W").click();
    await expect(page.getByRole("alert")).toContainText("reveal the anomaly");
    // The globes are hidden on small screens, so read the meter directly rather than by visible role.
    await expect(page.locator('[role="meter"][aria-label="Coffee"]')).toHaveAttribute("aria-valuenow", "100");
  });

  test("tap Inspect, tap the bug, tap Capture: a ticket is filed", async ({ page }) => {
    await page.goto("./");
    const bug = page.locator("[data-bug-id]").first();
    await bug.waitFor({ state: "attached" });

    await page.getByTestId("skill-Q").click();
    await expect(page.getByTestId("inspect-overlay")).toBeVisible();
    // Bugs crawl: aim at where it is right now.
    const box = (await bug.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator(".hunt-bug.is-revealed")).toHaveCount(1);

    await page.waitForTimeout(700); // Inspect's cooldown, so the next tap isn't swallowed
    await page.getByTestId("skill-W").click();
    const ticket = page.getByTestId("ticket");
    await expect(ticket).toBeVisible();
    await expect(ticket).toContainText(/QA-\d{4}/);
  });

  test("inspect → reveal → capture files a ticket (keyboard only)", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard-only flow");
    await page.goto("./");
    await page.waitForSelector("[data-bug-id]", { state: "attached" });

    await page.keyboard.press("q");
    await expect(page.getByTestId("inspect-overlay")).toBeVisible();
    await page.keyboard.press("Enter"); // keyboard alternative to clicking the bug
    await expect(page.getByRole("status")).toContainText("Found it:");
    await expect(page.locator(".hunt-bug.is-revealed")).toHaveCount(1);

    await page.keyboard.press("w");
    const ticket = page.getByTestId("ticket");
    await expect(ticket).toBeVisible();
    await expect(ticket.getByRole("heading", { level: 2 })).toContainText(/panel/);
    await expect(ticket).toContainText(/QA-\d{4}/);

    await ticket.getByRole("button", { name: "Copy ticket" }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("Steps to reproduce:");
    await ticket.getByRole("button", { name: "Close ticket" }).click();
    await expect(ticket).toHaveCount(0);
  });

  test("clicking an ordinary element in inspect mode reports it", async ({ page }) => {
    await page.goto("./");
    await page.getByTestId("skill-Q").click();
    const helmet = await page.getByTestId("equip-helmet").boundingBox();
    await page.mouse.click(helmet!.x + helmet!.width / 2, helmet!.y + helmet!.height / 2);
    await expect(page.getByRole("status")).toContainText("Inspected button.slot");
  });
});
