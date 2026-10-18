import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import { QAReport, type QAReportData } from "./QAReport";

const REPORT: QAReportData = {
  generatedAt: "2026-10-17T20:00:00.000Z",
  commit: "abcdef1234567",
  commitUrl: "https://github.com/x/y/commit/abcdef1234567",
  runUrl: "https://github.com/x/y/actions/runs/1",
  unit: { total: 146, passed: 146, failed: 0, files: 21, durationMs: 9357 },
  coverage: { lines: 79.3, statements: 77.3, functions: 78.1, branches: 66.5 },
  e2e: {
    total: 64,
    passed: 52,
    failed: 0,
    skipped: 12,
    flaky: 0,
    projects: ["desktop", "mobile"],
    accessibilityScans: 10,
    durationMs: 33654,
    skippedTests: [
      { title: "keyboard: arrows walk the tree", file: "tree.spec.ts", reason: "keyboard flow", projects: ["mobile"] },
    ],
  },
  lighthouse: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100 },
};

const serve = (response: Partial<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, ...response } as Response)),
  );

afterEach(() => vi.unstubAllGlobals());

describe("<QAReport />", () => {
  test("shows the pipeline's real numbers and links to the run", async () => {
    serve({ json: () => Promise.resolve(REPORT) });
    renderWithProviders(<QAReport />);
    expect(await screen.findByText("All checks passed")).toBeInTheDocument();
    expect(screen.getByText("146/146")).toBeInTheDocument();
    expect(screen.getByText("52/52")).toBeInTheDocument();
    expect(screen.getByText("79.3%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Commit abcdef1" })).toHaveAttribute("href", REPORT.commitUrl);
    expect(screen.getByRole("link", { name: "View the pipeline run" })).toHaveAttribute("href", REPORT.runUrl);
    // Skipped tests stay collapsed until the visitor opens them.
    const skipped = screen.getByText("Skipped by design (12)");
    // The reason and project names are their own (untranslated) spans, so match the whole line.
    const reason = () =>
      screen.getByText((_, el) => el?.tagName === "SPAN" && el.textContent === "keyboard flow · skipped on mobile");
    expect(reason()).not.toBeVisible();
    await userEvent.click(skipped);
    expect(reason()).toBeVisible();
  });

  test("shows mutation, frame-rate and certification results, and prefers live Lighthouse scores", async () => {
    serve({
      json: () =>
        Promise.resolve({
          ...REPORT,
          mutation: { score: 87.5, killed: 160, survived: 20, timeout: 15, noCoverage: 5, total: 200 },
          performance: {
            fps: 38.4,
            low1Fps: 12,
            p99Ms: 83,
            frames: 300,
            fpsFloor: 15,
            lowFloor: 5,
            mainThreadPct: 28.8,
            mainThreadMsPerFrame: 4.8,
            mainThreadBudgetPct: 40,
          },
          certification: { "CERT-SAVE-01": "passed", "CERT-SAVE-02": "passed", "CERT-ERR-01": "failed" },
          links: { e2e: "reports/e2e/index.html", lighthouseLive: "reports/lighthouse-live.html" },
          lighthouseLive: {
            performance: 97,
            accessibility: 100,
            bestPractices: 96,
            seo: 100,
            url: "https://example.test/arpg-character/",
            measuredAt: "2026-10-17T12:00:00Z",
          },
        }),
    });
    renderWithProviders(<QAReport />);
    expect(await screen.findByText("87.5%")).toBeInTheDocument();
    expect(screen.getByText("175 of 200 injected bugs caught (Stryker, game logic)")).toBeInTheDocument();
    // The frame budget leads; CI's GPU-less frame rate is shown with that context.
    expect(screen.getByText("4.8 ms")).toBeInTheDocument();
    expect(screen.getByText(/28.8% busy, budget 40%/)).toBeInTheDocument();
    expect(screen.getByText(/38 fps on the CI runner, which has no GPU/)).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText(/Measured on the live site/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "example.test/arpg-character/" })).toBeInTheDocument();
    expect(screen.getByText("97")).toBeInTheDocument();
    // Each tool's full report is a link away (only the ones the pipeline published).
    expect(screen.getAllByRole("link", { name: /Open the full report/ })[0]).toHaveAttribute(
      "href",
      "reports/e2e/index.html",
    );
    expect(screen.getByRole("link", { name: /Live-site report/ })).toHaveAttribute(
      "href",
      "reports/lighthouse-live.html",
    );
    expect(screen.queryByRole("link", { name: /Pre-deploy report/ })).toBeNull();
    // The pre-deploy scores are still there, for comparison.
    expect(screen.getByText(/^Before deploy:/)).toBeInTheDocument();
  });

  test("a failing run is reported as failing", async () => {
    serve({ json: () => Promise.resolve({ ...REPORT, e2e: { ...REPORT.e2e!, passed: 50, failed: 2 } }) });
    renderWithProviders(<QAReport />);
    expect(await screen.findByText("Some checks failed")).toBeInTheDocument();
  });

  test("explains itself when no report has been published yet", async () => {
    serve({ ok: false, status: 404 });
    renderWithProviders(<QAReport />);
    expect(await screen.findByText(/No report yet/)).toBeInTheDocument();
  });

  test("an older report without the main-thread measurement still shows its frame rate", async () => {
    serve({
      json: () =>
        Promise.resolve({
          ...REPORT,
          performance: { fps: 18.3, low1Fps: 5.5, p99Ms: 183, frames: 180, fpsFloor: 15, lowFloor: 3 },
        }),
    });
    renderWithProviders(<QAReport />);
    expect(await screen.findByText("18 fps")).toBeInTheDocument();
  });
});
