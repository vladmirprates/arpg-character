import { memo, useMemo } from "react";
import type { TreeNode } from "../../game/tree/data";
import { NODES } from "../../game/tree/data";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { REGION_NAMES, sumStats, summarize } from "../../game/tree/summary";
import { useI18n } from "../../i18n/I18nProvider";

interface Props {
  allocated: ReadonlySet<string>;
  /** Pans the tree to a node and focuses it. */
  onLocate: (id: string) => void;
}

/**
 * The build at a glance, like PoE's character stats panel: keystones and masteries, the skills
 * picked in each area, and the small nodes' stats added up. Each entry jumps to its node.
 */
export const BuildSummary = memo(function BuildSummary({ allocated, onLocate }: Props) {
  const { t, l } = useI18n();
  const summary = useMemo(() => summarize(allocated, NODES), [allocated]);
  const totals = useMemo(() => sumStats(summary.minorStats.map(l)), [summary, l]);
  const skillCount = summary.skills.reduce((n, g) => n + g.nodes.length, 0);
  const empty = !skillCount && !summary.keystones.length && !summary.masteries.length;

  const entry = (n: TreeNode) => (
    <li key={n.id}>
      <button
        type="button"
        className={`summary__node summary__node--${n.kind} tree-node--${n.region}`}
        onClick={() => onLocate(n.id)}
        aria-label={t("summary.locate", { name: l(n.name) })}
      >
        <svg viewBox={iconViewBox(n.icon)} aria-hidden="true">
          {TREE_ICONS[n.icon]?.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        <span>{l(n.name)}</span>
      </button>
    </li>
  );

  return (
    <aside id="build-summary" className="summary" aria-labelledby="summary-title" data-testid="build-summary">
      <h3 id="summary-title" className="summary__title">
        {t("summary.title")}
      </h3>
      {empty ? (
        <p className="summary__empty">{t("summary.empty")}</p>
      ) : (
        <>
          <p className="summary__counts">
            {t("summary.counts", {
              skills: skillCount,
              masteries: summary.masteries.length,
              keystones: summary.keystones.length,
            })}
          </p>

          {summary.keystones.length > 0 && (
            <section>
              <h4>{t("summary.keystones")}</h4>
              <ul>{summary.keystones.map(entry)}</ul>
            </section>
          )}
          {summary.masteries.length > 0 && (
            <section>
              <h4>{t("summary.masteries")}</h4>
              <ul>{summary.masteries.map(entry)}</ul>
            </section>
          )}
          {summary.skills.map(({ region, nodes }) => (
            <section key={region}>
              <h4>{region === "core" ? t("summary.softSkills") : l(REGION_NAMES[region])}</h4>
              <ul>{nodes.map(entry)}</ul>
            </section>
          ))}
          {totals.length > 0 && (
            <section>
              <h4>{t("summary.totals")}</h4>
              <ul className="summary__totals">
                {totals.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </aside>
  );
});
