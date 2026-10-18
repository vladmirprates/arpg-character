import { ROOT_ID } from "../src/game/tree/data";
import { pathTo } from "../src/game/tree/graph";
import { expect, openTree, test } from "./fixtures";

const costFromStart = (id: string) => String(pathTo(id, new Set([ROOT_ID])).length);

test("the My Build tab is read-only", async ({ page }) => {
  const tree = await openTree(page);
  const points = tree.getByTestId("points");
  const before = await points.textContent();
  await tree.getByTestId("node-gm_audio").click({ force: true });
  await expect(points).toHaveText(before!);
});

test("Make Your Own allocates a path, persists, and shares", async ({ page, context }) => {
  const tree = await openTree(page);
  await tree.getByRole("tab", { name: "Make Your Own" }).click();
  await expect(tree.getByTestId("points")).toHaveText("0");
  // On wide screens the summary lies over the tree's right edge, where this node is: close it.
  const toggle = tree.getByTestId("toggle-summary");
  if ((await toggle.getAttribute("aria-expanded")) === "true") await toggle.click();
  await tree.getByTestId("node-tech_master").click({ force: true });
  await expect(tree.getByTestId("points")).toHaveText(costFromStart("tech_master"));

  await tree.getByRole("button", { name: "Copy share link" }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain("#tree=");

  const other = await context.newPage();
  await other.goto(url);
  const shared = other.getByRole("dialog", { name: "Passive Skill Tree" });
  await expect(shared.getByRole("tab", { name: "Make Your Own" })).toHaveAttribute("aria-selected", "true");
  await expect(shared.getByTestId("points")).toHaveText(costFromStart("tech_master"));
});

test("keyboard: Esc closes the tree and focus returns to the opener", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow");
  await page.goto("./");
  const opener = page.getByTestId("open-tree");
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Passive Skill Tree" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("keyboard: arrows walk the tree and Enter allocates", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow");
  const tree = await openTree(page);
  await tree.getByRole("tab", { name: "Make Your Own" }).click();
  await tree.getByTestId("node-start").focus();
  await page.keyboard.press("ArrowUp");
  await expect(tree.getByTestId("node-ring_0")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tree.getByTestId("node-ring_0")).toHaveAttribute("aria-pressed", "true");
});

test("node tooltips render above the modal dialog", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover interaction");
  const tree = await openTree(page);
  await tree.getByTestId("node-man_master").hover();
  // A modal dialog sits in the top layer; a tooltip outside it would be painted underneath.
  await expect(page.locator("dialog[open] .tooltip-layer")).toContainText("Manual Testing Mastery");
  await expect(page.locator("body > .tooltip-layer")).toHaveCount(0);
});

test("on a wide screen the build summary is a side panel the toggle collapses and restores", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "wide-screen layout (the phone sheet is tested below)");
  const tree = await openTree(page);
  const summary = tree.getByTestId("build-summary");
  const toggle = tree.getByTestId("toggle-summary");
  // A visible control must do something: this one once rendered on desktop wired to nothing
  // (a later `.btn { display }` rule beat the one that was meant to hide it).
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(summary).toBeVisible();
  // Zoom in somewhere first, so a re-fit would show.
  await tree.getByRole("button", { name: "Zoom in" }).click();
  const stage = tree.locator(".tree__stage");
  await expect.poll(() => stage.evaluate((el) => el.style.transform)).not.toBe("");
  const view = await stage.evaluate((el) => el.style.transform);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(summary).toBeHidden();
  // Toggling the panel must not zoom or move the tree.
  expect(await stage.evaluate((el) => el.style.transform), "view after closing the panel").toBe(view);

  await toggle.click();
  await expect(summary).toBeVisible();
  expect(await stage.evaluate((el) => el.style.transform), "view after reopening the panel").toBe(view);
  // Jumping to a node from the side panel keeps it open (only the phone sheet closes).
  await summary.getByRole("button").first().click();
  await expect(summary).toBeVisible();
});

test("on a phone the build summary is a sheet, closed until asked for", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout");
  const tree = await openTree(page);
  const summary = tree.getByTestId("build-summary");
  await expect(summary).toBeHidden();
  const toggle = tree.getByTestId("toggle-summary");
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(summary).toBeVisible();
  // Picking an entry closes the sheet and centres the tree on that node.
  await summary.getByRole("button").first().tap();
  await expect(summary).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
