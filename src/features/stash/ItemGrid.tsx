import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { DisplayItemCard, CraftedItemCard, displayItemClipboard, displayItemText } from "../../components/ItemCard";
import { ItemSlot } from "../../components/ItemSlot";
import { useToast } from "../../components/Toasts";
import { describeItem, itemSummary, itemToText } from "../../game/crafting/describe";
import { craftIcon } from "../../game/crafting/icons";
import type { Recipe } from "../../game/crafting/recipe";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import { COLUMNS, SIZES, other, sameCell, type Cell, type ContainerId, type Placed } from "./items";
import { useItems } from "./StashProvider";
import { useBounty, usePlanted } from "../bounty/BountyProvider";
import { BUGGY } from "../bounty/plantedBugs";

/** The bag item that carries the "stack" bug while a hunt runs. */
const STACK_BUG_ITEM = "ticket-whetstone";
import "./ItemGrid.css";

interface Props {
  container: ContainerId;
  label: string;
  onOpenBench: (recipe: Recipe) => void;
}

const cellFromPoint = (x: number, y: number): Cell | null => {
  const el = document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-cell]");
  if (!el) return null;
  return { container: el.dataset.container as ContainerId, index: Number(el.dataset.index) };
};

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

/**
 * A PoE-style item grid. Items move freely between the bag and the stash:
 *   drag and drop · click to pick up, click a cell to place (the single-pointer alternative to
 *   dragging, WCAG 2.5.7) · Ctrl+click sends to the other container · double-click opens a craft.
 * Keyboard: Enter picks up / places, Ctrl+Enter sends across, Shift+Enter opens a craft, Esc cancels.
 */
export function ItemGrid({ container, label, onOpenBench }: Props) {
  const { t, l, locale, lang } = useI18n();
  const notify = useToast();
  const items = useItems();
  const { cells, held } = items;
  // Find the Bugs: while planted, the Ticket Whetstone's tooltip disagrees with its stack badge.
  const stackBug = usePlanted("stack");
  const bounty = useBounty();
  /** Which planted bug, if any, has affected this cell — what Inspect Element can report. */
  const affectedBy = (cell: Cell, placed: Placed) => {
    if (bounty.isPlanted("dupe") && bounty.evidence("dupe").includes(`${cell.container}:${cell.index}|${placed.ref}`))
      return "dupe";
    if (bounty.isPlanted("stale-save") && bounty.evidence("stale-save").includes(placed.ref)) return "stale-save";
    return undefined;
  };
  const list = cells[container];
  const columns = COLUMNS[container];
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ placed: Placed; x: number; y: number } | null>(null);

  const nameOf = (placed: Placed) =>
    placed.kind === "craft" ? describeItem(placed.item, lang).name : l(placed.item.name);
  const where = (c: ContainerId) => t(c === "bag" ? "items.bag" : "items.stash");

  const sendAcross = (cell: Cell, placed: Placed) => {
    if (items.quickMove(cell))
      items.announce(t("items.moved", { name: nameOf(placed), where: where(other(cell.container)) }));
    else notify(t("items.full", { where: where(other(cell.container)) }), "error");
  };

  const activate = (cell: Cell, placed: Placed | null, e: { ctrlKey: boolean; metaKey: boolean }) => {
    if (held) {
      const moving = cells[held.container][held.index];
      items.dropOn(cell);
      if (moving && !sameCell(held, cell)) {
        items.announce(t("items.moved", { name: nameOf(moving), where: where(cell.container) }));
      }
      return;
    }
    if (!placed) return;
    if (e.ctrlKey || e.metaKey) return sendAcross(cell, placed);
    items.pickUp(cell);
    items.announce(t("items.pickedUp", { name: nameOf(placed) }));
  };

  // A drag is tracked on the window: a fast flick can leave the item before its first move event.
  const onPointerDown = (e: PointerEvent, cell: Cell, placed: Placed) => {
    if (e.button !== 0 || held) return;
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const onMove = (ev: globalThis.PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) active = true;
      if (active) setGhost({ placed, x: ev.clientX, y: ev.clientY });
    };
    const finish = (ev: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (!active) return;
      setGhost(null);
      // Swallow the click this release may produce, but only that one.
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      if (ev.type === "pointercancel") return;
      const to = cellFromPoint(ev.clientX, ev.clientY);
      if (to && !sameCell(to, cell)) {
        items.dropOn(to, cell);
        items.announce(t("items.moved", { name: nameOf(placed), where: where(to.container) }));
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const onClick = (e: MouseEvent, cell: Cell, placed: Placed | null) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    activate(cell, placed, e);
  };

  const onKeyDown = (e: KeyboardEvent, cell: Cell, placed: Placed | null) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (e.shiftKey && placed?.kind === "craft") return onOpenBench(placed.recipe);
    activate(cell, placed, e);
  };

  return (
    <>
      <ul
        className={`item-grid item-grid--${container} ${held ? "is-holding" : ""}`}
        aria-label={label}
        style={{ gridTemplateColumns: `repeat(${columns}, var(--cell))` }}
      >
        {list.map((placed, index) => {
          const cell = { container, index };
          const isHeld = !!held && sameCell(held, cell);
          const style = { gridColumn: (index % columns) + 1, gridRow: Math.floor(index / columns) + 1 };
          const common = {
            "data-cell": "",
            "data-container": container,
            "data-index": index,
            style,
          };

          if (!placed) {
            return (
              <li key={index} className="item-grid__cell" {...common}>
                {held && (
                  <button
                    type="button"
                    className="item-grid__drop"
                    aria-label={t("items.placeHere", { where: where(container), n: index + 1 })}
                    onClick={(e) => onClick(e, cell, null)}
                  />
                )}
              </li>
            );
          }

          const name = nameOf(placed);
          const hint = t(placed.kind === "craft" ? "items.hintCraft" : "items.hint", {
            where: where(other(container)),
          });
          const slot =
            placed.kind === "craft"
              ? (() => {
                  const view = describeItem(placed.item, lang);
                  return {
                    planted: affectedBy(cell, placed),
                    glyph: craftIcon(placed.item),
                    rarity: placed.item.corrupted ? ("corrupted" as const) : placed.item.rarity,
                    description: `${itemSummary(view, lang)}. ${hint}`,
                    tooltip: <CraftedItemCard view={view} footer={hint} />,
                    copyText: () => itemToText(view, view.baseName, locale),
                  };
                })()
              : (() => {
                  const buggy = stackBug.planted && placed.item.id === STACK_BUG_ITEM;
                  const item = buggy ? { ...placed.item, properties: [BUGGY.stack] } : placed.item;
                  return {
                    planted: affectedBy(cell, placed) ?? (buggy ? "stack" : undefined),
                    icon: item.icon,
                    glyph: item.gameIcon,
                    rarity: item.rarity,
                    stack: item.stack,
                    description: `${displayItemText(item, l)}. ${hint}`,
                    tooltip: <DisplayItemCard item={item} />,
                    copyText: () => displayItemClipboard(item, l),
                  };
                })();

          return (
            <li
              key={index}
              className={`item-grid__cell ${isHeld ? "is-held" : ""}`}
              {...common}
              onPointerDown={(e) => onPointerDown(e, cell, placed)}
              onClick={(e) => onClick(e, cell, placed)}
              onDoubleClick={() => {
                if (placed.kind === "craft") {
                  items.cancel();
                  onOpenBench(placed.recipe);
                }
              }}
              onKeyDown={(e) => onKeyDown(e, cell, placed)}
            >
              <ItemSlot
                testId={`${container}-${index}`}
                shape="fill"
                label={name}
                placement={container === "stash" ? "left" : "right"}
                className={placed.kind === "display" && placed.item.id === "replication-mirror" ? "slot--mirror" : ""}
                {...slot}
              />
              {placed.kind === "craft" && (
                <button
                  type="button"
                  className="item-grid__remove"
                  aria-label={t("stash.remove", { name })}
                  onClick={(e) => {
                    e.stopPropagation();
                    items.remove(cell);
                    notify(t("stash.removed"));
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
      </ul>
      {ghost && (
        <div className="item-ghost" aria-hidden="true" style={{ left: ghost.x, top: ghost.y }}>
          <ItemPicture placed={ghost.placed} />
        </div>
      )}
    </>
  );
}

export const BAG_ROWS = SIZES.bag / COLUMNS.bag;
