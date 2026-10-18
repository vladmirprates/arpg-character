import { expect, test } from "./fixtures";

const cell = (container: "bag" | "stash", index: number) => `[data-container="${container}"][data-index="${index}"]`;

test("drag an item from the bag into the stash, and it stays there after a reload", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  const item = page.getByTestId("bag-0");
  const name = await item.getAttribute("aria-label");
  await item.dragTo(page.locator(cell("stash", 5)));
  await expect(page.getByTestId("stash-5")).toHaveAttribute("aria-label", name!);
  await expect(page.getByTestId("bag-0")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("stash-5")).toHaveAttribute("aria-label", name!);
});

test("tap to pick up, tap to place (no dragging needed)", async ({ page }) => {
  await page.goto("./");
  const name = await page.getByTestId("bag-1").getAttribute("aria-label");
  await page.getByTestId("bag-1").click();
  await page.getByRole("button", { name: "Place in the stash, cell 1", exact: true }).click();
  await expect(page.getByTestId("stash-0")).toHaveAttribute("aria-label", name!);
});
