import { useEffect, useState } from "react";
import { playSfx } from "../../audio/sfx";
import { CUBE_RECIPES } from "../../data/cube";
import type { Recipe } from "../../game/crafting/recipe";
import { useI18n } from "../../i18n/I18nProvider";
import { ItemGrid } from "../items/ItemGrid";
import { hasResult } from "../items/items";
import { useItems } from "../items/ItemsProvider";
import "./TriageCube.css";

/**
 * The cube's window: its own 4 × 4 grid and a Transmute button beside the bag, so items can be dragged
 * between them. Items left inside stay there across reloads. The page behind a modal can't be reached,
 * which is why the bag is drawn in here too.
 */
export function TriageCube({ onOpenBench }: { onOpenBench: (recipe: Recipe) => void }) {
  const { t, l } = useI18n();
  const { layout, pieces, transmute, cancel } = useItems();
  const [message, setMessage] = useState("");
  const known = CUBE_RECIPES.filter((recipe) => hasResult(layout, recipe));

  // Whatever is held stays where it was when the window closes.
  useEffect(() => cancel, [cancel]);

  const onTransmute = () => {
    const result = transmute();
    if (result.ok) {
      playSfx("save");
      setMessage(t("cube.made", { name: l(result.recipe.result.name) }));
      return;
    }
    playSfx("error");
    setMessage(t(result.reason === "known" ? "cube.known" : "cube.nothing"));
  };

  return (
    <div className="cube">
      <p className="cube__intro">{t("cube.intro")}</p>
      <div className="cube__window">
        <section className="cube__chamber" aria-label={t("nav.cube")}>
          <ItemGrid container="cube" label={t("nav.cube")} onOpenBench={onOpenBench} quickToCube />
          <button
            type="button"
            className="btn btn--primary cube__go"
            disabled={pieces.cube.length === 0}
            onClick={onTransmute}
            data-testid="cube-transmute"
          >
            {t("cube.transmute")}
          </button>
        </section>
        <section className="cube__bag" aria-label={t("panel.backpack")}>
          <ItemGrid container="bag" label={t("panel.backpack")} onOpenBench={onOpenBench} quickToCube />
        </section>
      </div>
      <p className="cube__result" role="status" data-testid="cube-result">
        {message}
      </p>
      <p className="cube__heading">{t("cube.discovered", { n: known.length, total: CUBE_RECIPES.length })}</p>
    </div>
  );
}
