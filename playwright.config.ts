import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The JSON report feeds the in-app QA Report (scripts/qa-report.mjs).
  reporter: [
    ...(process.env.CI ? [["github"] as const, ["html", { open: "never" }] as const] : [["list"] as const]),
    ["json", { outputFile: "reports/playwright.json" }],
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
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
