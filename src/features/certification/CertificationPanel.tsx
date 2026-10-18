import { CERT_AREAS, CERT_CHECKS, type CertCheck } from "../../data/certification";
import { useI18n } from "../../i18n/I18nProvider";
import type { StringKey } from "../../i18n/strings";
import { useQAReport, type QAReportData } from "../qa/QAReport";
import "./CertificationPanel.css";

type Status = "passed" | "failed" | "skipped" | "unknown";

const STATUS_KEYS: Record<Status, StringKey> = {
  passed: "cert.passed",
  failed: "cert.failed",
  skipped: "cert.skipped",
  unknown: "cert.unknown",
};

/** A check's result in the last pipeline run: its tagged test, or the Lighthouse budget. */
function statusOf(check: CertCheck, data: QAReportData | null): Status {
  if (!data) return "unknown";
  if (check.evidence === "lighthouse") {
    const scores = data.lighthouseLive ?? data.lighthouse;
    return scores ? (scores.performance >= 90 ? "passed" : "failed") : "unknown";
  }
  return data.certification?.[check.id] ?? "unknown";
}

/**
 * A mock console certification checklist (the TRC / XR / Lotcheck kind of pre-release gate),
 * each requirement translated to its web equivalent and traced to the automated test that proves
 * it — with that test's result from the last deploy.
 */
export function CertificationPanel() {
  const { t, l } = useI18n();
  const report = useQAReport();
  const data = report.status === "ready" ? report.data : null;
  const statuses = new Map(CERT_CHECKS.map((c) => [c.id, statusOf(c, data)]));
  const passed = [...statuses.values()].filter((s) => s === "passed").length;

  return (
    // Focusable so keyboard users can scroll it (WCAG 2.1.1).
    <div className="cert" tabIndex={0} role="region" aria-label={t("nav.cert")}>
      <p className="cert__intro">{t("cert.intro")}</p>
      <p className="cert__disclaimer">{t("cert.disclaimer")}</p>
      <p className={`cert__summary ${data && passed === CERT_CHECKS.length ? "is-pass" : ""}`} role="status">
        {report.status === "loading"
          ? t("qa.loading")
          : data
            ? t("cert.summary", { n: passed, total: CERT_CHECKS.length })
            : t("cert.noReport")}
      </p>

      {CERT_AREAS.map((area) => (
        <section key={area.id} className="cert__area" aria-labelledby={`cert-${area.id}`}>
          <h3 id={`cert-${area.id}`}>{l(area.title)}</h3>
          <ul>
            {CERT_CHECKS.filter((c) => c.area === area.id).map((c) => {
              const status = statuses.get(c.id)!;
              return (
                <li key={c.id} className="cert__check" data-testid={`cert-${c.id}`} data-status={status}>
                  <div className="cert__check-head">
                    <code translate="no">{c.id}</code>
                    <span className={`cert__status cert__status--${status}`}>{t(STATUS_KEYS[status])}</span>
                  </div>
                  <p className="cert__req">{l(c.console)}</p>
                  <dl>
                    <dt>{t("cert.web")}</dt>
                    <dd>{l(c.web)}</dd>
                    <dt>{t("cert.how")}</dt>
                    <dd>{l(c.how)}</dd>
                    <dt>{t("cert.evidence")}</dt>
                    <dd>{c.evidence === "lighthouse" ? t("cert.evidenceLighthouse") : t("cert.evidenceTest")}</dd>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
