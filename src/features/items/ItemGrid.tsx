import { useState, type PointerEvent, type SyntheticEvent } from "react";
import { ItemSlot } from "../../components/ItemSlot";
import { useToast } from "../../components/Toasts";
import { craftIcon } from "../../game/crafting/icons";
import { footprint } from "../../game/idols/grid";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import { EMPOWERED_PERCENT } from "../../game/idols/grid";
import { at, moveItem, planOf, shapeOf, type GridId, type Placed } from "./items";
import { useItems } from "./ItemsProvider";
import { cellFromPoint, useItemInteractions, type Openers } from "./useItemInteractions";
import "./ItemGrid.css";

interface Props extends Openers {
  container: GridId;
  label: string;
}

/** Small picture of an item, for the drag ghost. */
function ItemPicture({ placed }: { placed: Placed }) {
  const glyph = placed.kind === "craft" ? craftIcon(placed.item) : placed.item.gameIcon;
  if (glyph) {
    return (
      <svg viewBox={iconViewBox(glyph)} aria-hidden="true">
        {TREE_ICONS[glyph]?.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }
  return placed.kind === "display" && placed.item.icon ? <img src={placed.item.icon} alt="" /> : null;
}

/** The item following the pointer during a drag, drawn at its real size and centred on the pointer. */
export function ItemGhost({ ghost }: { ghost: { placed: Placed; x: number; y: number } | null }) {
  if (!ghost) return null;
  const { w, h } = shapeOf(ghost.placed.ref);
  return (
    <div
      className="item-ghost"
      aria-hidden="true"
      style={{
        left: ghost.x,
        top: ghost.y,
        width: `calc(var(--ghost-cell) * ${w})`,
        height: `calc(var(--ghost-cell) * ${h})`,
      }}
    >
      <ItemPicture placed={ghost.placed} />
    </div>
  );
}

const span = (index: number, columns: number, w = 1, h = 1) => ({
  gridColumn: w === 1 ? (index % columns) + 1 : `${(index % columns) + 1} / span ${w}`,
  gridRow: h === 1 ? Math.floor(index / columns) + 1 : `${Math.floor(index / columns) + 1} / span ${h}`,
});

/**
 * An item grid: the 12 × 5 bag or the idol board. Items span as many cells as their shape says;
 * covered cells aren't drawn. While something is carried, the grid previews where it would land.
 */
export function ItemGrid({ container, label, onOpenBench, onOpenCube, quickToCube }: Props) {
  const { t } = useI18n();
  const notify = useToast();
  const items = useItems();
  const { layout, pieces, held, carrying } = items;
  const interactions = useItemInteractions({ onOpenBench, onOpenCube, quickToCube });
  const [hover, setHover] = useState<number | null>(null);
  const plan = planOf(container, layout.altar);
  const list = pieces[container];

  // Which cell the pointer or keyboard is over, for the placement preview.
  const trackPointer = (e: PointerEvent) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    setHover(cell?.container === container ? cell.index : null);
  };
  const trackFocus = (e: SyntheticEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-cell]");
    setHover(el?.dataset.container === container ? Number(el.dataset.index) : null);
  };

  const carriedRef = carrying ? at(layout, carrying) : null;
  const carriedShape = carriedRef ? shapeOf(carriedRef) : null;
  const landing =
    carrying && carriedShape && hover !== null ? moveItem(layout, carrying, { container, index: hover }) : null;

  const anchors = new Map(list.map((piece) => [piece.index, piece]));
  const covered = new Set(
    list.flatMap((piece) => (footprint(plan, piece.index, piece.shape) ?? []).filter((c) => c !== piece.index)),
  );

  return (
    <>
      <ul
        className={`item-grid item-grid--${container} ${held ? "is-holding" : ""}`}
        aria-label={label}
        style={{ gridTemplateColumns: `repeat(${plan.columns}, var(--cell))` }}
        onPointerMove={trackPointer}
        onPointerLeave={() => setHover(null)}
        onFocus={trackFocus}
      >
        {Array.from({ length: plan.columns * plan.rows }, (_, index) => {
          if (covered.has(index)) return null;
          const cell = { container, index };
          const common = { "data-cell": "", "data-container": container, "data-index": index };

          if (plan.blocked.has(index)) {
            // Blocked, but still a target: a drop here snaps to the nearest spot that works.
            return (
              <li
                key={index}
                className="item-grid__cell item-grid__cell--blocked"
                style={span(index, plan.columns)}
                aria-hidden="true"
                {...common}
                onClick={held ? (e) => interactions.onClick(e, cell, null) : undefined}
              />
            );
          }

          const piece = anchors.get(index);
          if (!piece) {
            return (
              <li
                key={index}
                className={`item-grid__cell ${plan.empowered.has(index) ? "item-grid__cell--empowered" : ""}`}
                style={span(index, plan.columns)}
                data-empowered={plan.empowered.has(index) || undefined}
                {...common}
              >
                {held && (
                  <button
                    type="button"
                    className="item-grid__drop"
                    aria-label={t("items.placeHere", { where: interactions.where(container), n: index + 1 })}
                    onClick={(e) => interactions.onClick(e, cell, null)}
                  />
                )}
              </li>
            );
          }

          const { placed, shape, empowered } = piece;
          const note = empowered ? t("idols.empoweredNote", { percent: EMPOWERED_PERCENT }) : undefined;
          const name = interactions.nameOf(placed);
          const isHeld = held?.container === container && carrying?.index === index;
          return (
            <li
              key={index}
              className={`item-grid__cell ${isHeld ? "is-held" : ""} ${empowered ? "item-grid__cell--boosted" : ""}`}
              style={{
                ...span(index, plan.columns, shape.w, shape.h),
                width: `calc(var(--cell) * ${shape.w})`,
                height: `calc(var(--cell) * ${shape.h})`,
              }}
              {...common}
              data-w={shape.w}
              data-h={shape.h}
              {...interactions.cellHandlers(cell, placed)}
            >
              <ItemSlot
                testId={`${container}-${index}`}
                shape="fill"
                label={name}
                placement={container === "idols" ? "left" : "right"}
                className={placed.kind === "display" && placed.item.id === "replication-mirror" ? "slot--mirror" : ""}
                {...interactions.slotProps(cell, placed, note)}
              />
              {placed.kind === "craft" && (
                <button
                  type="button"
                  className="item-grid__remove"
                  aria-label={t("items.remove", { name })}
                  onClick={(e) => {
                    e.stopPropagation();
                    items.remove(cell);
                    notify(t("items.removed"));
                  }}
                >
                  <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
        {landing && carriedShape && (
          <li
            className={`item-preview ${landing.ok ? "item-preview--ok" : "item-preview--bad"}`}
            style={span(landing.ok ? landing.to.index : hover!, plan.columns, carriedShape.w, carriedShape.h)}
            aria-hidden="true"
            data-testid={`preview-${container}`}
          />
        )}
      </ul>
      <ItemGhost ghost={interactions.ghost} />
    </>
  );
}
