import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The JSON report feeds the in-app QA Report (scripts/qa-report.mjs).
  reporter: [
    ...(process.env.CI ? [["github"] as const] : [["list"] as const]),
    // Published with the site and linked from the QA Report (scripts/qa-report.mjs copies it).
    ["html", { open: "never", outputFolder: process.env.PLAYWRIGHT_HTML_DIR ?? "playwright-report" }],
    // The perf project runs as its own (serial) invocation and writes its own file; see package.json.
    ["json", { outputFile: process.env.PLAYWRIGHT_JSON_FILE ?? "reports/playwright.json" }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "retain-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "perf.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", testIgnore: "perf.spec.ts", use: { ...devices["Pixel 7"] } },
    // Frame-rate measurements need the machine to themselves, so this project runs on its own with
    // one worker (npm run e2e:perf), never alongside the others. (Not a `dependencies` project:
    // Playwright doesn't apply --grep filters to those.)
    {
      name: "perf",
      testMatch: "perf.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
