import { useState, type KeyboardEvent } from "react";
import { ACTS, SIDE_QUESTS, TRIALS, monthsBetween, type Act } from "../../data/questLog";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import type { Locale } from "../../i18n/types";
import "./QuestLog.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
/** game-icons.net names (bundled via scripts/extract-tree-icons.mjs). */
const QUEST_ICONS = { doneIcon: "check-mark", trialIcon: "laurel-crown" } as const;

type Tab = string; // an act id, "side" or "trials"
const TABS: Tab[] = [...ACTS.map((a) => a.id), "side", "trials"];

function Glyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox={iconViewBox(name)} aria-hidden="true">
      {TREE_ICONS[name]?.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const monthLabel = (month: string, locale: Locale) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-GB", {
    month: "short",
    year: "numeric",
  });
};

/** The career as a PoE quest log: Acts (jobs), Side Quests (projects) and Trials (courses). */
export function QuestLog() {
  const { t, l, locale } = useI18n();
  // Open on the latest act, like the game opens on where you are.
  const [tab, setTab] = useState<Tab>(ACTS.at(-1)!.id);

  const select = (next: Tab) => {
    setTab(next);
    document.getElementById(`quest-tab-${next}`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      select(TABS[(i + step + TABS.length) % TABS.length]!);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(e.key === "Home" ? TABS[0]! : TABS.at(-1)!);
    }
  };

  const duration = (act: Act) => {
    const months = monthsBetween(act.from, act.to);
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y && t("quests.years", { n: y }), m && t("quests.months", { n: m })].filter(Boolean).join(" ");
  };

  const gems = (list: string[]) => (
    <ul className="gems" aria-label={t("quests.gems")}>
      {list.map((g) => (
        <li key={g} className="gem">
          {g}
        </li>
      ))}
    </ul>
  );

  const quests = (list: { en: string; pt: string }[]) => (
    <ul className="quests-list">
      {list.map((q, i) => (
        <li key={i}>
          <Glyph name={QUEST_ICONS.doneIcon} className="quests-list__check" />
          <span>{l(q)}</span>
        </li>
      ))}
    </ul>
  );

  const act = ACTS.find((a) => a.id === tab);

  return (
    <div className="questlog">
      <div className="questlog__tabs" role="tablist" aria-orientation="vertical" aria-label={t("nav.quests")}>
        {TABS.map((id) => {
          const index = ACTS.findIndex((a) => a.id === id);
          const a = ACTS[index];
          return (
            <button
              key={id}
              id={`quest-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls="quest-panel"
              tabIndex={tab === id ? 0 : -1}
              className="questlog__tab"
              onClick={() => setTab(id)}
              onKeyDown={onKeyDown}
            >
              {a ? (
                <>
                  <span className="questlog__tab-act">{t("quests.act", { n: ROMAN[index]! })}</span>{" "}
                  <span className="questlog__tab-sub">{a.company}</span>
                </>
              ) : (
                <span className="questlog__tab-act">{t(id === "side" ? "quests.side" : "quests.trials")}</span>
              )}
            </button>
          );
        })}
      </div>

      <section
        id="quest-panel"
        role="tabpanel"
        aria-labelledby={`quest-tab-${tab}`}
        className="questlog__panel"
        tabIndex={0}
      >
        {act && (
          <article>
            <header className="questlog__header">
              <h3>{l(act.role)}</h3>
              <p className="questlog__company">
                {act.company}
                {act.clients && (
                  <span>
                    {" "}
                    · {t("quests.clients")}: {act.clients.join(", ")}
                  </span>
                )}
              </p>
              <p className="questlog__meta">
                {monthLabel(act.from, locale)} – {monthLabel(act.to, locale)} · {duration(act)} · {l(act.place)}
              </p>
            </header>
            <h4>{t("quests.completed")}</h4>
            {quests(act.quests)}
            <h4>{t("quests.gems")}</h4>
            {gems(act.gems)}
          </article>
        )}

        {tab === "side" &&
          SIDE_QUESTS.map((q) => (
            <article key={q.id} className="questlog__side">
              <header className="questlog__header">
                <h3>{l(q.title)}</h3>
                {q.links && (
                  <p className="questlog__links">
                    {q.links.map((link) => (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        <svg className="questlog__link-icon" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />
                        </svg>
                      </a>
                    ))}
                  </p>
                )}
              </header>
              {quests(q.quests)}
              {gems(q.gems)}
            </article>
          ))}

        {tab === "trials" && (
          <article>
            <header className="questlog__header">
              <h3>{t("quests.trials")}</h3>
              <p className="questlog__meta">{t("quests.trialsHint")}</p>
            </header>
            <ul className="trials">
              {TRIALS.map((trial) => (
                <li key={trial.name}>
                  <Glyph name={QUEST_ICONS.trialIcon} className="trials__icon" />
                  <span>
                    <strong>{trial.name}</strong>
                    <small>{trial.issuer}</small>
                  </span>
                  {trial.href && (
                    <a href={trial.href} target="_blank" rel="noopener noreferrer">
                      {t("quests.verify")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </article>
        )}
      </section>
    </div>
  );
}
