import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Pseudo-localization scan. With ?pseudo every string that goes through the i18n layer comes out
 * accented ("Šķîļļ Ţŕéé"), so any plain ASCII word left on the page was hardcoded and would ship
 * untranslated. Text marked translate="no" (names, brands, language names) is exempt, as the HTML
 * standard intends. Checks visible text, screen-reader-only text and accessible-name attributes.
 */
async function untranslated(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ATTRS = ["aria-label", "aria-description", "aria-valuetext", "title", "placeholder", "alt"];
    // Roman numerals ("Act IV") are numbers, not words.
    const plain = { test: (s: string) => /[A-Za-z]{2,}/.test(s.replace(/\b[IVXLC]+\b/g, "")) };
    const exempt = (el: Element | null) => !el || !!el.closest("[translate='no'], script, style, noscript, svg title");
    const where = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const testId = el.getAttribute("data-testid");
      const cls = typeof el.className === "string" && el.className ? `.${el.className.split(/\s+/)[0]}` : "";
      return `${el.tagName.toLowerCase()}${id}${testId ? `[data-testid=${testId}]` : cls}`;
    };
    const found = new Set<string>();

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      const el = node.parentElement;
      if (text && plain.test(text) && !exempt(el)) found.add(`${where(el!)}: "${text.slice(0, 60)}"`);
    }
    for (const el of document.body.querySelectorAll("*")) {
      if (exempt(el)) continue;
      for (const attr of ATTRS) {
        const value = el.getAttribute(attr);
        if (value && plain.test(value)) found.add(`${where(el)} [${attr}]: "${value.slice(0, 60)}"`);
      }
    }
    return [...found].sort();
  });
}

/**
 * Text cut off by its box: pseudo text is ~35% longer, like German or PT-BR. Content hidden from
 * assistive tech (a thumbnail's cut-off preview) and declared canvases (data-clip) don't count.
 */
async function clipped(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      if (!el.textContent?.includes("⟦") || el.closest(".visually-hidden, [aria-hidden='true'], [data-clip]")) continue;
      const cs = getComputedStyle(el);
      const clipsX = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === "ellipsis";
      const clipsY = /hidden|clip/.test(cs.overflowY);
      if ((clipsX && el.scrollWidth > el.clientWidth + 1) || (clipsY && el.scrollHeight > el.clientHeight + 1)) {
        out.push(`${el.tagName.toLowerCase()}.${el.classList[0] ?? ""}: "${el.textContent.trim().slice(0, 50)}"`);
      }
    }
    return out;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("./?pseudo");
  await expect(page.getByRole("heading", { level: 2 }).first()).toContainText("⟦");
});

test("[CERT-LOC-01] pseudo-localization: the character sheet has no hardcoded or clipped strings", async ({ page }) => {
  expect(await untranslated(page)).toEqual([]);
  expect(await clipped(page)).toEqual([]);
});

const DIALOGS = [
  "open-tree",
  "open-bench",
  "open-quests",
  "open-cards",
  "open-bounty",
  "open-qa",
  "open-cert",
  "open-achievements",
];

for (const opener of DIALOGS) {
  test(`[CERT-LOC-01] pseudo-localization: no hardcoded or clipped strings in ${opener.replace("open-", "")}`, async ({
    page,
  }) => {
    await page.getByTestId(opener).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    // Let data-driven panels (QA Report, certification) finish loading.
    await expect(dialog).not.toContainText(/Loading|Carregando|Ļöáðîñĝ/);
    expect(await untranslated(page)).toEqual([]);
    expect(await clipped(page)).toEqual([]);
  });
}

test("pseudo-localization can be switched off again and is remembered", async ({ page }) => {
  await page.goto("./");
  const toggle = page.getByTestId("toggle-pseudo");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(page.getByRole("heading", { level: 2, name: "Inventory" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: "Inventory" })).toBeVisible();
});
