import { useState } from "react";
import { SOCIALS } from "../../data/character";
import { useI18n } from "../../i18n/I18nProvider";
import { useBounty } from "./BountyProvider";
import { PLANTED_BUGS } from "./plantedBugs";
import "./BugBounty.css";

/**
 * The bounty board. Before a hunt: how it works and a start button. During one: progress, a bug
 * report for every find, hints for the rest. After the last find: the win message.
 */
export function BugBounty() {
  const { t, l } = useI18n();
  const { active, found, start, stop } = useBounty();
  const [hints, setHints] = useState<Set<string>>(new Set());
  const done = !active && found.size === PLANTED_BUGS.length;
  const linkedin = SOCIALS.find((s) => s.id === "linkedin")!;

  const begin = () => {
    setHints(new Set());
    start(); // the board switches to the hunt view: progress and hints
  };

  if (!active && !done) {
    return (
      <div className="bounty">
        <p className="bounty__intro">{t("bounty.intro")}</p>
        <ol className="bounty__steps">
          <li>{t("bounty.step1")}</li>
          <li>{t("bounty.step2")}</li>
          <li>{t("bounty.step3")}</li>
          <li>{t("bounty.step4")}</li>
        </ol>
        <p className="bounty__how">{t("bounty.keyboard")}</p>
        <button type="button" className="btn btn--primary bounty__start" onClick={begin} data-testid="bounty-start">
          {t("bounty.start")}
        </button>
      </div>
    );
  }

  return (
    <div className="bounty">
      <div className="bounty__progress">
        <span>{t("bounty.progress", { n: found.size, total: PLANTED_BUGS.length })}</span>
        <div
          className="bounty__bar"
          role="progressbar"
          aria-label={t("bounty.progressLabel")}
          aria-valuenow={found.size}
          aria-valuemin={0}
          aria-valuemax={PLANTED_BUGS.length}
        >
          <div className="bounty__fill" style={{ width: `${(found.size / PLANTED_BUGS.length) * 100}%` }} />
        </div>
      </div>

      {done ? (
        <div className="bounty__win" role="status">
          <strong>{t("bounty.winTitle")}</strong>
          <p>
            {t("bounty.winText")}{" "}
            <a href={linkedin.href} target="_blank" rel="noopener noreferrer">
              {t("bounty.winLink")}
            </a>
          </p>
        </div>
      ) : (
        <p className="bounty__how">{t("bounty.how")}</p>
      )}

      <ol className="bounty__list">
        {PLANTED_BUGS.map((bug, i) =>
          found.has(bug.id) ? (
            <li key={bug.id} className="bounty__bug is-found" data-testid={`bounty-${bug.id}`}>
              <header>
                <span className="bounty__key">QA-{101 + i}</span>
                <strong>{l(bug.title)}</strong>
                <span className="bounty__fixed">{t("bounty.fixed")}</span>
                <span className={`bounty__sev bounty__sev--${bug.severity}`}>{t(`bounty.sev.${bug.severity}`)}</span>
              </header>
              <dl>
                <dt>{t("bounty.area")}</dt>
                <dd>{l(bug.area)}</dd>
                <dt>{t("bounty.steps")}</dt>
                <dd>
                  <ol className="bounty__steps-list">
                    {bug.steps.map((step, s) => (
                      <li key={s}>{l(step)}</li>
                    ))}
                  </ol>
                </dd>
                <dt>{t("bounty.actual")}</dt>
                <dd>{l(bug.actual)}</dd>
                <dt>{t("bounty.expected")}</dt>
                <dd>{l(bug.expected)}</dd>
              </dl>
            </li>
          ) : (
            <li key={bug.id} className="bounty__bug" data-testid={`bounty-${bug.id}`}>
              <header>
                <span className="bounty__key">QA-{101 + i}</span>
                <strong className="bounty__unknown">{t("bounty.unknown")}</strong>
                <button
                  type="button"
                  className="link-btn"
                  aria-expanded={hints.has(bug.id)}
                  onClick={() =>
                    setHints((h) => {
                      const next = new Set(h);
                      if (next.has(bug.id)) next.delete(bug.id);
                      else next.add(bug.id);
                      return next;
                    })
                  }
                >
                  {t("bounty.hint")}
                </button>
              </header>
              {hints.has(bug.id) && <p className="bounty__hint">{l(bug.hint)}</p>}
            </li>
          ),
        )}
      </ol>

      <div className="bounty__actions">
        {done ? (
          <button type="button" className="btn btn--sm" onClick={begin}>
            {t("bounty.again")}
          </button>
        ) : (
          <button type="button" className="btn btn--sm btn--ghost" onClick={stop}>
            {t("bounty.stop")}
          </button>
        )}
      </div>
    </div>
  );
}
