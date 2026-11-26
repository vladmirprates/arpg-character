import { expect, seedRulesLayout, test } from "./fixtures";

// How items move is tested on a fixed arrangement, so the default layout can change freely.
test.beforeEach(({ page }) => seedRulesLayout(page));

const cell = (container: "bag" | "idols" | "altar" | "cube", index: number) =>
  `[data-container="${container}"][data-index="${index}"]`;

/** Where things start in the bag. */
const RELEASE = "bag-7"; // 4×1
const NOTES = "bag-14"; // 1×1
const HOURGLASS = "bag-15";
const CUBE = "bag-19"; // 2×2

test("drag an idol from the bag onto the board, and it stays there after a reload", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  await expect(page.getByTestId("resist-scope")).toHaveText(/72%/);
  const item = page.getByTestId(NOTES);
  const name = await item.getAttribute("aria-label");
  await item.dragTo(page.locator(cell("idols", 7)));
  await expect(page.getByTestId("idols-7")).toHaveAttribute("aria-label", name!);
  await expect(page.getByTestId(NOTES)).toHaveCount(0);
  await expect(page.getByTestId("resist-scope")).toHaveText(/75%/);

  await page.reload();
  await expect(page.getByTestId("idols-7")).toHaveAttribute("aria-label", name!);
  await expect(page.getByTestId("resist-scope")).toHaveText(/75%/);
});

test("the bag draws multi-cell items at their real size", async ({ page }) => {
  await page.goto("./");
  const one = (await page.getByTestId("bag-0").boundingBox())!;
  const wide = (await page.getByTestId(RELEASE).boundingBox())!;
  const cube = (await page.getByTestId(CUBE).boundingBox())!;
  expect(wide.width).toBeGreaterThan(one.width * 3.5);
  expect(cube.width).toBeGreaterThan(one.width * 1.7);
  expect(cube.height).toBeGreaterThan(one.height * 1.7);
});

test("an idol's icon sits in the middle of its shape", async ({ page }) => {
  await page.goto("./");
  // Both boxes are read in one frame, once fonts have settled: two separate reads could straddle a
  // layout change during load (which once measured a 7px "offset" that was really two layouts).
  await page.evaluate(() => document.fonts.ready);
  for (const id of ["idols-5", "idols-1", RELEASE, CUBE]) {
    const { dx, dy } = await page.getByTestId(id).evaluate((slot) => {
      const box = slot.getBoundingClientRect();
      const icon = slot.querySelector("svg")!.getBoundingClientRect();
      return {
        dx: box.x + box.width / 2 - (icon.x + icon.width / 2),
        dy: box.y + box.height / 2 - (icon.y + icon.height / 2),
      };
    });
    expect(Math.abs(dx), id).toBeLessThan(1.5);
    expect(Math.abs(dy), id).toBeLessThan(1.5);
  }
});

test("the board is centred in its panel and the socket doesn't overlap it", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout");
  await page.goto("./");
  const panel = (await page.locator(".idol-panel").boundingBox())!;
  const board = (await page.locator(".item-grid--idols").boundingBox())!;
  const socket = (await page.locator(".idol-socket").boundingBox())!;
  expect(Math.abs(panel.x + panel.width / 2 - (board.x + board.width / 2))).toBeLessThan(2);
  expect(socket.y + socket.height).toBeLessThanOrEqual(board.y);
});

test("drag the square idol onto the long one: it replaces it, and nothing is lost", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  const before = await page.locator(".item-grid .slot").count();
  const long = (await page.getByTestId("idols-5").boundingBox())!;
  // Drop on the long idol's lowest cell, not its top: the drop must use the real cell.
  await page.getByTestId("idols-8").hover();
  await page.mouse.down();
  await page.mouse.move(long.x + long.width / 2, long.y + long.height - 4, { steps: 8 });
  await page.mouse.up();
  // It landed on the long idol's old column, covering the cell it was dropped on.
  await expect(page.getByTestId("idols-15").or(page.getByTestId("idols-10"))).toHaveAccessibleName(/Exploration/);
  await expect(page.getByRole("alert")).toBeEmpty();
  // Regression moved rather than being refused or lost.
  await expect(page.locator(".item-grid--idols").getByRole("button", { name: /Regression/ })).toBeVisible();
  expect(await page.locator(".item-grid .slot").count()).toBe(before);
});

test("an idol can still be dragged after a refused placement", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  await page.getByTestId("bag-0").click();
  await page.getByRole("button", { name: "Place in the idol board, cell 8", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText("Only idols");
  // The currency is still held; dragging an idol now must simply work.
  await page.getByTestId(NOTES).dragTo(page.locator(cell("idols", 7)));
  await expect(page.getByTestId("idols-7")).toBeVisible();
});

test("a drop on a blocked cell snaps to a spot beside it", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  await page.getByTestId(NOTES).dragTo(page.locator(cell("idols", 12)));
  await expect(page.getByTestId(NOTES)).toHaveCount(0);
  await expect(page.locator(".item-grid--idols").getByRole("button", { name: /Patch Notes/ })).toBeVisible();
});

test("tap to pick up, tap to place (no dragging needed)", async ({ page }) => {
  await page.goto("./");
  const name = await page.getByTestId(NOTES).getAttribute("aria-label");
  await page.getByTestId(NOTES).click();
  await page.getByRole("button", { name: "Place in the idol board, cell 8", exact: true }).click();
  await expect(page.getByTestId("idols-7")).toHaveAttribute("aria-label", name!);
});

test("an altar reshapes the board and sends what no longer fits to the bag", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId(HOURGLASS).click();
  await page.getByRole("button", { name: "Place in the altar socket" }).click();
  await expect(page.getByTestId("altar-0")).toBeVisible();
  await expect(page.locator('[data-empowered="true"]').first()).toBeVisible();
  await expect(page.getByTestId("idols-8")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("altar-0")).toBeVisible();
});

test("the cube opens into its own grid; dragged items transmute and the result survives a reload", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "mouse drag");
  await page.goto("./");
  await page.getByTestId(CUBE).dblclick();
  const dialog = page.getByRole("dialog", { name: "Triage Cube" });
  await expect(dialog.getByRole("list", { name: "Triage Cube" }).getByRole("listitem")).toHaveCount(16);

  // Drag the three currencies in: scroll, mirror, whetstone (the bag's cells 0, 3, 4).
  for (const [from, to] of [
    [0, 0],
    [3, 1],
    [4, 2],
  ] as const) {
    await dialog.getByTestId(`bag-${from}`).dragTo(dialog.locator(cell("cube", to)));
  }
  await dialog.getByTestId("cube-transmute").click();
  await expect(dialog.getByTestId("cube-result")).toContainText("The Perfect Bug Report");
  await expect(dialog.getByTestId("cube-3")).toHaveAccessibleName("The Perfect Bug Report");
  await expect(dialog.getByTestId("cube-0")).toHaveAccessibleName("Scroll of Documentation (19)"); // one used up

  await page.reload();
  await page.getByTestId(CUBE).dblclick();
  const reopened = page.getByRole("dialog", { name: "Triage Cube" });
  await expect(reopened).toContainText("Recipes discovered: 1 of 4");
  await expect(reopened.getByTestId("cube-0")).toHaveAccessibleName("Scroll of Documentation (19)");
});

test("the cube's grid is square and its window fits its content", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout");
  await page.goto("./");
  await page.getByTestId(CUBE).dblclick();
  const dialog = page.getByRole("dialog", { name: "Triage Cube" });
  const grid = (await dialog.locator(".item-grid--cube").boundingBox())!;
  expect(Math.abs(grid.width - grid.height)).toBeLessThan(2);
  const inner = (await dialog.locator(".modal__inner").boundingBox())!;
  const lastLine = (await dialog.locator(".cube__heading").boundingBox())!;
  expect(inner.y + inner.height - (lastLine.y + lastLine.height)).toBeLessThan(40); // no blank space below
});

test("on a phone the cube works by tapping, without dragging", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId(CUBE).dblclick();
  const dialog = page.getByRole("dialog", { name: "Triage Cube" });
  await dialog.getByTestId("bag-0").click();
  await dialog.getByRole("button", { name: "Place in the cube, cell 1", exact: true }).click();
  await expect(dialog.getByTestId("cube-0")).toBeVisible();
});
