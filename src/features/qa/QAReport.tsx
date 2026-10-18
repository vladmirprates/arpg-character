import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import "./QAReport.css";

/** Shape written by scripts/qa-report.mjs in the deploy pipeline. */
export interface QAReportData {
  generatedAt: string;
  commit: string | null;
  commitUrl: string | null;
  runUrl: string | null;
  unit: { total: number; passed: number; failed: number; files: number; durationMs: number } | null;
  coverage: { lines: number; statements: number; functions: number; branches: number } | null;
  e2e: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    projects: string[];
    accessibilityScans: number;
    durationMs: number;
    /** Tests skipped on purpose, with the reason from test.skip() and the devices skipped on. */
    skippedTests?: { title: string; file: string; reason: string; projects: string[] }[];
  } | null;
  lighthouse: { performance: number; accessibility: number; bestPractices: number; seo: number } | null;
}

type State = { status: "loading" } | { status: "missing" } | { status: "ready"; data: QAReportData };

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** A Lighthouse-style score ring. */
function Gauge({ label, score }: { label: string; score: number }) {
  const band = score >= 90 ? "good" : score >= 50 ? "ok" : "bad";
  const c = 2 * Math.PI * 26;
  return (
    <div className={`gauge gauge--${band}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="gauge__track" cx="32" cy="32" r="26" />
        <circle
          className="gauge__value"
          cx="32"
          cy="32"
          r="26"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="gauge__score">{score}</span>
      <span className="gauge__label">{label}</span>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter__bar" role="presentation">
        <div style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <strong>{value}%</strong>
    </div>
  );
}

/**
 * The site's own quality report: real numbers from the last deploy pipeline run (tests, coverage,
 * accessibility, Lighthouse), read from qa-report.json published next to the page.
 */
export function QAReport() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("qa-report.json", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<QAReportData>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => alive && setState({ status: "ready", data }))
      .catch(() => alive && setState({ status: "missing" }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === "loading") return <p className="qa__note">{t("qa.loading")}</p>;
  if (state.status === "missing") return <p className="qa__note">{t("qa.missing")}</p>;

  const { data } = state;
  const { unit, coverage, e2e, lighthouse } = data;
  const passing = (unit?.failed ?? 0) === 0 && (e2e?.failed ?? 0) === 0;
  const when = new Date(data.generatedAt).toLocaleString(locale === "pt" ? "pt-BR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    // Focusable so keyboard users can scroll it (WCAG 2.1.1).
    <div className="qa" tabIndex={0} role="region" aria-label={t("nav.qa")}>
      <p className={`qa__status ${passing ? "is-pass" : "is-fail"}`} role="status">
        <strong>{t(passing ? "qa.pass" : "qa.fail")}</strong>
        <span>{t("qa.generated", { when })}</span>
        {data.commitUrl && data.commit && (
          <a href={data.commitUrl} target="_blank" rel="noopener noreferrer">
            {t("qa.commit", { sha: data.commit.slice(0, 7) })}
          </a>
        )}
        {data.runUrl && (
          <a href={data.runUrl} target="_blank" rel="noopener noreferrer">
            {t("qa.run")}
          </a>
        )}
      </p>

      <div className="qa__tiles">
        {unit && (
          <section className="qa__tile">
            <h3>{t("qa.unit")}</h3>
            <p className="qa__big">
              {unit.passed}/{unit.total}
            </p>
            <p>{t("qa.unitDetail", { files: unit.files, time: seconds(unit.durationMs) })}</p>
          </section>
        )}
        {e2e && (
          <section className="qa__tile">
            <h3>{t("qa.e2e")}</h3>
            <p className="qa__big">
              {e2e.passed}/{e2e.passed + e2e.failed}
            </p>
            <p>{t("qa.e2eDetail", { projects: e2e.projects.join(" + "), skipped: e2e.skipped })}</p>
          </section>
        )}
        {e2e && (
          <section className="qa__tile">
            <h3>{t("qa.a11y")}</h3>
            <p className="qa__big">{e2e.accessibilityScans}</p>
            <p>{t("qa.a11yDetail")}</p>
          </section>
        )}
        {coverage && (
          <section className="qa__tile qa__tile--wide">
            <h3>{t("qa.coverage")}</h3>
            <Meter label={t("qa.lines")} value={coverage.lines} />
            <Meter label={t("qa.statements")} value={coverage.statements} />
            <Meter label={t("qa.functions")} value={coverage.functions} />
            <Meter label={t("qa.branches")} value={coverage.branches} />
          </section>
        )}
        {lighthouse && (
          <section className="qa__tile qa__tile--wide">
            <h3>Lighthouse</h3>
            <div className="qa__gauges">
              <Gauge label={t("qa.lh.performance")} score={lighthouse.performance} />
              <Gauge label={t("qa.lh.accessibility")} score={lighthouse.accessibility} />
              <Gauge label={t("qa.lh.bestPractices")} score={lighthouse.bestPractices} />
              <Gauge label="SEO" score={lighthouse.seo} />
            </div>
          </section>
        )}
      </div>

      {e2e?.skippedTests && e2e.skippedTests.length > 0 && (
        // Collapsed until asked for: a native disclosure, keyboard- and screen-reader-friendly.
        <details className="qa__skipped">
          <summary>{t("qa.skippedTitle", { n: e2e.skipped })}</summary>
          <p>{t("qa.skippedWhy")}</p>
          <ul>
            {e2e.skippedTests.map((s) => (
              <li key={`${s.file}::${s.title}`}>
                <strong>{s.title}</strong>
                <span>
                  {s.reason} · {t("qa.skippedOn", { projects: s.projects.join(", ") })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="qa__how">
        <h3>{t("qa.howTitle")}</h3>
        <ul>
          <li>{t("qa.how.static")}</li>
          <li>{t("qa.how.unit")}</li>
          <li>{t("qa.how.e2e")}</li>
          <li>{t("qa.how.a11y")}</li>
          <li>{t("qa.how.visual")}</li>
          <li>{t("qa.how.lighthouse")}</li>
          <li>{t("qa.how.gate")}</li>
        </ul>
      </section>
    </div>
  );
}
