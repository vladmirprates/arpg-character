import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { ORB_BY_ID, type OrbDef, type OrbTier } from "../../data/orbs";
import { playSfx, type SfxName } from "../../audio/sfx";
import { useSettings } from "../../app/SettingsProvider";
import { CraftedItemCard } from "../../components/ItemCard";
import { useToast } from "../../components/Toasts";
import { useTooltip } from "../../components/Tooltip";
import { copyToClipboard, clearCopyTarget, setCopyTarget } from "../../components/copyTarget";
import { describeItem, itemSummary, itemToText } from "../../game/crafting/describe";
import { craftIcon } from "../../game/crafting/icons";
import { POOLS } from "../../game/crafting/pools";
import type { Recipe } from "../../game/crafting/recipe";
import { BASE_TYPES, type BaseType, type OrbId } from "../../game/crafting/types";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useParticles } from "../../fx/useParticles";
import { CORRUPTION_KEYS, CRAFT_ERRORS } from "../../i18n/strings";
import { useI18n } from "../../i18n/I18nProvider";
import { useStash } from "../stash/StashProvider";
import { bugReport, reproUrl } from "./report";
import { useCraftSession } from "./useCraftSession";
import "../../components/ItemSlot.css";
import "./CraftingBench.css";

const TIER_SFX: Record<OrbTier, SfxName> = {
  magic: "orbMagic",
  rare: "orbRare",
  neutral: "orbNeutral",
  corrupt: "corrupt",
};
const RARITY_COLORS: Record<string, string[]> = {
  normal: ["#ffffff", "#d2d0cc"],
  magic: ["#8f93ff", "#c4c6ff", "#ffffff"],
  rare: ["#f4e260", "#fff3a0", "#ffffff"],
  unique: ["#d9823b", "#ffb36b", "#ffe0b0"],
};

/** The currency tab's fixed slots, PoE-style: magic orbs, rare orbs, then the rest. */
const CURRENCY_TAB: OrbId[][] = [
  ["transmute", "augmentation", "alteration"],
  ["regal", "chaos", "exalted"],
  ["annulment", "scouring", "vaal"],
];

interface Props {
  /** Recipe to load when the bench opens (from the stash or a share link). */
  incoming: { recipe: Recipe; shared: boolean } | null;
}

/** Touch-first device (phone, tablet): the hint talks about taps instead of clicks and drags. */
const COARSE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

const baseUrl = () => `${location.origin}${location.pathname}`;

/**
 * Crafting as in PoE: currency sits in a currency tab; pick an orb up (click or right-click),
 * then click the item to use it. Shift keeps the orb on the cursor; Esc puts it back.
 * Dragging an orb onto the item uses it directly; on a touch screen a tap on an orb uses it.
 */
export function CraftingBench({ incoming }: Props) {
  const { t, l, locale } = useI18n();
  const notify = useToast();
  const { reducedMotion } = useSettings();
  const stash = useStash();
  const session = useCraftSession();
  const { item, recipe, log } = session;
  const view = describeItem(item, locale);
  const [shine, setShine] = useState<string[]>([]);
  const [anim, setAnim] = useState<{ kind: "craft" | "error" | "corrupt"; n: number } | null>(null);
  const [held, setHeld] = useState<OrbId | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const { canvasRef, burst } = useParticles(reducedMotion);
  const dropRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (!incoming) return;
    session.load(incoming.recipe);
    if (incoming.shared) notify(t("bench.loadedShared"), "success");
    else notify(t("stash.loaded"));
    // Keyed on the incoming object alone: each recipe is applied exactly once.
  }, [incoming]);

  useEffect(() => {
    const list = logRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [log.length]);

  // A held orb follows the pointer; Esc puts it back instead of closing the bench.
  useEffect(() => {
    if (!held) return;
    const onMove = (e: PointerEvent) => setCursor({ x: e.clientX, y: e.clientY });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setHeld(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [held]);

  const applyOrb = (orbId: OrbId) => {
    const orb = ORB_BY_ID[orbId];
    const outcome = session.apply(orbId);
    const n = (anim?.n ?? 0) + 1;

    if (!outcome.ok) {
      playSfx("error");
      setAnim({ kind: "error", n });
      notify(CRAFT_ERRORS[locale][outcome.error!], "error");
      return;
    }

    setShine(outcome.added);
    if (outcome.corruption) {
      playSfx(outcome.corruption === "brick" ? "brick" : "corrupt");
      setAnim({ kind: "corrupt", n });
      burst({ colors: ["#e0343a", "#ff7a5a", "#5a0a0e"], count: outcome.corruption === "brick" ? 120 : 70, speed: 6 });
      notify(t(CORRUPTION_KEYS[outcome.corruption]), "corrupt");
    } else {
      playSfx(TIER_SFX[orb.tier]);
      setAnim({ kind: "craft", n });
      burst({ colors: RARITY_COLORS[outcome.item.rarity]!, count: orb.tier === "rare" ? 60 : 36, gravity: 1.2 });
    }
  };

  const pickUp = (orbId: OrbId, e: ReactMouseEvent, touch: boolean) => {
    // On a touch screen there's no cursor to carry the orb: a tap uses it on the item straight away.
    if (touch) {
      setHeld(null);
      applyOrb(orbId);
      return;
    }
    if (held === orbId) {
      setHeld(null);
      return;
    }
    setHeld(orbId);
    playSfx("click");
    // A keyboard "click" has no pointer: move focus to the item so Enter uses the orb.
    if (e.type === "click" && e.detail === 0) {
      setCursor(null);
      slotRef.current?.focus();
    } else {
      setCursor({ x: e.clientX, y: e.clientY });
    }
  };

  const useHeld = (e: ReactMouseEvent) => {
    if (!held) return;
    e.stopPropagation();
    applyOrb(held);
    // Shift keeps the orb on the cursor, as in PoE.
    if (!e.shiftKey) setHeld(null);
  };

  // Clicking or right-clicking anywhere else puts the held orb back.
  const putBack = (e: ReactMouseEvent) => {
    if (!held || (e.target as Element).closest(".orb")) return;
    if (e.type === "contextmenu") e.preventDefault();
    setHeld(null);
  };

  const keep = () => {
    if (stash.save(recipe) === -1) {
      playSfx("error");
      notify(t("stash.full"), "error");
      return;
    }
    playSfx("save");
    notify(t("stash.saved"), "success");
    session.reset(recipe.base);
    setShine([]);
  };

  const copy = async (text: string, msg: string) => {
    if (await copyToClipboard(text)) {
      playSfx("click");
      notify(msg, "success");
    }
  };

  const copyItem = () => itemToText(view, view.baseName, locale);
  const heldOrb = held ? ORB_BY_ID[held] : null;
  const rarity = item.corrupted ? "corrupted" : item.rarity;

  return (
    <div className={`bench ${heldOrb && cursor ? "is-holding" : ""}`} onClick={putBack} onContextMenu={putBack}>
      <div className="bench__top">
        <label className="bench__base" htmlFor={baseId}>
          <span>{t("bench.base")}</span>
          <select
            id={baseId}
            value={recipe.base}
            onChange={(e) => {
              session.reset(e.target.value as BaseType);
              setShine([]);
              playSfx("click");
            }}
          >
            {BASE_TYPES.map((b) => (
              <option key={b} value={b}>
                {POOLS[b].baseName[locale]}
              </option>
            ))}
          </select>
        </label>
        <div className="bench__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={keep}>
            {t("bench.keep")}
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => copy(reproUrl(session, baseUrl()), t("tree.copied"))}
          >
            {t("bench.share")}
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => copy(bugReport(session, locale, baseUrl()), t("tree.copied"))}
          >
            {t("bench.copyRepro")}
          </button>
        </div>
      </div>

      <div className="bench__body">
        <section className="currency-tab" aria-labelledby="currency-tab-title">
          <h3 id="currency-tab-title" className="currency-tab__tab">
            {t("bench.orbs")}
          </h3>
          <div className="currency-tab__grid">
            {CURRENCY_TAB.map((row, i) => (
              <ul key={i} className="currency-tab__row">
                {row.map((id) => (
                  <li key={id}>
                    <OrbButton
                      orb={ORB_BY_ID[id]}
                      held={held === id}
                      onPick={(e, touch) => pickUp(id, e, touch)}
                      onDrop={() => applyOrb(id)}
                      dropTarget={dropRef}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
          <p className="bench__hint" aria-live="polite">
            {heldOrb ? t("bench.holding", { name: l(heldOrb.name) }) : t(COARSE ? "bench.tapHint" : "bench.dragHint")}
          </p>
        </section>

        <div
          ref={dropRef}
          className={`bench__item ${held ? "is-target" : ""}`}
          role="region"
          aria-label={itemSummary(view, locale)}
          aria-roledescription="item"
          data-testid="crafted-item"
          data-rarity={item.rarity}
          data-corrupted={item.corrupted}
          onClick={useHeld}
          onPointerEnter={() => setCopyTarget(copyItem)}
          onPointerLeave={() => clearCopyTarget(copyItem)}
        >
          <button
            ref={slotRef}
            type="button"
            className={`slot rarity-${rarity} bench__slot`}
            aria-label={heldOrb ? t("bench.applyHeld", { name: l(heldOrb.name) }) : view.name}
            data-testid="item-slot"
            onFocus={() => setCopyTarget(copyItem)}
            onBlur={() => clearCopyTarget(copyItem)}
          >
            {/* Re-keyed per craft so the flash/shake animation restarts every time. */}
            <svg
              key={anim?.n}
              className={`slot__icon slot__glyph ${anim ? `anim-${anim.kind}` : ""}`}
              viewBox={iconViewBox(craftIcon(item))}
              aria-hidden="true"
            >
              {TREE_ICONS[craftIcon(item)]?.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </button>
          <div key={anim?.n} className={`bench__card ${anim ? `anim-${anim.kind}` : ""}`}>
            <CraftedItemCard view={view} shine={shine} footer={t("item.copyHint")} />
          </div>
          <canvas ref={canvasRef} className="bench__fx" aria-hidden="true" />
        </div>

        <section className="bench__log" aria-labelledby="bench-log-title">
          <h3 id="bench-log-title">
            {t("bench.log")}{" "}
            <span className="bench__seed">
              {t("bench.seed")} 0x{recipe.seed.toString(16)}
            </span>
          </h3>
          {log.length === 0 ? (
            <p className="bench__log-empty">{t("bench.logEmpty")}</p>
          ) : (
            // Focusable so keyboard users can scroll a long log (WCAG 2.1.1).
            <ol ref={logRef} tabIndex={0} aria-labelledby="bench-log-title">
              {log.map((entry, i) => (
                <li key={i} className={entry.error ? "is-fail" : entry.corruption ? "is-corrupt" : "is-ok"}>
                  <span className="bench__log-tag">{entry.error ? t("bench.fail") : t("bench.ok")}</span>
                  <span>{l(ORB_BY_ID[entry.orb].name)}</span>
                  {entry.error && <small>{CRAFT_ERRORS[locale][entry.error]}</small>}
                  {entry.corruption && <small>{t(CORRUPTION_KEYS[entry.corruption])}</small>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {heldOrb && cursor && (
        <img
          src={heldOrb.icon}
          alt=""
          aria-hidden="true"
          className={`orb-ghost orb--${heldOrb.tier}`}
          style={{ left: cursor.x, top: cursor.y }}
        />
      )}
    </div>
  );
}

function OrbButton({
  orb,
  held,
  onPick,
  onDrop,
  dropTarget,
}: {
  orb: OrbDef;
  held: boolean;
  /** Click or right-click: put the orb on the cursor (a touch tap uses it at once). */
  onPick: (e: ReactMouseEvent, touch: boolean) => void;
  /** Dragged and released over the item: use it straight away. */
  onDrop: () => void;
  dropTarget: RefObject<HTMLDivElement | null>;
}) {
  const { l } = useI18n();
  const tip = useTooltip<HTMLButtonElement>(
    <div className={`tip-simple orb-tip orb-tip--${orb.tier}`}>
      <strong>{l(orb.name)}</strong>
      {l(orb.desc)}
    </div>,
    "top",
  );
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const touch = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    touch.current = e.pointerType === "touch";
    if (e.button !== 0) return;
    // Capture immediately: a fast flick can leave the orb before the first move event.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, active: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
      d.active = true;
      tip.onPointerLeave();
    }
    if (d.active) setGhost({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    setGhost(null);
    suppressClick.current = true;
    const target = dropTarget.current?.getBoundingClientRect();
    if (
      target &&
      e.clientX >= target.left &&
      e.clientX <= target.right &&
      e.clientY >= target.top &&
      e.clientY <= target.bottom
    ) {
      onDrop();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`orb orb--${orb.tier} ${held ? "is-held" : ""}`}
        aria-label={`${l(orb.name)}: ${l(orb.desc)}`}
        aria-pressed={held}
        data-testid={`orb-${orb.id}`}
        {...tip}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setGhost(null);
        }}
        onClick={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const tapped = touch.current && e.detail !== 0;
          onPick(e, tapped);
          // The tap already used the orb; its tooltip would only cover the result.
          if (tapped) tip.onPointerLeave();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onPick(e, false);
        }}
      >
        <img src={orb.icon} alt="" draggable={false} />
      </button>
      {ghost && (
        <img
          src={orb.icon}
          alt=""
          aria-hidden="true"
          className={`orb-ghost orb--${orb.tier}`}
          style={{ left: ghost.x, top: ghost.y }}
        />
      )}
    </>
  );
}
