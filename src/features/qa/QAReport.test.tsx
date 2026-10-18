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
    expect(screen.getByText("keyboard flow · skipped on mobile")).not.toBeVisible();
    await userEvent.click(skipped);
    expect(screen.getByText("keyboard flow · skipped on mobile")).toBeVisible();
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
});
