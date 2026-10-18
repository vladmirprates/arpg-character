// Builds qa-report.json — the numbers behind the in-app "QA Report" — from the raw outputs of the
// test tools, so the page always shows the real result of the last pipeline run, never typed-in values.
//
//   reports/vitest.json            vitest --reporter=json
//   coverage/coverage-summary.json vitest --coverage (json-summary reporter)
//   reports/playwright.json        playwright json reporter (see playwright.config.ts)
//   .lighthouseci/manifest.json    lhci autorun (filesystem upload)
//
// Usage: node scripts/qa-report.mjs [output path]   (default: public/qa-report.json, for local dev)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] ?? "public/qa-report.json";
const read = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
const pct = (n) => Math.round(n * 10) / 10;

function unit() {
  const r = read("reports/vitest.json");
  if (!r) return null;
  // Wall-clock time: files run in parallel, so summing them would overstate it.
  const starts = r.testResults.map((f) => f.startTime).filter(Number.isFinite);
  const ends = r.testResults.map((f) => f.endTime).filter(Number.isFinite);
  return {
    total: r.numTotalTests,
    passed: r.numPassedTests,
    failed: r.numFailedTests,
    files: r.testResults.length, // numTotalTestSuites counts describe blocks, not files
    durationMs: Math.round(Math.max(...ends) - Math.min(...starts)),
  };
}

function coverage() {
  const c = read("coverage/coverage-summary.json")?.total;
  if (!c) return null;
  return {
    lines: pct(c.lines.pct),
    statements: pct(c.statements.pct),
    functions: pct(c.functions.pct),
    branches: pct(c.branches.pct),
  };
}

function e2e() {
  const r = read("reports/playwright.json");
  if (!r) return null;
  const tests = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs ?? []) for (const t of spec.tests) tests.push({ file, title: spec.title, ...t });
    for (const child of suite.suites ?? []) walk(child, file ?? child.file ?? suite.file);
  };
  for (const suite of r.suites) walk(suite, suite.file);
  const passed = (t) => t.status === "expected" || t.status === "flaky";
  const a11y = tests.filter((t) => /a11y\.spec/.test(t.file ?? "") && passed(t)).length;
  // Skipped by design: grouped by test, with the reason given in test.skip() and the devices skipped on.
  const skipped = new Map();
  for (const t of tests.filter((x) => x.status === "skipped")) {
    const key = `${t.file}::${t.title}`;
    const entry = skipped.get(key) ?? {
      title: t.title,
      file: t.file,
      reason: t.annotations?.find((a) => a.type === "skip")?.description ?? "",
      projects: [],
    };
    entry.projects.push(t.projectName);
    skipped.set(key, entry);
  }
  return {
    total: tests.length,
    passed: r.stats.expected + r.stats.flaky,
    failed: r.stats.unexpected,
    skipped: r.stats.skipped,
    flaky: r.stats.flaky,
    projects: [...new Set(tests.map((t) => t.projectName))].filter(Boolean),
    accessibilityScans: a11y,
    skippedTests: [...skipped.values()],
    durationMs: Math.round(r.stats.duration),
  };
}

function lighthouse() {
  const runs = read(".lighthouseci/manifest.json");
  if (!runs?.length) return null;
  const run = runs.find((r) => r.isRepresentativeRun) ?? runs[0];
  const score = (k) => Math.round((run.summary[k] ?? 0) * 100);
  return {
    performance: score("performance"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    seo: score("seo"),
  };
}

const { GITHUB_SHA, GITHUB_RUN_ID, GITHUB_SERVER_URL, GITHUB_REPOSITORY } = process.env;
const report = {
  generatedAt: new Date().toISOString(),
  commit: GITHUB_SHA ?? null,
  commitUrl: GITHUB_SHA ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}` : null,
  runUrl: GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null,
  unit: unit(),
  coverage: coverage(),
  e2e: e2e(),
  lighthouse: lighthouse(),
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`QA report written to ${out}`);
for (const [k, v] of Object.entries(report))
  if (v === null && !/commit|run/i.test(k)) console.warn(`  (no ${k} data found)`);
