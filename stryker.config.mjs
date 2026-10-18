// Mutation testing: Stryker plants small bugs ("mutants": a flipped condition, an off-by-one, a
// deleted line) in the game logic and runs the unit tests against each. A mutant the tests don't
// catch is a gap in the tests, however high line coverage looks. The score feeds the QA Report.
//
//   npm run test:mutation    → reports/mutation/mutation.html (and .json for scripts/qa-report.mjs)
/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: { configFile: "vitest.stryker.config.ts" },
  coverageAnalysis: "perTest",
  // Stryker rewrites relative paths in tsconfig's `extends` / `references` for its sandbox, using
  // the TypeScript JS API — which TypeScript 7 (the native compiler) no longer ships. This tsconfig
  // has neither, and Vitest doesn't type-check, so pointing the step at no file skips it safely.
  tsconfigFile: "no-tsconfig-rewrite.json",
  // The rules, not the content: item text, tree copy, icon paths and hand-placed layout data
  // would only produce "mutants" in strings and coordinates that no test should pin down.
  mutate: [
    "src/game/**/*.ts",
    "!src/game/**/*.test.ts",
    "!src/game/tree/content.ts",
    "!src/game/tree/icons.generated.ts",
    "!src/game/tree/layouts/**",
    "!src/game/crafting/pools.ts",
    "!src/game/crafting/icons.ts",
    "!src/game/crafting/types.ts",
  ],
  reporters: ["clear-text", "progress", "html", "json"],
  // The console gets the score table only. Every surviving mutant with its diff (~3,400 lines in
  // CI, easy to mistake for test failures) is in the HTML report.
  clearTextReporter: { reportMutants: false, reportTests: false },
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  // Below `break` the run fails: the score can rise, never quietly drop.
  thresholds: { high: 85, low: 70, break: 70 },
  tempDirName: ".stryker-tmp",
  concurrency: 4,
};
