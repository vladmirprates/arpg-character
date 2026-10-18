import { screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { CERT_CHECKS } from "../../data/certification";
import { renderWithProviders } from "../../test/render";
import type { QAReportData } from "../qa/QAReport";
import { CertificationPanel } from "./CertificationPanel";

const REPORT: Partial<QAReportData> = {
  generatedAt: "2026-10-17T20:00:00.000Z",
  lighthouse: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100 },
  certification: { "CERT-SAVE-01": "passed", "CERT-SAVE-02": "failed", "CERT-SUSP-01": "skipped" },
};

const serve = (response: Partial<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, ...response } as Response)),
  );

afterEach(() => vi.unstubAllGlobals());

const statusOf = (id: string) => within(screen.getByTestId(`cert-${id}`));

describe("<CertificationPanel />", () => {
  test("shows each requirement with its tagged test's result from the last pipeline run", async () => {
    serve({ json: () => Promise.resolve(REPORT) });
    renderWithProviders(<CertificationPanel />);
    // Passing: SAVE-01, and PERF-02 through the Lighthouse budget (99 ≥ 90).
    expect(await screen.findByText(`2 of ${CERT_CHECKS.length} requirements passing in the last pipeline run`));
    expect(statusOf("CERT-SAVE-01").getByText("Passed")).toBeInTheDocument();
    expect(statusOf("CERT-SAVE-02").getByText("Failed")).toBeInTheDocument();
    expect(statusOf("CERT-SUSP-01").getByText("Skipped")).toBeInTheDocument();
    expect(statusOf("CERT-INP-01").getByText("Not run")).toBeInTheDocument();
    expect(statusOf("CERT-PERF-02").getByText("Passed")).toBeInTheDocument();
    expect(statusOf("CERT-PERF-02").getByText("Lighthouse budget in CI")).toBeInTheDocument();
    expect(statusOf("CERT-SAVE-01").getByText("The end-to-end test tagged with this ID")).toBeInTheDocument();
  });

  test("prefers the live Lighthouse score, and fails the budget below 90", async () => {
    serve({
      json: () =>
        Promise.resolve({
          ...REPORT,
          lighthouseLive: { ...REPORT.lighthouse!, performance: 72, url: "https://x.test/", measuredAt: "2026-10-17" },
        }),
    });
    renderWithProviders(<CertificationPanel />);
    expect(await screen.findByText(/1 of \d+ requirements passing/)).toBeInTheDocument();
    expect(statusOf("CERT-PERF-02").getByText("Failed")).toBeInTheDocument();
  });

  test("says plainly when there are no pipeline results", async () => {
    serve({ ok: false, status: 404 });
    renderWithProviders(<CertificationPanel />);
    expect(await screen.findByText(/No pipeline results here/)).toBeInTheDocument();
    expect(statusOf("CERT-SAVE-01").getByText("Not run")).toBeInTheDocument();
  });

  test("groups every requirement under its area, in Portuguese too", async () => {
    serve({ json: () => Promise.resolve(REPORT) });
    renderWithProviders(<CertificationPanel />, { locale: "pt" });
    expect(await screen.findByRole("heading", { name: "Dados salvos" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(CERT_CHECKS.length);
  });
});
