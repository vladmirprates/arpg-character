import { Frame } from "../../components/Frame";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import { useBounty } from "../bounty/BountyProvider";
import { PLANTED_BUGS } from "../bounty/plantedBugs";
import { ACHIEVEMENTS } from "../../data/achievements";
import { useAchievements } from "../achievements/AchievementsProvider";
import "./FeaturesPanel.css";

/** game-icons.net names (bundled via scripts/extract-tree-icons.mjs). */
const FEATURE_ICONS = {
  treeIcon: "oak",
  benchIcon: "anvil-impact",
  questsIcon: "scroll-quill",
  cardsIcon: "card-random",
  bountyIcon: "ladybug",
  qaIcon: "checklist",
  achievementsIcon: "trophy",
  certIcon: "ribbon-medal",
} as const;

interface Props {
  onOpenTree: () => void;
  onOpenBench: () => void;
  onOpenQuests: () => void;
  onOpenCards: () => void;
  onOpenBounty: () => void;
  onOpenQA: () => void;
  onOpenAchievements: () => void;
  onOpenCert: () => void;
}

/** The big features — tree, bench, quest log, cards, Find the Bugs, … — opened from the sheet itself. */
export function FeaturesPanel({
  onOpenTree,
  onOpenBench,
  onOpenQuests,
  onOpenCards,
  onOpenBounty,
  onOpenQA,
  onOpenAchievements,
  onOpenCert,
}: Props) {
  const { t } = useI18n();
  const { active, found } = useBounty();
  const { unlockedCount } = useAchievements();
  const features = [
    { id: "tree", icon: FEATURE_ICONS.treeIcon, label: t("nav.tree"), onClick: onOpenTree },
    { id: "bench", icon: FEATURE_ICONS.benchIcon, label: t("nav.crafting"), onClick: onOpenBench },
    { id: "quests", icon: FEATURE_ICONS.questsIcon, label: t("nav.quests"), onClick: onOpenQuests },
    { id: "cards", icon: FEATURE_ICONS.cardsIcon, label: t("nav.cards"), onClick: onOpenCards },
    {
      id: "bounty",
      icon: FEATURE_ICONS.bountyIcon,
      label: t("nav.bounty"),
      onClick: onOpenBounty,
      // Hunt progress, only while one is running.
      progress: active ? t("features.found", { n: found.size, total: PLANTED_BUGS.length }) : undefined,
    },
    { id: "qa", icon: FEATURE_ICONS.qaIcon, label: t("nav.qa"), onClick: onOpenQA },
    { id: "cert", icon: FEATURE_ICONS.certIcon, label: t("nav.cert"), onClick: onOpenCert },
    {
      id: "achievements",
      icon: FEATURE_ICONS.achievementsIcon,
      label: t("nav.achievements"),
      onClick: onOpenAchievements,
      progress: t("ach.progress", { n: unlockedCount, total: ACHIEVEMENTS.length }),
    },
  ];
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
        {features.map((f) => (
          <button key={f.id} type="button" className="btn feature" onClick={f.onClick} data-testid={`open-${f.id}`}>
            {glyph(f.icon)}
            <span className="feature__text">
              <span className="feature__label">{f.label}</span>
              {f.progress && <span className="feature__progress">{f.progress}</span>}
            </span>
          </button>
        ))}
      </nav>
    </Frame>
  );
}
