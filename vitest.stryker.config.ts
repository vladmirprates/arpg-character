import { defineConfig } from "vitest/config";

/**
 * The test run Stryker repeats for every mutant: only the game-logic unit tests, in plain Node.
 * Running the whole jsdom component suite per mutant took over an hour for ~1,400 mutants; the
 * game rules are meant to be proven by their own tests anyway, so this is also the honest score.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/game/**/*.test.ts"],
  },
});
