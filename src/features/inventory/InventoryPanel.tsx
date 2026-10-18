import { Frame } from "../../components/Frame";
import type { Recipe } from "../../game/crafting/recipe";
import { useI18n } from "../../i18n/I18nProvider";
import { Equipment } from "../equipment/EquipmentPanel";
import { ItemGrid } from "../stash/ItemGrid";
import "./InventoryPanel.css";

/** PoE's inventory window: equipment on top, the 12 × 5 bag grid underneath. */
export function InventoryPanel({ onOpenBench }: { onOpenBench: (recipe?: Recipe) => void }) {
  const { t } = useI18n();

  return (
    <Frame title={t("panel.inventory")} titleId="inventory-title" className="inv-panel">
      <Equipment />
      <div className="bag">
        <ItemGrid container="bag" label={t("panel.backpack")} onOpenBench={onOpenBench} />
      </div>
    </Frame>
  );
}
