/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /arpg-character/
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/main.tsx"],
      // json-summary feeds the in-app QA Report (scripts/qa-report.mjs).
      reporter: ["text-summary", "html", "lcov", "json-summary"],
      // The game rules are the contract: hold them to a high bar. Canvas/audio UI is covered by E2E.
      thresholds: {
        // Floor for the whole app, just under today's numbers: coverage can rise, never quietly drop.
        // (Animation, audio and gesture code is covered by the Playwright suite instead.)
        statements: 80,
        branches: 70,
        functions: 82,
        lines: 82,
        "src/game/**": { lines: 95, functions: 95, statements: 90, branches: 80 },
      },
    },
  },
});
