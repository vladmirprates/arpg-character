import { useCallback, useEffect, useRef, type RefObject } from "react";

export interface View {
  x: number;
  y: number;
  k: number;
}

/**
 * Pan/zoom for a viewport: mouse drag, wheel-zoom at cursor, two-finger pinch.
 *
 * Performance: the transform is written straight to `stage.style` — React never re-renders
 * while panning. `will-change` is only set during interaction, so the GPU layer is cheap to
 * move while dragging and the tree re-rasterizes crisply once you stop.
 */
export function usePanZoom(
  viewport: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLElement | null>,
  { min = 0.6, max = 4 }: { min?: number; max?: number } = {},
) {
  const clampK = useCallback((k: number) => Math.min(max, Math.max(min, k)), [min, max]);
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);
  const start = useRef<{ x: number; y: number; dist: number; view: View } | null>(null);
  const settle = useRef(0);

  const apply = useCallback(
    (next: View) => {
      view.current = next;
      const el = stage.current;
      if (!el) return;
      el.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.k})`;
      el.style.willChange = "transform";
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        if (stage.current) stage.current.style.willChange = "auto";
      }, 200);
    },
    [stage],
  );

  const size = useCallback(
    () => viewport.current?.getBoundingClientRect() ?? { width: 0, height: 0, left: 0, top: 0 },
    [viewport],
  );

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const rect = size();
      const px = cx ?? rect.width / 2;
      const py = cy ?? rect.height / 2;
      const v = view.current;
      const k = clampK(v.k * factor);
      const r = k / v.k;
      apply({ k, x: px - (px - v.x) * r, y: py - (py - v.y) * r });
    },
    [apply, size, clampK],
  );

  /** Pans so a point in content pixels (at k=1) is centred. */
  const centerOn = useCallback(
    (px: number, py: number, k?: number) => {
      const rect = size();
      const nk = clampK(k ?? view.current.k);
      apply({ k: nk, x: rect.width / 2 - px * nk, y: rect.height / 2 - py * nk });
    },
    [apply, size, clampK],
  );

  /** Pans just enough to bring a point (content px at k=1) inside the viewport. */
  const ensureVisible = useCallback(
    (px: number, py: number, margin = 80) => {
      const { width, height } = size();
      const v = view.current;
      const sx = v.x + px * v.k;
      const sy = v.y + py * v.k;
      const dx = sx < margin ? margin - sx : sx > width - margin ? width - margin - sx : 0;
      const dy = sy < margin ? margin - sy : sy > height - margin ? height - margin - sy : 0;
      if (dx || dy) apply({ ...v, x: v.x + dx, y: v.y + dy });
    },
    [apply, size, clampK],
  );

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;

    const local = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const centroid = () => {
      const pts = [...pointers.current.values()];
      return {
        pts,
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      };
    };
    const begin = () => {
      const { pts, x, y } = centroid();
      const dist = pts.length > 1 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0;
      start.current = { x, y, dist, view: view.current };
    };

    // Wheel events can fire far faster than frames; coalesce to one zoom per frame.
    let wheelRaf = 0;
    let wheelDelta = 0;
    let wheelAt = { x: 0, y: 0 };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelDelta += e.deltaY;
      wheelAt = local(e);
      if (!wheelRaf) {
        wheelRaf = requestAnimationFrame(() => {
          zoomAt(Math.exp(-wheelDelta * 0.0015), wheelAt.x, wheelAt.y);
          wheelDelta = 0;
          wheelRaf = 0;
        });
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointers.current.set(e.pointerId, local(e));
      dragged.current = false;
      begin();
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId) || !start.current) return;
      pointers.current.set(e.pointerId, local(e));
      const { pts, x, y } = centroid();
      const s = start.current;
      if (!dragged.current && Math.hypot(x - s.x, y - s.y) < 5 && pts.length < 2) return;
      if (!dragged.current) {
        dragged.current = true;
        el.setPointerCapture(e.pointerId);
      }
      let k = s.view.k;
      if (pts.length > 1 && s.dist > 0) {
        k = clampK(s.view.k * (Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) / s.dist));
      }
      const r = k / s.view.k;
      apply({ k, x: x - (s.x - s.view.x) * r, y: y - (s.y - s.view.y) * r });
    };

    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size > 0) begin();
      else start.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(wheelRaf);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [viewport, zoomAt, apply, clampK]);

  return { zoomAt, centerOn, ensureVisible, didDrag: () => dragged.current };
}
