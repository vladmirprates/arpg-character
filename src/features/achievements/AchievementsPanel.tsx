import { ACHIEVEMENTS } from "../../data/achievements";
import { progressOf, targetOf } from "../../game/achievements";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import { useAchievements } from "./AchievementsProvider";
import "./AchievementsPanel.css";

/** The challenge board: every achievement, its progress, and when it was unlocked. */
export function AchievementsPanel() {
  const { t, l, date } = useI18n();
  const { state, unlockedCount, reset } = useAchievements();
  const total = ACHIEVEMENTS.length;
  const when = (ms: number) => date(ms, { dateStyle: "medium" });

  return (
    // Focusable so keyboard users can scroll it (WCAG 2.1.1).
    <div className="achievements" tabIndex={0} role="region" aria-label={t("nav.achievements")}>
      <div className="achievements__summary">
        <p>{t("ach.progress", { n: unlockedCount, total })}</p>
        <div
          className="achievements__bar"
          role="progressbar"
          aria-label={t("nav.achievements")}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={unlockedCount}
        >
          <div style={{ width: `${(unlockedCount / total) * 100}%` }} />
        </div>
      </div>

      <ul className="achievements__list">
        {ACHIEVEMENTS.map((a) => {
          const unlockedAt = state.unlocked[a.id];
          const done = unlockedAt !== undefined;
          const target = targetOf(a);
          const step = progressOf(state, a);
          return (
            <li
              key={a.id}
              className={`achievement ${done ? "is-done" : ""}`}
              data-testid={`ach-${a.id}`}
              data-unlocked={done}
            >
              <svg className="achievement__icon" viewBox={iconViewBox(a.icon)} aria-hidden="true">
                {TREE_ICONS[a.icon]?.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
              <div className="achievement__text">
                <strong>{l(a.title)}</strong>
                <span>{l(a.description)}</span>
              </div>
              <span className="achievement__state">
                {done
                  ? t("ach.unlockedOn", { date: when(unlockedAt) })
                  : target > 1
                    ? `${step}/${target}`
                    : t("ach.locked")}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="achievements__footer">
        <span>{t("ach.howTracked")}</span>
        <button
          type="button"
          className="btn btn--sm"
          onClick={reset}
          disabled={unlockedCount === 0 && !Object.keys(state.progress).length}
        >
          {t("ach.reset")}
        </button>
      </p>
    </div>
  );
}
