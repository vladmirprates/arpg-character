// Renders the link-preview card (Open Graph / Twitter) to public/og-image.png, 1200 × 630, in the
// site's own look: its fonts and palette, with the real passive tree — My Build, captured from the
// built site — on the right. Re-run after changing the name, title or build.
//   Usage: npm run og-image   (builds the site first)
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const root = new URL("../", import.meta.url);
const font = (path) => readFileSync(new URL(`node_modules/${path}`, root)).toString("base64");
const icons = JSON.parse(readFileSync(new URL("node_modules/@iconify-json/game-icons/icons.json", root))).icons;
const icon = (name, color) =>
  `<svg viewBox="0 0 512 512" aria-hidden="true"><g fill="${color}">${icons[name].body.replace(/fill="[^"]*"/g, "")}</g></svg>`;

const SLOTS = [
  ["magnifying-glass", "#6fc8ff"],
  ["bug-net", "#f0c35a"],
  ["anvil-impact", "#ff8a5c"],
  ["oak", "#8ee39c"],
  ["gamepad", "#c98bff"],
];

const card = (tree) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Marcellus; src: url(data:font/woff2;base64,${font("@fontsource/marcellus-sc/files/marcellus-sc-latin-400-normal.woff2")}); }
@font-face { font-family: Alegreya; src: url(data:font/woff2;base64,${font("@fontsource/alegreya-sans/files/alegreya-sans-latin-400-normal.woff2")}); }
@font-face { font-family: Alegreya; font-weight: 500; src: url(data:font/woff2;base64,${font("@fontsource/alegreya-sans/files/alegreya-sans-latin-500-normal.woff2")}); }
* { box-sizing: border-box; margin: 0; }
body {
  width: 1200px; height: 630px; overflow: hidden; position: relative;
  background:
    radial-gradient(ellipse 55% 70% at 18% 20%, rgb(150 70 25 / 0.35), transparent 70%),
    radial-gradient(ellipse 50% 60% at 95% 100%, rgb(40 70 140 / 0.3), transparent 70%),
    #070608;
  color: #efe4cf; font-family: Alegreya, sans-serif;
}
.frame { position: absolute; inset: 26px; border: 2px solid #8a6a3c; box-shadow: inset 0 0 0 6px #0c0a0a, inset 0 0 0 7px #4a3720; }
.frame::before, .frame::after { content: ""; position: absolute; width: 18px; height: 18px; background: #d4b07a; transform: rotate(45deg); top: -10px; }
.frame::before { left: -10px; } .frame::after { right: -10px; }
/* The passive tree, faded out at the edges so it melts into the card. */
.tree { position: absolute; right: 0; top: 50%; width: 600px; height: 600px; margin-top: -300px;
  -webkit-mask-image: radial-gradient(circle at center, #000 38%, transparent 66%);
          mask-image: radial-gradient(circle at center, #000 38%, transparent 66%); }
.tree img { width: 100%; height: 100%; }
.text { position: absolute; left: 90px; top: 92px; width: 600px; }
.kicker { font-family: Marcellus; font-size: 24px; letter-spacing: 0.32em; color: #d4b07a; }
h1 { font-family: Marcellus; font-weight: 400; font-size: 86px; line-height: 1; margin-top: 18px; color: #f7d39a;
  text-shadow: 0 2px 0 #3a250f, 0 0 30px rgb(239 154 69 / 0.35); }
.title { margin-top: 18px; font-family: Marcellus; font-size: 40px; color: #fbf4e6; }
.title span { color: #d9823b; }
.tagline { margin-top: 22px; width: 520px; font-size: 26px; line-height: 1.35; color: #cbbd9f; }
.bar { position: absolute; left: 90px; bottom: 108px; display: flex; gap: 12px; }
.slot { width: 74px; height: 74px; padding: 12px; border: 1px solid #8a6a3c; border-radius: 2px;
  background: radial-gradient(circle at 50% 35%, #1d181b, #070607 75%); box-shadow: inset 0 0 12px #000; }
.slot svg { width: 100%; height: 100%; filter: drop-shadow(0 0 6px rgb(255 255 255 / 0.12)); }
.url { position: absolute; left: 90px; bottom: 58px; font-size: 22px; letter-spacing: 0.04em; color: #968a7c; }
</style></head><body>
<div class="frame"></div>
<div class="tree"><img src="data:image/png;base64,${tree}" alt=""></div>
<div class="text">
  <p class="kicker">QA CHARACTER SHEET</p>
  <h1>Vladmir Prates</h1>
  <p class="title">QA Engineer <span>·</span> Game QA</p>
  <p class="tagline">My QA career as an action RPG: a passive skill tree, a working crafting bench, a bug hunt and a live, tested QA report.</p>
</div>
<div class="bar">${SLOTS.map(([n, c]) => `<div class="slot">${icon(n, c)}</div>`).join("")}</div>
<p class="url">vladmirprates.github.io/arpg-character</p>
</body></html>`;

const browser = await chromium.launch();

// 1. The real tree: serve the build, open the passive tree full-screen, hide everything but it.
const server = await preview({ preview: { port: 4190, strictPort: true }, logLevel: "silent" });
const site = await browser.newPage({
  viewport: { width: 1200, height: 1200 },
  locale: "en-US",
  reducedMotion: "reduce",
});
await site.goto("http://localhost:4190/");
await site.getByTestId("open-tree").click();
await site.addStyleTag({
  content: `
    .modal--tree { width: 100vw !important; height: 100vh !important; max-width: none !important;
      max-height: none !important; margin: 0 !important; border: 0 !important; }
    .modal__header, .tree__toolbar, .tree__hint, #build-summary, .tree__summary-toggle,
    .region-label { display: none !important; }
    .tree__body { grid-template-columns: 1fr !important; }
  `,
});
await site.waitForTimeout(1200); // the tree re-fits to the new size
const tree = (await site.locator(".tree__viewport").screenshot()).toString("base64");
await server.close();

// 2. The card around it.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(card(tree));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL("public/og-image.png", root).pathname.replace(/^\/([A-Z]:)/, "$1") });
await browser.close();
console.log("Wrote public/og-image.png");
