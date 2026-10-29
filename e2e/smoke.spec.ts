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
  // The first copy also unlocks an achievement; both are announced together.
  await expect(page.getByRole("status")).toContainText("Item copied to clipboard");
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

// Before the web fonts arrive the fallback font is wider: the layout must not overflow then either
// (a slow connection, or a busy CI box, sees that state). Found by a flaky run of the test below.
for (const width of [320, 360]) {
  test(`no horizontal scrolling at ${width}px with the fallback font`, async ({ page, consoleErrors }) => {
    await page.route(/\.woff2?$/, (route) => route.abort());
    await page.setViewportSize({ width, height: 800 });
    await page.goto("./");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    // The blocked font requests are the point of this test, not app errors.
    const unexpected = consoleErrors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e));
    consoleErrors.splice(0, consoleErrors.length, ...unexpected);
  });
}

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

test("the link-preview card is published at 1200×630 and every preview tag points at it", async ({ page, request }) => {
  await page.goto("./");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  const twitter = await page.locator('meta[name="twitter:image"]').getAttribute("content");
  expect(og).toMatch(/^https:\/\/.+\/og-image\.png$/); // crawlers need an absolute URL
  expect(twitter).toBe(og);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  // The file itself, served from this build: a PNG whose header says 1200 × 630.
  const res = await request.get("og-image.png");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toBe("image/png");
  const png = await res.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test("on a 1080p screen the sheet fits without scrolling, and the side column is no taller than the inventory", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "a desktop layout check");
  // 1920 × 1080 minus a typical browser's tabs and toolbar.
  await page.setViewportSize({ width: 1920, height: 1005 });
  await page.goto("./");
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  expect(overflow, "vertical scroll").toBeLessThanOrEqual(0);
  const bottom = (selector: string) => page.locator(selector).evaluate((el) => el.getBoundingClientRect().bottom);
  // A few pixels of slack: the frames' ornaments differ slightly.
  expect(await bottom(".sheet__side")).toBeLessThanOrEqual((await bottom(".inv-panel")) + 8);
  // Every feature label fits inside its button.
  for (const button of await page.locator(".features .feature").all()) {
    const fits = await button.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits, await button.innerText()).toBe(true);
  }
});

// Labels may wrap between words in a longer language, never inside one ("Certificatio / n").
for (const [locale, width] of [
  ["en-US", 1920],
  ["en-US", 1280],
  ["en-US", 768],
  ["en-US", 360],
  ["pt-BR", 1920],
  ["pt-BR", 360],
] as const) {
  test.describe(() => {
    test.use({ locale });
    test(`feature labels never break inside a word (${locale}, ${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("./");
      await page.evaluate(() => document.fonts.ready);
      const split = await page.evaluate(() =>
        [...document.querySelectorAll(".feature__label")].flatMap((label) => {
          const node = label.firstChild!;
          const text = node.textContent ?? "";
          let at = 0;
          return text.split(" ").filter((word) => {
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + word.length);
            at += word.length + 1;
            return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size > 1;
          });
        }),
      );
      expect(split).toEqual([]);
    });
  });
}

// Found by hand: hidden screen-reader text, positioned against the <dialog> itself, stretched the
// QA Report window so it scrolled as well as its content — two scrollbars side by side.
test("no dialog scrolls as a whole: only its content scrolls, so there's one scrollbar", async ({ page }) => {
  await page.goto("./");
  const ids = await page
    .locator("[data-testid^=open-]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!));
  expect(ids.length).toBeGreaterThanOrEqual(8);
  for (const id of ids) {
    await page.getByTestId(id).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    const overflow = await dialog.evaluate((d) => d.scrollHeight - d.clientHeight);
    expect(overflow, `${id} dialog overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

// Found by hand: on phones the quest log's tabs are a horizontal strip, and the act it opens on
// (the latest) sat off-screen, so nothing showed which act was selected.
test("the quest log opens with its selected act tab in view", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("open-quests").click();
  const log = page.getByRole("dialog", { name: "Quest Log" });
  const selected = log.locator('[role="tab"][aria-selected="true"]');
  await expect(selected).toBeVisible();
  const strip = (await log.getByRole("tablist").boundingBox())!;
  await expect
    .poll(async () => {
      const box = (await selected.boundingBox())!;
      return box.x >= strip.x - 1 && box.x + box.width <= strip.x + strip.width + 1;
    })
    .toBe(true);
});
