import { Frame } from "../../components/Frame";
import type { Recipe } from "../../game/crafting/recipe";
import { useI18n } from "../../i18n/I18nProvider";
import { ItemGrid } from "./ItemGrid";
import { STASH_SIZE, useItems } from "./StashProvider";
import "./StashPanel.css";

interface Props {
  onOpenBench: (recipe?: Recipe) => void;
}

/**
 * The stash, drawn like a PoE stash tab (8 × 3). Crafts kept at the bench land here; any item can
 * be moved between it and the bag.
 */
export function StashPanel({ onOpenBench }: Props) {
  const { t } = useI18n();
  const { cells } = useItems();
  const kept = cells.stash.filter(Boolean).length;

  return (
    <Frame title={t("panel.stash")} titleId="stash-title" className="stash-panel">
      <div className="stash-tabs" aria-hidden="true">
        <span className="stash-tabs__tab">{t("stash.tab")}</span>
        <span className="stash-tabs__count">
          {kept}/{STASH_SIZE}
        </span>
      </div>
      <ItemGrid container="stash" label={t("panel.stash")} onOpenBench={onOpenBench} />
      {kept === 0 && <p className="stash-empty">{t("stash.empty")}</p>}
    </Frame>
  );
}
