import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

export type Placement = "top" | "bottom" | "left" | "right";

interface Open {
  anchor: HTMLElement;
  content: ReactNode;
  placement: Placement;
}

interface Actions {
  show: (anchor: HTMLElement, content: ReactNode, placement: Placement) => void;
  hide: (anchor: HTMLElement | null) => void;
  /** Refresh content if `anchor` is the open one (e.g. after a language switch). */
  refresh: (anchor: HTMLElement, content: ReactNode) => void;
}

const TooltipContext = createContext<Actions | null>(null);

const GAP = 10;
const MARGIN = 8;
const FALLBACKS: Record<Placement, Placement[]> = {
  top: ["top", "bottom", "right", "left"],
  bottom: ["bottom", "top", "right", "left"],
  left: ["left", "right", "top", "bottom"],
  right: ["right", "left", "top", "bottom"],
};

function place(anchor: DOMRect, tip: DOMRect, placement: Placement) {
  switch (placement) {
    case "top":
      return { x: anchor.left + anchor.width / 2 - tip.width / 2, y: anchor.top - tip.height - GAP };
    case "bottom":
      return { x: anchor.left + anchor.width / 2 - tip.width / 2, y: anchor.bottom + GAP };
    case "left":
      return { x: anchor.left - tip.width - GAP, y: anchor.top + anchor.height / 2 - tip.height / 2 };
    case "right":
      return { x: anchor.right + GAP, y: anchor.top + anchor.height / 2 - tip.height / 2 };
  }
}

/** First placement that fits the viewport (else the preferred one), clamped on-screen. */
export function computePosition(anchor: DOMRect, tip: DOMRect, preferred: Placement, vw: number, vh: number) {
  const fits = (p: { x: number; y: number }) =>
    p.x >= MARGIN && p.y >= MARGIN && p.x + tip.width <= vw - MARGIN && p.y + tip.height <= vh - MARGIN;
  const choice = FALLBACKS[preferred].find((pl) => fits(place(anchor, tip, pl))) ?? preferred;
  const pos = place(anchor, tip, choice);
  return {
    placement: choice,
    // If the tooltip is bigger than the viewport, pin it to the top-left margin rather than off-screen.
    x: Math.round(Math.max(MARGIN, Math.min(pos.x, vw - tip.width - MARGIN))),
    y: Math.round(Math.max(MARGIN, Math.min(pos.y, vh - tip.height - MARGIN))),
  };
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<Open | null>(null);
  openRef.current = open;

  const actions = useMemo<Actions>(
    () => ({
      show: (anchor, content, placement) => setOpen({ anchor, content, placement }),
      hide: (anchor) => setOpen((cur) => (cur && (anchor === null || cur.anchor === anchor) ? null : cur)),
      refresh: (anchor, content) => setOpen((cur) => (cur?.anchor === anchor ? { ...cur, content } : cur)),
    }),
    [],
  );

  const position = useCallback(() => {
    const cur = openRef.current;
    const tip = tipRef.current;
    if (!cur || !tip) return;
    if (!cur.anchor.isConnected) return setOpen(null);
    const { x, y, placement } = computePosition(
      cur.anchor.getBoundingClientRect(),
      tip.getBoundingClientRect(),
      cur.placement,
      window.innerWidth,
      window.innerHeight,
    );
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.dataset.placement = placement;
    tip.dataset.ready = "true";
  }, []);

  useLayoutEffect(position, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    // Touch: tapping anywhere outside the anchor dismisses.
    const onPointerDown = (e: PointerEvent) => {
      if (!openRef.current?.anchor.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, position]);

  return (
    <TooltipContext.Provider value={actions}>
      {children}
      {open &&
        createPortal(
          // Visual only: anchors expose the same text to assistive tech via aria-describedby.
          <div ref={tipRef} className="tooltip-layer" aria-hidden="true">
            {open.content}
          </div>,
          // A modal <dialog> lives in the browser's top layer, above any z-index — so tooltips
          // for anchors inside one must render inside it to be visible.
          open.anchor.closest("dialog[open]") ?? document.body,
        )}
    </TooltipContext.Provider>
  );
}

/** Props to spread on an element so it shows `content` on hover, focus or tap. */
export function useTooltip<T extends HTMLElement>(content: ReactNode, placement: Placement = "right") {
  const actions = useContext(TooltipContext);
  if (!actions) throw new Error("useTooltip must be used inside <TooltipProvider>");
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) actions.refresh(ref.current, content);
  });

  useEffect(() => {
    const el = ref.current;
    return () => actions.hide(el);
  }, [actions]);

  const show = () => ref.current && actions.show(ref.current, content, placement);
  const hide = () => actions.hide(ref.current);

  return {
    ref,
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType !== "touch") show();
    },
    onPointerLeave: hide,
    onFocus: show,
    onBlur: hide,
  };
}
