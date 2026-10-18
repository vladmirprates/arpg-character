import { Frame } from "../../components/Frame";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import { useBounty } from "../bounty/BountyProvider";
import { PLANTED_BUGS } from "../bounty/plantedBugs";
import "./FeaturesPanel.css";

/** game-icons.net names (bundled via scripts/extract-tree-icons.mjs). */
const FEATURE_ICONS = {
  treeIcon: "oak",
  benchIcon: "anvil-impact",
  questsIcon: "scroll-quill",
  cardsIcon: "card-random",
  bountyIcon: "ladybug",
  qaIcon: "checklist",
} as const;

interface Props {
  onOpenTree: () => void;
  onOpenBench: () => void;
  onOpenQuests: () => void;
  onOpenCards: () => void;
  onOpenBounty: () => void;
  onOpenQA: () => void;
}

/** The big features — tree, bench, quest log, cards, Find the Bugs — opened from the sheet itself. */
export function FeaturesPanel({ onOpenTree, onOpenBench, onOpenQuests, onOpenCards, onOpenBounty, onOpenQA }: Props) {
  const { t } = useI18n();
  const { active, found } = useBounty();
  const glyph = (name: string) => (
    <svg className="feature__icon" viewBox={iconViewBox(name)} aria-hidden="true">
      {TREE_ICONS[name]?.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );

  return (
    <Frame title={t("panel.features")} titleId="features-title" className="features-panel">
      <nav className="features" aria-labelledby="features-title">
        <button type="button" className="btn feature" onClick={onOpenTree} data-testid="open-tree">
          {glyph(FEATURE_ICONS.treeIcon)}
          {t("nav.tree")}
        </button>
        <button type="button" className="btn feature" onClick={onOpenBench} data-testid="open-bench">
          {glyph(FEATURE_ICONS.benchIcon)}
          {t("nav.crafting")}
        </button>
        <button type="button" className="btn feature" onClick={onOpenQuests} data-testid="open-quests">
          {glyph(FEATURE_ICONS.questsIcon)}
          {t("nav.quests")}
        </button>
        <button type="button" className="btn feature" onClick={onOpenCards} data-testid="open-cards">
          {glyph(FEATURE_ICONS.cardsIcon)}
          {t("nav.cards")}
        </button>
        <button type="button" className="btn feature" onClick={onOpenBounty} data-testid="open-bounty">
          {glyph(FEATURE_ICONS.bountyIcon)}
          {t("nav.bounty")}
          {/* Hunt progress, only while one is running. */}
          {active && (
            <span className="feature__badge">
              {found.size}/{PLANTED_BUGS.length}
            </span>
          )}
        </button>
        <button type="button" className="btn feature" onClick={onOpenQA} data-testid="open-qa">
          {glyph(FEATURE_ICONS.qaIcon)}
          {t("nav.qa")}
        </button>
      </nav>
    </Frame>
  );
}
