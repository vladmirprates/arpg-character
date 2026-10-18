import { expect, test } from "./fixtures";

/**
 * Performance budget for a scripted play session (pan and zoom the passive tree, craft with
 * particle bursts, cast skills) with full motion on. Runs alone, with one worker (npm run e2e:perf).
 *
 * The headline number is main-thread utilization, read from Chrome's own task accounting (CDP
 * Performance.getMetrics): the share of wall time the page spends running script, style, layout
 * and paint. That's the part the app controls, and it doesn't depend on the machine's GPU.
 *
 * Frame rate is measured too (by the in-game overlay's probe), but CI runners have no GPU: Chromium
 * composites in software there and even the idle sheet tops out near 37 fps, while real hardware
 * runs the same session at the display's refresh rate (144 Hz measured). So the FPS floor is only a
 * smoke alarm for something catastrophic, like a layout loop or a canvas that never stops.
 * The numbers are attached to the result; scripts/qa-report.mjs publishes them.
 */
/**
 * At most this share of the session on the main thread. Measured: ~29% (4.8 ms per 60 fps frame),
 * mostly React mounting the tree when it opens; the budget leaves room for slower CI CPUs.
 */
const MAIN_THREAD_BUDGET = 0.4;
const FPS_FLOOR = 15;
// A ~10 s session is only a few hundred frames, so its "1% low" is its two or three worst frames
// (the dialog-open renders): a floor on stutter, deliberately loose.
const LOW_FLOOR = 3;
const LONG_TASK_BUDGET = 8;

test.use({ reducedMotion: "no-preference" });

test("[CERT-PERF-01] a play session stays within its main-thread and frame-rate budgets", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("./?perf");
  await expect(page.getByTestId("perf-overlay")).toBeVisible();
  await page.waitForFunction(() => !!window.__perf);
  await page.waitForTimeout(500); // past the first-paint frames
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const busySeconds = async () =>
    (await cdp.send("Performance.getMetrics")).metrics.find((m) => m.name === "TaskDuration")!.value;
  await page.evaluate(() => window.__perf!.reset());
  const started = Date.now();
  const busyAtStart = await busySeconds();

  // Passive tree: zoom in and out, then drag it around.
  await page.getByTestId("open-tree").click();
  const tree = page.getByRole("dialog", { name: "Passive Skill Tree" });
  const box = (await tree.locator(".tree__viewport").boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, i < 3 ? -240 : 240);
    await page.waitForTimeout(120);
  }
  await page.mouse.down();
  for (let i = 0; i <= 20; i++) await page.mouse.move(cx + Math.sin(i / 3) * 200, cy + Math.cos(i / 3) * 120);
  await page.mouse.up();
  await page.keyboard.press("Escape");

  // Crafting bench: every successful orb bursts particles.
  await page.getByTestId("open-bench").click();
  const bench = page.getByRole("dialog", { name: "Crafting Bench" });
  for (const orb of ["transmute", "alteration", "alteration", "regal", "chaos", "chaos"]) {
    await bench.getByTestId(`orb-${orb}`).click();
    await bench.getByTestId("item-slot").click();
    await page.waitForTimeout(150);
  }
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  // Skills with screen effects.
  for (const key of ["q", "w", "e", "r"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);

  const s = await page.evaluate(() => window.__perf!.summary());
  const mainThread = (await busySeconds()) - busyAtStart;
  const utilization = mainThread / ((Date.now() - started) / 1000);
  test.info().annotations.push({
    type: "perf",
    description: JSON.stringify({
      ...s,
      mainThreadPct: Math.round(utilization * 1000) / 10,
      mainThreadMsPerFrame: Math.round(utilization * (1000 / 60) * 10) / 10,
      mainThreadBudgetPct: MAIN_THREAD_BUDGET * 100,
      fpsFloor: FPS_FLOOR,
      lowFloor: LOW_FLOOR,
      longTaskBudget: LONG_TASK_BUDGET,
    }),
  });
  expect(utilization, "share of the session spent on the main thread").toBeLessThanOrEqual(MAIN_THREAD_BUDGET);
  expect(s.frames, "frames measured").toBeGreaterThan(120);
  expect(s.fps, `average fps (1% low ${s.low1Fps}, worst ${s.maxMs} ms)`).toBeGreaterThanOrEqual(FPS_FLOOR);
  expect(s.low1Fps, "1% low fps").toBeGreaterThanOrEqual(LOW_FLOOR);
  expect(s.longTasks, "main-thread tasks over 50 ms").toBeLessThanOrEqual(LONG_TASK_BUDGET);
});

test("the performance overlay opens from the top bar and closes", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("toggle-perf").click();
  const overlay = page.getByTestId("perf-overlay");
  await expect(overlay).toBeVisible();
  await expect(page.getByTestId("perf-fps")).not.toHaveText("0");
  // It stays on top of dialogs.
  await page.getByTestId("open-quests").click();
  await expect(overlay).toBeVisible();
  await page.keyboard.press("Escape");
  await overlay.getByRole("button", { name: "Close the performance overlay" }).click();
  await expect(overlay).toBeHidden();
  await expect(page.getByTestId("toggle-perf")).toHaveAttribute("aria-pressed", "false");
});
