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
  lighthouse: LighthouseScores | null;
  /** Lighthouse on the deployed site (HTTPS, GitHub's CDN), merged in after going live. */
  lighthouseLive?: (LighthouseScores & { url: string; measuredAt: string }) | null;
  /** Stryker on the game logic: how many injected bugs the tests caught. */
  mutation?: {
    score: number;
    killed: number;
    survived: number;
    timeout: number;
    noCoverage: number;
    total: number;
  } | null;
  /** The frame-rate test's scripted play session. */
  performance?: {
    fps: number;
    low1Fps: number;
    p99Ms: number;
    frames: number;
    longTasks?: number;
    mainThreadPct?: number;
    mainThreadMsPerFrame?: number;
    mainThreadBudgetPct?: number;
    fpsFloor: number;
    lowFloor: number;
  } | null;
  /** The tools' own full HTML reports, published next to qa-report.json (relative links). */
  links?: Partial<Record<ReportLinkKey, string>>;
  /** Certification checklist id → result of its tagged end-to-end test(s). */
  certification?: Record<string, "passed" | "failed" | "skipped"> | null;
}

export type ReportLinkKey = "e2e" | "perf" | "coverage" | "mutation" | "lighthouse" | "lighthouseLive";

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export type QAReportState = { status: "loading" } | { status: "missing" } | { status: "ready"; data: QAReportData };

/** Loads qa-report.json, published next to the page by the deploy pipeline. */
export function useQAReport(): QAReportState {
  const [state, setState] = useState<QAReportState>({ status: "loading" });
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
  return state;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** A Lighthouse-style score ring. */
/** `isName` marks a label that is a name, not text to translate ("SEO"). */
function Gauge({ label, score, isName = false }: { label: string; score: number; isName?: boolean }) {
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
      <span className="gauge__label" translate={isName ? "no" : undefined}>
        {label}
      </span>
    </div>
  );
}

/** "Open the full report" for a tile, when the pipeline published that tool's report. */
function FullReport({ href, label }: { href?: string; label?: string }) {
  const { t } = useI18n();
  if (!href) return null;
  return (
    <a className="qa__full" href={href} target="_blank" rel="noopener noreferrer">
      {label ?? t("qa.fullReport")}
      <span className="visually-hidden"> {t("a11y.newTab")}</span>
    </a>
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
  const { t, date } = useI18n();
  const state = useQAReport();

  if (state.status === "loading") return <p className="qa__note">{t("qa.loading")}</p>;
  if (state.status === "missing") return <p className="qa__note">{t("qa.missing")}</p>;

  const { data } = state;
  const { unit, coverage, e2e, lighthouse } = data;
  const live = data.lighthouseLive ?? null;
  const passing = (unit?.failed ?? 0) === 0 && (e2e?.failed ?? 0) === 0;
  const formatWhen = (iso: string) => date(iso, { dateStyle: "medium", timeStyle: "short" });
  const when = formatWhen(data.generatedAt);

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
            <FullReport href={data.links?.coverage} label={t("qa.coverageReport")} />
          </section>
        )}
        {e2e && (
          <section className="qa__tile">
            <h3>{t("qa.e2e")}</h3>
            <p className="qa__big">
              {e2e.passed}/{e2e.passed + e2e.failed}
            </p>
            <p>
              {/* The tool and the project names from the test config are identifiers, not text. */}
              <span translate="no">Playwright · {e2e.projects.join(" + ")}</span> ·{" "}
              {t("qa.e2eDetail", { skipped: e2e.skipped })}
            </p>
            <FullReport href={data.links?.e2e} />
          </section>
        )}
        {e2e && (
          <section className="qa__tile">
            <h3>{t("qa.a11y")}</h3>
            <p className="qa__big">{e2e.accessibilityScans}</p>
            <p>{t("qa.a11yDetail")}</p>
            <FullReport href={data.links?.e2e} />
          </section>
        )}
        {coverage && (
          <section className="qa__tile qa__tile--wide">
            <h3>{t("qa.coverage")}</h3>
            <Meter label={t("qa.lines")} value={coverage.lines} />
            <Meter label={t("qa.statements")} value={coverage.statements} />
            <Meter label={t("qa.functions")} value={coverage.functions} />
            <Meter label={t("qa.branches")} value={coverage.branches} />
            <FullReport href={data.links?.coverage} />
          </section>
        )}
        {data.mutation && (
          <section className="qa__tile">
            <h3>{t("qa.mutation")}</h3>
            <p className="qa__big">{data.mutation.score}%</p>
            <p>
              {t("qa.mutationDetail", {
                killed: data.mutation.killed + data.mutation.timeout,
                total: data.mutation.total,
              })}
            </p>
            <FullReport href={data.links?.mutation} />
          </section>
        )}
        {data.performance && (
          <section className="qa__tile">
            <h3>{t("qa.perf")}</h3>
            {data.performance.mainThreadMsPerFrame !== undefined ? (
              <>
                {/* GPU-independent: the share of each frame the app's own work takes. */}
                <p className="qa__big">{t("qa.perfMs", { ms: data.performance.mainThreadMsPerFrame })}</p>
                <p>
                  {t("qa.perfDetail", {
                    pct: data.performance.mainThreadPct ?? 0,
                    budget: data.performance.mainThreadBudgetPct ?? 0,
                  })}
                </p>
                <p className="qa__fine">{t("qa.perfFps", { fps: Math.round(data.performance.fps) })}</p>
              </>
            ) : (
              <>
                {/* Reports from before the main-thread measurement. */}
                <p className="qa__big">{t("qa.perfFpsBig", { fps: Math.round(data.performance.fps) })}</p>
                <p>
                  {t("qa.perfLegacy", {
                    low: Math.round(data.performance.low1Fps),
                    floor: data.performance.fpsFloor,
                    lowFloor: data.performance.lowFloor,
                  })}
                </p>
              </>
            )}
            <FullReport href={data.links?.perf} />
          </section>
        )}
        {data.certification && (
          <section className="qa__tile">
            <h3>{t("qa.cert")}</h3>
            <p className="qa__big">
              {Object.values(data.certification).filter((r) => r === "passed").length}/
              {Object.keys(data.certification).length}
            </p>
            <p>{t("qa.certDetail")}</p>
            <FullReport href={data.links?.e2e} />
          </section>
        )}
        {(live ?? lighthouse) && (
          <section className="qa__tile qa__tile--wide">
            <h3 translate="no">Lighthouse</h3>
            <p className="qa__source">
              {live ? (
                <>
                  {t("qa.lh.live", { when: formatWhen(live.measuredAt) })} {/* A URL is an address, not text. */}
                  <a href={live.url} target="_blank" rel="noopener noreferrer" translate="no">
                    {live.url.replace(/^https?:\/\//, "")}
                  </a>
                </>
              ) : (
                t("qa.lh.preDeploy")
              )}
            </p>
            <div className="qa__gauges">
              <Gauge label={t("qa.lh.performance")} score={(live ?? lighthouse)!.performance} />
              <Gauge label={t("qa.lh.accessibility")} score={(live ?? lighthouse)!.accessibility} />
              <Gauge label={t("qa.lh.bestPractices")} score={(live ?? lighthouse)!.bestPractices} />
              <Gauge label="SEO" score={(live ?? lighthouse)!.seo} isName />
            </div>
            {(data.links?.lighthouseLive || data.links?.lighthouse) && (
              <p className="qa__reports">
                <FullReport href={data.links?.lighthouseLive} label={t("qa.lh.reportLive")} />
                <FullReport href={data.links?.lighthouse} label={t("qa.lh.reportPre")} />
              </p>
            )}
            {live && lighthouse && (
              <p className="qa__source">
                {t("qa.lh.compare", {
                  scores: [
                    lighthouse.performance,
                    lighthouse.accessibility,
                    lighthouse.bestPractices,
                    lighthouse.seo,
                  ].join(" · "),
                })}
              </p>
            )}
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
                {/* Test titles, reasons and project names are the test suite's own words. */}
                <strong translate="no">{s.title}</strong>
                <span>
                  <span translate="no">{s.reason}</span> · {t("qa.skippedOn")}{" "}
                  <span translate="no">{s.projects.join(", ")}</span>
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
          <li>{t("qa.how.mutation")}</li>
          <li>{t("qa.how.perf")}</li>
          <li>{t("qa.how.pseudo")}</li>
          <li>{t("qa.how.lighthouse")}</li>
          <li>{t("qa.how.gate")}</li>
        </ul>
      </section>
    </div>
  );
}
