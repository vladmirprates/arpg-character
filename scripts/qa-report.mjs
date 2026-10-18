// Builds qa-report.json — the numbers behind the in-app "QA Report" — from the raw outputs of the
// test tools, so the page always shows the real result of the last pipeline run, never typed-in values.
//
//   reports/vitest.json            vitest --reporter=json
//   coverage/coverage-summary.json vitest --coverage (json-summary reporter)
//   reports/playwright.json        playwright json reporter (see playwright.config.ts)
//   reports/playwright-perf.json   the same, for the serial frame-rate run (npm run e2e:perf)
//   .lighthouseci/manifest.json    lhci autorun (filesystem upload)
//   reports/mutation/mutation.json Stryker (json reporter)
//
// Usage: node scripts/qa-report.mjs [output path]   (default: public/qa-report.json, for local dev)
//        node scripts/qa-report.mjs --merge-live <report path> <site url>
//          After deploy: adds the Lighthouse run against the live site to an existing report.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const read = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
const pct = (n) => Math.round(n * 10) / 10;

/** The representative Lighthouse run's HTML report, if lhci wrote one. */
const lighthouseHtml = () => {
  const runs = read(".lighthouseci/manifest.json");
  return (runs?.find((r) => r.isRepresentativeRun) ?? runs?.[0])?.htmlPath ?? null;
};

/**
 * Copies a tool's full HTML report next to qa-report.json, so the QA Report can link to it.
 * Returns the link (relative to the page) or null when the tool didn't produce one.
 */
function publish(reportDir, source, target) {
  if (!source || !existsSync(source)) return null;
  const dest = join(reportDir, "reports", target);
  mkdirSync(dirname(dest), { recursive: true });
  // Coverage: only the browsable HTML, not the raw lcov / JSON data next to it.
  cpSync(source, dest, { recursive: true, filter: (f) => !/lcov|\.json$|\.info$/.test(f.slice(source.length)) });
  return `reports/${target}${target.includes(".") ? "" : "/index.html"}`;
}

if (process.argv[2] === "--merge-live") {
  const [, , , path, url] = process.argv;
  const report = read(path);
  const scores = lighthouse();
  if (!report || !scores) {
    console.error(`Nothing to merge: ${report ? "no Lighthouse results" : `no report at ${path}`}`);
    process.exit(1);
  }
  report.lighthouseLive = { ...scores, url, measuredAt: new Date().toISOString() };
  const live = publish(dirname(path), lighthouseHtml(), "lighthouse-live.html");
  if (live) report.links = { ...report.links, lighthouseLive: live };
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`Live Lighthouse scores merged into ${path}:`, scores);
  process.exit(0);
}

const out = process.argv[2] ?? "public/qa-report.json";
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

/** The functional run and the serial perf run, whichever exist. */
const playwrightRuns = () => ["reports/playwright.json", "reports/playwright-perf.json"].map(read).filter(Boolean);

/** Every Playwright test, flattened, with the file it's in. Cached: three sections read it. */
let flat;
function playwrightTests() {
  if (flat !== undefined) return flat;
  const runs = playwrightRuns();
  if (!runs.length) return (flat = null);
  const tests = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs ?? []) for (const t of spec.tests) tests.push({ file, title: spec.title, ...t });
    for (const child of suite.suites ?? []) walk(child, file ?? child.file ?? suite.file);
  };
  for (const r of runs) for (const suite of r.suites) walk(suite, suite.file);
  return (flat = tests);
}

/** Certification checklist id → result: failed if any tagged run failed, passed if any passed. */
function certification() {
  const tests = playwrightTests();
  if (!tests) return null;
  const results = {};
  for (const t of tests) {
    const id = /\[(CERT-[A-Z0-9-]+)\]/.exec(t.title)?.[1];
    if (!id) continue;
    const status = t.status === "unexpected" ? "failed" : t.status === "skipped" ? "skipped" : "passed";
    const prev = results[id];
    results[id] = prev === "failed" || status === "failed" ? "failed" : prev === "passed" ? "passed" : status;
  }
  return Object.keys(results).length ? results : null;
}

/** The frame-rate test's measurements, attached to its result as a "perf" annotation. */
function performance() {
  const tests = playwrightTests();
  for (const t of tests ?? []) {
    const notes = [...(t.annotations ?? []), ...(t.results ?? []).flatMap((r) => r.annotations ?? [])];
    const perf = notes.findLast((a) => a.type === "perf");
    if (!perf) continue;
    const s = JSON.parse(perf.description);
    return {
      fps: s.fps,
      low1Fps: s.low1Fps,
      p99Ms: s.p99Ms,
      frames: s.frames,
      longTasks: s.longTasks,
      mainThreadPct: s.mainThreadPct,
      mainThreadMsPerFrame: s.mainThreadMsPerFrame,
      mainThreadBudgetPct: s.mainThreadBudgetPct,
      fpsFloor: s.fpsFloor,
      lowFloor: s.lowFloor,
    };
  }
  return null;
}

/** Stryker's mutation score: killed (or timed-out) mutants over all that could have been killed. */
function mutation() {
  const r = read("reports/mutation/mutation.json");
  if (!r) return null;
  const count = {};
  for (const file of Object.values(r.files)) for (const m of file.mutants) count[m.status] = (count[m.status] ?? 0) + 1;
  const killed = count.Killed ?? 0;
  const timeout = count.Timeout ?? 0;
  const survived = count.Survived ?? 0;
  const noCoverage = count.NoCoverage ?? 0;
  const total = killed + timeout + survived + noCoverage;
  return { score: total ? pct(((killed + timeout) / total) * 100) : 0, killed, survived, timeout, noCoverage, total };
}

function e2e() {
  const runs = playwrightRuns();
  if (!runs.length) return null;
  const sum = (key) => runs.reduce((n, r) => n + (r.stats[key] ?? 0), 0);
  const r = {
    stats: {
      expected: sum("expected"),
      flaky: sum("flaky"),
      unexpected: sum("unexpected"),
      skipped: sum("skipped"),
      duration: sum("duration"),
    },
  };
  const tests = playwrightTests();
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
  mutation: mutation(),
  performance: performance(),
  certification: certification(),
  // The tools' own full reports, published alongside: open them from the QA Report.
  links: Object.fromEntries(
    Object.entries({
      e2e: publish(dirname(out), "playwright-report", "e2e"),
      perf: publish(dirname(out), "playwright-report-perf", "perf"),
      coverage: publish(dirname(out), "coverage", "coverage"),
      mutation: publish(dirname(out), "reports/mutation/mutation.html", "mutation.html"),
      lighthouse: publish(dirname(out), lighthouseHtml(), "lighthouse.html"),
    }).filter(([, link]) => link),
  ),
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`QA report written to ${out}`);
for (const [k, v] of Object.entries(report))
  if (v === null && !/commit|run/i.test(k)) console.warn(`  (no ${k} data found)`);
