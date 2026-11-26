import { Frame } from "../../components/Frame";
import { ItemSlot } from "../../components/ItemSlot";
import type { Recipe } from "../../game/crafting/recipe";
import { useI18n } from "../../i18n/I18nProvider";
import { ItemGhost, ItemGrid } from "./ItemGrid";
import { useItems } from "./ItemsProvider";
import { useItemInteractions } from "./useItemInteractions";
import "./IdolPanel.css";

const SOCKET = { container: "altar" as const, index: 0 };

/**
 * The idol board: a 5 × 5 grid with blocked cells, and above it a socket whose altar reshapes the board
 * and empowers some of its cells. What sits here counts on the character sheet; each item's tooltip
 * says what it does.
 */
export function IdolPanel({ onOpenBench }: { onOpenBench: (recipe: Recipe) => void }) {
  const { t } = useI18n();
  const { altar, held } = useItems();
  const interactions = useItemInteractions({ onOpenBench });
  const heldHere = held?.container === "altar";

  return (
    <Frame title={t("panel.idols")} titleId="idols-title" className="idol-panel">
      <div
        className={`idol-socket ${altar ? "" : "idol-socket--empty"} ${heldHere ? "is-held" : ""}`}
        data-cell=""
        data-container="altar"
        data-index={0}
        {...(altar ? interactions.cellHandlers(SOCKET, altar) : {})}
      >
        {altar ? (
          <ItemSlot
            testId="altar-0"
            shape="fill"
            label={interactions.nameOf(altar)}
            placement="left"
            {...interactions.slotProps(SOCKET, altar)}
          />
        ) : (
          <>
            <span className="visually-hidden">{t("idols.emptySocket")}</span>
            {held && (
              <button
                type="button"
                className="item-grid__drop"
                aria-label={t("items.placeInSocket")}
                onClick={(e) => interactions.onClick(e, SOCKET, null)}
              />
            )}
          </>
        )}
      </div>
      <ItemGrid container="idols" label={t("panel.idols")} onOpenBench={onOpenBench} />
      <ItemGhost ghost={interactions.ghost} />
    </Frame>
  );
}
