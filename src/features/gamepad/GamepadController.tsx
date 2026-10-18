import { useEffect, useRef, useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import { useToast } from "../../components/Toasts";
import { useTopLayer } from "../../components/useTopLayer";
import { track } from "../../game/events";
import { padName, readPad, type PadAction, type PadMemory } from "../../game/input/gamepad";
import { nearestInDirection, type Direction } from "../../game/input/spatial";
import { useI18n } from "../../i18n/I18nProvider";
import "./GamepadController.css";

const ARROWS: Record<Direction, string> = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
const SKILL_KEYS: Partial<Record<PadAction, string>> = {
  skill1: "q",
  skill2: "w",
  skill3: "e",
  skill4: "r",
  skill5: "t",
};
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Sends a synthetic key press to `target`; returns true when a handler took it (preventDefault). */
function press(target: EventTarget, key: string): boolean {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

/** The innermost open dialog is the only interactive part of the page while it is open. */
function scope(): ParentNode {
  const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
  return dialogs[dialogs.length - 1] ?? document;
}

function focusables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest("[inert], [hidden], [aria-hidden='true'], .gamepad-hints"),
  );
}

function current(root: ParentNode): HTMLElement | null {
  const el = document.activeElement;
  return el instanceof HTMLElement && el !== document.body && root.contains(el) ? el : null;
}

function focus(el: HTMLElement) {
  el.focus();
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

/** Moves focus like a D-pad: the element's own arrow-key handling first, spatial navigation otherwise. */
function move(dir: Direction) {
  const root = scope();
  const from = current(root);
  // Widgets with their own arrow keys (tree nodes, tabs, the inventory grid) handle the press.
  if (from && press(from, ARROWS[dir])) return;
  const candidates = focusables(root).filter((el) => el !== from);
  if (!from) {
    if (candidates[0]) focus(candidates[0]);
    return;
  }
  const next = nearestInDirection(
    from.getBoundingClientRect(),
    candidates.map((item) => ({ item, box: item.getBoundingClientRect() })),
    dir,
  );
  if (next) focus(next);
}

function confirm() {
  const root = scope();
  const el = current(root);
  if (!el) {
    const first = focusables(root)[0];
    if (first) focus(first);
    return;
  }
  // Enter first (tree nodes, grid cells and summaries handle it); a plain button gets a click.
  if (press(el, "Enter")) return;
  el.click();
}

/** B / Circle: Esc for whatever handles it (a held orb, inspect mode), else close the top dialog. */
function back() {
  const target = document.activeElement ?? document.body;
  if (press(target, "Escape")) return;
  const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
  const top = dialogs[dialogs.length - 1];
  if (!top) return;
  const cancel = new Event("cancel", { cancelable: true });
  if (top.dispatchEvent(cancel)) top.close();
}

function scrollBy(x: number, y: number) {
  let el: HTMLElement | null = current(scope());
  while (el) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY + style.overflowX) && el.scrollHeight > el.clientHeight) break;
    el = el.parentElement;
  }
  (el ?? document.scrollingElement ?? document.documentElement).scrollBy(x, y);
}

/**
 * Controller support through the Gamepad API: D-pad / left stick move focus, A selects, B goes
 * back, X Y LB RB RT cast the Q W E R T skills, the right stick scrolls, View toggles the FPS
 * overlay and Menu jumps to the features. Connecting and disconnecting are announced.
 */
export function GamepadController() {
  const { t } = useI18n();
  const notify = useToast();
  const { perfOverlay, setPerfOverlay } = useSettings();
  const [pad, setPad] = useState<string | null>(null);
  const perf = useRef(perfOverlay);
  perf.current = perfOverlay;

  useEffect(() => {
    const onConnect = (e: Event) => {
      const id = (e as GamepadEvent).gamepad?.id ?? "";
      setPad(padName(id));
      notify(t("pad.connected", { name: padName(id) }), "success");
      track({ type: "gamepad.connected" });
    };
    const onDisconnect = () => {
      // Another pad may still be plugged in.
      const left = navigator.getGamepads?.().find((g) => g?.connected);
      setPad(left ? padName(left.id) : null);
      notify(t("pad.disconnected"), "error");
    };
    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);
    return () => {
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, [notify, t]);

  // Poll only while a controller is connected: the Gamepad API has no button events.
  useEffect(() => {
    if (!pad) return;
    let memory: PadMemory = {};
    let raf = 0;
    const root = document.documentElement;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const gp = navigator.getGamepads?.().find((g) => g?.connected);
      if (!gp) return;
      const frame = readPad({ buttons: gp.buttons.map((b) => b.pressed), axes: [...gp.axes] }, memory, now);
      memory = frame.memory;
      if (frame.scroll.x || frame.scroll.y) scrollBy(frame.scroll.x, frame.scroll.y);
      if (!frame.actions.length) return;
      root.dataset.input = "gamepad";
      for (const action of frame.actions) {
        if (action === "up" || action === "down" || action === "left" || action === "right") move(action);
        else if (action === "confirm") confirm();
        else if (action === "back") back();
        else if (action === "overlay") setPerfOverlay(!perf.current);
        else if (action === "menu") {
          if (!document.querySelector("dialog[open]"))
            document.querySelector<HTMLElement>("[data-testid=open-tree]")?.focus();
        } else {
          const key = SKILL_KEYS[action];
          if (key) press(window, key);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    // Back to mouse or keyboard: drop the controller focus style.
    const onOtherInput = (e: Event) => {
      if (e.isTrusted) delete root.dataset.input;
    };
    window.addEventListener("pointerdown", onOtherInput, true);
    window.addEventListener("keydown", onOtherInput, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onOtherInput, true);
      window.removeEventListener("keydown", onOtherInput, true);
      delete root.dataset.input;
    };
  }, [pad, setPerfOverlay]);

  return pad ? <GamepadHints name={pad} /> : null;
}

/** Button prompts for the connected controller, shown while it is plugged in. */
function GamepadHints({ name }: { name: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useTopLayer(ref);
  const hints: [string, string][] = [
    ["A", t("pad.select")],
    ["B", t("pad.back")],
    ["✚", t("pad.move")],
    ["X Y LB RB RT", t("pad.skills")],
    ["R", t("pad.scroll")],
    ["☰", t("pad.menu")],
    ["⧉", "FPS"],
  ];
  return (
    <div
      ref={ref}
      popover="manual"
      className="gamepad-hints"
      data-testid="gamepad-hints"
      role="region"
      aria-label={t("pad.hints")}
    >
      <p className="gamepad-hints__name">{name}</p>
      <ul>
        {hints.map(([button, label]) => (
          <li key={button}>
            <kbd>{button}</kbd>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
