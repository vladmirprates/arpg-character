import { useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { DisplayItemCard, CraftedItemCard, displayItemClipboard, displayItemText } from "../../components/ItemCard";
import { ItemSlot } from "../../components/ItemSlot";
import { useToast } from "../../components/Toasts";
import { describeItem, itemSummary, itemToText } from "../../game/crafting/describe";
import { craftIcon } from "../../game/crafting/icons";
import type { Recipe } from "../../game/crafting/recipe";
import { useI18n } from "../../i18n/I18nProvider";
import { useBounty, usePlanted } from "../bounty/BountyProvider";
import { BUGGY } from "../bounty/plantedBugs";
import { altarOf, idolOf, isCube, planOf, type Cell, type ContainerId, type Placed, type Refusal } from "./items";
import { useItems } from "./ItemsProvider";

/** The bag item that carries the "stack" bug while a hunt runs. */
const STACK_BUG_ITEM = "ticket-whetstone";

/** Which cell of an element's grid a screen point is over: an item spanning cells knows its own. */
export function cellOfElement(el: HTMLElement, x: number, y: number): Cell {
  const container = el.dataset.container as ContainerId;
  const anchor = Number(el.dataset.index);
  const w = Number(el.dataset.w ?? 1);
  const h = Number(el.dataset.h ?? 1);
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height || (w === 1 && h === 1)) return { container, index: anchor };
  const col = Math.min(w - 1, Math.max(0, Math.floor(((x - rect.left) / rect.width) * w)));
  const row = Math.min(h - 1, Math.max(0, Math.floor(((y - rect.top) / rect.height) * h)));
  return { container, index: anchor + row * planOf(container).columns + col };
}

export const cellFromPoint = (x: number, y: number): Cell | null => {
  const el = document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-cell]");
  return el ? cellOfElement(el, x, y) : null;
};

const REFUSALS = {
  empty: "items.refuse.empty",
  "not-idol": "items.refuse.notIdol",
  "not-altar": "items.refuse.notAltar",
  "cube-in-cube": "items.refuse.cubeInCube",
  "no-fit": "items.refuse.noFit",
  "bag-full": "items.refuse.bagFull",
} as const satisfies Record<Refusal, string>;

export interface Openers {
  onOpenBench: (recipe: Recipe) => void;
  onOpenCube?: () => void;
  /** In the cube's window, Ctrl+click sends bag items to the cube instead of the board. */
  quickToCube?: boolean;
}

/**
 * How items are moved, shared by the bag and the idol board:
 *   drag and drop · click to pick up, click a cell to place (the single-pointer alternative to
 *   dragging, WCAG 2.5.7) · Ctrl+click sends an idol across · double-click opens a craft or the cube.
 * Keyboard: Enter picks up / places, Ctrl+Enter sends across, Shift+Enter opens, Esc cancels.
 */
export function useItemInteractions({ onOpenBench, onOpenCube, quickToCube = false }: Openers) {
  const { t, l, locale, lang } = useI18n();
  const notify = useToast();
  const items = useItems();
  const { held } = items;
  // Find the Bugs: while planted, the Ticket Whetstone's tooltip disagrees with its stack badge.
  const stackBug = usePlanted("stack");
  const bounty = useBounty();
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ placed: Placed; x: number; y: number } | null>(null);

  /** Which planted bug, if any, has affected this cell — what Inspect Element can report. */
  const affectedBy = (cell: Cell, placed: Placed) => {
    if (bounty.isPlanted("dupe") && bounty.evidence("dupe").includes(`${cell.container}:${cell.index}|${placed.ref}`))
      return "dupe";
    if (bounty.isPlanted("stale-save") && bounty.evidence("stale-save").some((key) => key.split("|")[0] === placed.ref))
      return "stale-save";
    return undefined;
  };

  const nameOf = (placed: Placed) =>
    placed.kind === "craft" ? describeItem(placed.item, lang).name : l(placed.item.name);
  const where = (c: ContainerId) =>
    t(c === "bag" ? "items.bag" : c === "idols" ? "items.idols" : c === "cube" ? "items.cube" : "items.altar");

  const finishDrop = (placed: Placed | null, to: Cell, refusal: Refusal | null) => {
    if (refusal) notify(t(REFUSALS[refusal]), "error");
    else if (placed) items.announce(t("items.moved", { name: nameOf(placed), where: where(to.container) }));
  };

  const sendAcross = (cell: Cell, placed: Placed) => {
    const result = items.quickMove(cell, { toCube: quickToCube });
    if ("reason" in result) notify(t(REFUSALS[result.reason]), "error");
    else items.announce(t("items.moved", { name: nameOf(placed), where: where(result.to) }));
  };

  const open = (placed: Placed) => {
    items.cancel();
    if (placed.kind === "craft") onOpenBench(placed.recipe);
    else if (isCube(placed.ref)) onOpenCube?.();
  };
  const canOpen = (placed: Placed) => placed.kind === "craft" || isCube(placed.ref);

  const activate = (cell: Cell, placed: Placed | null, e: { ctrlKey: boolean; metaKey: boolean }) => {
    if (held) {
      const moving = items.placedAt(held);
      finishDrop(moving, cell, items.dropOn(cell));
      return;
    }
    if (!placed) return;
    if (e.ctrlKey || e.metaKey) return sendAcross(cell, placed);
    items.pickUp(cell);
    items.announce(t("items.pickedUp", { name: nameOf(placed) }));
  };

  // A drag is tracked on the window: a fast flick can leave the item before its first move event.
  const onPointerDown = (e: PointerEvent, cell: Cell, placed: Placed) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const onMove = (ev: globalThis.PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
        active = true;
        // Starting a drag always works: it replaces anything still held from an earlier click.
        items.cancel();
        items.setDragging(cell);
      }
      if (active) setGhost({ placed, x: ev.clientX, y: ev.clientY });
    };
    const finish = (ev: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (!active) return;
      setGhost(null);
      items.setDragging(null);
      // Swallow the click this release may produce, but only that one.
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      if (ev.type === "pointercancel") return;
      const to = cellFromPoint(ev.clientX, ev.clientY);
      if (to) finishDrop(placed, to, items.dropOn(to, cell));
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
    // A real click knows which part of a multi-cell item it hit; a keyboard "click" has no position.
    const hit = e.detail > 0 ? (cellFromPoint(e.clientX, e.clientY) ?? cell) : cell;
    activate(held ? hit : cell, placed, e);
  };

  const onKeyDown = (e: KeyboardEvent, cell: Cell, placed: Placed | null) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (e.shiftKey && placed && canOpen(placed)) return open(placed);
    activate(cell, placed, e);
  };

  /** Everything a cell holding an item needs on its element. */
  const cellHandlers = (cell: Cell, placed: Placed) => ({
    onPointerDown: (e: PointerEvent) => onPointerDown(e, cell, placed),
    onClick: (e: MouseEvent) => onClick(e, cell, placed),
    onDoubleClick: () => {
      if (canOpen(placed)) open(placed);
    },
    onKeyDown: (e: KeyboardEvent) => onKeyDown(e, cell, placed),
  });

  /** What ItemSlot draws for an item in a given cell. */
  const slotProps = (cell: Cell, placed: Placed, note?: string): Partial<ComponentProps<typeof ItemSlot>> => {
    if (placed.kind === "craft") {
      const hint = t("items.hintCraft");
      const view = describeItem(placed.item, lang);
      return {
        planted: affectedBy(cell, placed),
        glyph: craftIcon(placed.item),
        rarity: placed.item.corrupted ? "corrupted" : placed.item.rarity,
        description: `${itemSummary(view, lang)}. ${hint}`,
        tooltip: <CraftedItemCard view={view} footer={hint} />,
        copyText: () => itemToText(view, view.baseName, locale),
      };
    }
    const idol = idolOf(placed.ref) ?? altarOf(placed.ref);
    const cube = isCube(placed.ref);
    const inBag = cell.container === "bag";
    const hint = t(
      quickToCube
        ? inBag && !cube
          ? "items.hintToCube"
          : inBag
            ? "items.hintMove"
            : "items.hintUnequip"
        : cube
          ? "items.hintCube"
          : !idol
            ? "items.hintMove"
            : inBag
              ? "items.hintEquip"
              : "items.hintUnequip",
    );
    const buggy = stackBug.planted && placed.item.id === STACK_BUG_ITEM;
    const item = buggy ? { ...placed.item, properties: [BUGGY.stack] } : placed.item;
    return {
      planted: affectedBy(cell, placed) ?? (buggy ? "stack" : undefined),
      icon: item.icon,
      glyph: item.gameIcon,
      rarity: item.rarity,
      stack: item.stack,
      description: [displayItemText(item, l), note, hint].filter(Boolean).join(". "),
      tooltip: <DisplayItemCard item={item} note={note} hint={idol || cube || quickToCube ? hint : undefined} />,
      copyText: () => displayItemClipboard(item, l),
    };
  };

  return { ghost, nameOf, where, activate, onClick, cellHandlers, slotProps };
}
