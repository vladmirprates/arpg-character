// Renders the link-preview card (Open Graph / Twitter) to public/og-image.png, 1200 × 630, in the
// site's own look: its fonts and palette, with the real passive tree (My Build, captured from the
// built site) as the picture. Re-run after changing the name, title or build.
//   Usage: npm run og-image   (builds the site first)
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const root = new URL("../", import.meta.url);
const font = (path) => readFileSync(new URL(`node_modules/${path}`, root)).toString("base64");

// The tree is the picture, cropped in close with its heart right of centre; the name sits low-left
// like a film's title card. Font families get their own names: one called "Serif" would match the
// generic `serif` keyword and quietly render Times.
const card = (tree) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: Display; font-weight: 500; src: url(data:font/woff2;base64,${font("@fontsource/alegreya/files/alegreya-latin-500-normal.woff2")}); }
@font-face { font-family: Sans; font-weight: 500; src: url(data:font/woff2;base64,${font("@fontsource/alegreya-sans/files/alegreya-sans-latin-500-normal.woff2")}); }
@font-face { font-family: Sans; font-weight: 400; src: url(data:font/woff2;base64,${font("@fontsource/alegreya-sans/files/alegreya-sans-latin-400-normal.woff2")}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: #070608; color: #efe4cf; font-family: Sans; }
.tree { position: absolute; width: 1350px; height: 1350px; left: 180px; top: -360px; }
.tree img { width: 100%; height: 100%; }
/* Ink comes in from the left and the bottom, so the type sits on black, not on the tree. */
.shade { position: absolute; inset: 0;
  background: linear-gradient(90deg, #070608 0%, rgb(7 6 8 / .92) 26%, rgb(7 6 8 / .35) 52%, transparent 70%),
              linear-gradient(0deg, rgb(7 6 8 / .9), transparent 40%); }
.title { position: absolute; left: 80px; bottom: 92px; }
/* Tracked capitals, like the site's masthead. */
h1 { font-family: Display; font-weight: 500; font-size: 64px; line-height: 1; letter-spacing: .08em; text-transform: uppercase; color: #f7d39a; }
.rule { width: 300px; height: 1px; margin: 22px 0 18px; background: linear-gradient(90deg, #ef9a45, rgb(176 138 82 / .35) 70%, transparent); }
.role { font-size: 30px; font-weight: 500; }
.role i { font-style: normal; color: #ef9a45; padding: 0 .3em; }
.url { position: absolute; left: 80px; bottom: 46px; font-size: 20px; color: #9c8d76; letter-spacing: .02em; }
</style></head><body>
<div class="tree"><img src="data:image/png;base64,${tree}" alt=""></div><div class="shade"></div>
<div class="title"><h1>Vladmir Prates</h1><div class="rule"></div><p class="role">QA Engineer<i>·</i>Game QA</p></div>
<p class="url">vladmirprates.github.io/arpg-character</p>
</body></html>`;

const browser = await chromium.launch();

// 1. The real tree: serve the build, open the passive tree full-screen, hide everything but it.
const server = await preview({ preview: { port: 4190, strictPort: true }, logLevel: "silent" });
const site = await browser.newPage({
  viewport: { width: 1600, height: 1600 }, // big enough to crop in close
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
    .region-label, .node-tip { display: none !important; }
    .tree__body { grid-template-columns: 1fr !important; }
  `,
});
await site.mouse.move(0, 0); // no node hovered, so no tooltip in the shot
await site.waitForTimeout(1500); // the tree re-fits to the new size
const tree = (await site.locator(".tree__viewport").screenshot()).toString("base64");
await server.close();

// 2. The card around it.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(card(tree));
// Faces only start loading once used: wait for each one, so nothing falls back.
await page.evaluate(async () => {
  for (const f of ["500 40px Display", "400 20px Sans", "500 20px Sans"]) await document.fonts.load(f);
  await document.fonts.ready;
});
await page.screenshot({ path: new URL("public/og-image.png", root).pathname.replace(/^\/([A-Z]:)/, "$1") });
await browser.close();
console.log("Wrote public/og-image.png");
