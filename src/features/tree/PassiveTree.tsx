import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { copyToClipboard } from "../../components/copyTarget";
import { useToast } from "../../components/Toasts";
import { decodeBuild, encodeBuild, publishedBuild } from "../../game/tree/build";
import {
  CENTER,
  LINKS,
  NODES,
  REGION_LABELS,
  ROOT_ID,
  WORLD,
  type Region,
  type TreeLink,
  type TreeNode,
} from "../../game/tree/data";
import { pathTo, pointsSpent, refundPreview, toggle } from "../../game/tree/graph";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useI18n } from "../../i18n/I18nProvider";
import { RuneSigil } from "../equipment/RuneSigil";
import { BuildSummary } from "./BuildSummary";
import { RegionBackdrop } from "./RegionBackdrop";
import { TreeDefs, TreeNodeView } from "./TreeNodeView";
import { usePanZoom } from "./usePanZoom";
import "./PassiveTree.css";

export type TreeTab = "mine" | "yours";

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
const EMPTY = new Set<string>();
const ROOT_CODE = encodeBuild(new Set([ROOT_ID]));
const isCode = (v: unknown): v is string => typeof v === "string" && decodeBuild(v) !== null;
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";

/** SVG path for a link: an arc when it follows an orbit, otherwise a straight line. */
function linkPath({ from, to, arc }: TreeLink): string {
  const a = NODE_BY_ID.get(from)!;
  const b = NODE_BY_ID.get(to)!;
  if (!arc) return `M${a.x} ${a.y}L${b.x} ${b.y}`;
  // Sweep along the shorter way round the orbit centre.
  const cross = (a.x - arc.cx) * (b.y - arc.cy) - (a.y - arc.cy) * (b.x - arc.cx);
  return `M${a.x} ${a.y}A${arc.r} ${arc.r} 0 0 ${cross > 0 ? 1 : 0} ${b.x} ${b.y}`;
}

const linkRegion = ({ from, to }: TreeLink) => {
  const a = NODE_BY_ID.get(from)!;
  return a.region === "core" ? NODE_BY_ID.get(to)!.region : a.region;
};

interface Props {
  tab: TreeTab;
  onTabChange: (tab: TreeTab) => void;
  /** A build code from a share link, applied once to the "yours" tab. */
  sharedCode?: string | null;
}

export function PassiveTree({ tab, onTabChange, sharedCode }: Props) {
  const { t, locale } = useI18n();
  const notify = useToast();
  // The key changed when the tree was redesigned, so old saved builds (a different node order) don't load.
  const [yoursCode, setYoursCode] = usePersistentState("treeBuild", ROOT_CODE, isCode);
  // The coloured region glows behind the tree, switchable from the toolbar.
  const [nebula, setNebula] = usePersistentState("treeNebula", true, isBoolean);

  // Emblems centre on the real rendered titles (whose width depends on font and language).
  const titleEls = useRef(new Map<string, SVGTextElement>());
  // On phones the summary is a bottom sheet over the tree, closed until asked for.
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [titleCentres, setTitleCentres] = useState<Partial<Record<Region, number>>>({});
  useLayoutEffect(() => {
    const centres: Partial<Record<Region, number>> = {};
    for (const [region, el] of titleEls.current) {
      const box = el.getBBox?.();
      if (box?.width) centres[region as Region] = box.x + box.width / 2;
    }
    setTitleCentres(centres);
    // Fonts load after first paint: measure again once they're ready.
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      const again: Partial<Record<Region, number>> = {};
      for (const [region, el] of titleEls.current) {
        const box = el.getBBox?.();
        if (box?.width) again[region as Region] = box.x + box.width / 2;
      }
      setTitleCentres(again);
    });
    return () => {
      alive = false;
    };
  }, [locale]);
  const mine = useMemo(publishedBuild, []);
  const yours = useMemo(() => decodeBuild(yoursCode) ?? new Set([ROOT_ID]), [yoursCode]);
  const allocated = tab === "mine" ? mine : yours;
  const readOnly = tab === "mine";

  useEffect(() => {
    if (sharedCode && decodeBuild(sharedCode)) {
      setYoursCode(sharedCode);
      notify(t("tree.loadedShared"), "success");
    }
    // Deliberately keyed on the code alone: apply each shared build once, when it arrives.
  }, [sharedCode]);

  const [hovered, setHovered] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string>(ROOT_ID);
  const nodeRefs = useRef(new Map<string, SVGGElement>());

  // ---- Geometry: world units → content pixels (at zoom 1 the whole tree fits the viewport) ----
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth || 1200, h: el.clientHeight || 800 });
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const scale = Math.min(size.w / WORLD.w, size.h / WORLD.h);
  const toPx = useCallback(
    (x: number, y: number) => ({
      x: (size.w - WORLD.w * scale) / 2 + (x - WORLD.x) * scale,
      y: (size.h - WORLD.h * scale) / 2 + (y - WORLD.y) * scale,
    }),
    [size, scale],
  );

  const stage = useRef<HTMLDivElement>(null);
  const { zoomAt, centerOn, ensureVisible, didDrag } = usePanZoom(viewport, stage, { min: 0.8, max: 10 });
  const recenter = useCallback(() => {
    const c = toPx(CENTER.x, CENTER.y);
    // Start close to the class start, like the game does; phones zoom in further for tappable nodes.
    centerOn(c.x, c.y, size.w < 640 ? 4.5 : 3);
  }, [toPx, centerOn, size.w]);
  // Re-fit whenever the viewport size changes.
  useLayoutEffect(recenter, [recenter]);

  // ---- Hover preview: what a click would allocate or refund ----
  const preview = useMemo(() => {
    if (!hovered || readOnly) return { add: EMPTY, remove: EMPTY };
    return allocated.has(hovered)
      ? { add: EMPTY, remove: new Set(refundPreview(hovered, allocated)) }
      : { add: new Set(pathTo(hovered, allocated)), remove: EMPTY };
  }, [hovered, allocated, readOnly]);

  // Stable callbacks (read the latest state through a ref) so memoized nodes don't re-render.
  const latest = useRef({ allocated, readOnly });
  latest.current = { allocated, readOnly };
  const onActivate = useCallback(
    (id: string) => {
      const { allocated: current, readOnly: ro } = latest.current;
      if (ro || id === ROOT_ID || didDrag()) return;
      setYoursCode(encodeBuild(toggle(id, current)));
    },
    [didDrag, setYoursCode],
  );
  const registerRef = useCallback((id: string, el: SVGGElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  // ---- Keyboard: arrows move spatially between nodes; +/-/0 control the camera ----
  const moveFocus = (dx: number, dy: number) => {
    const from = NODE_BY_ID.get(focusId)!;
    let best: TreeNode | null = null;
    let bestScore = Infinity;
    for (const n of NODES) {
      if (n.id === from.id) continue;
      const vx = n.x - from.x;
      const vy = n.y - from.y;
      const along = vx * dx + vy * dy;
      if (along <= 0) continue;
      const across = Math.abs(vx * dy - vy * dx);
      if (across > along * 1.5) continue; // stay within a ~56° cone
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = n;
      }
    }
    if (best) {
      setFocusId(best.id);
      nodeRefs.current.get(best.id)?.focus();
      const p = toPx(best.x, best.y);
      ensureVisible(p.x, p.y);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const dirs: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const dir = dirs[e.key];
    if (dir && (e.target as Element).closest?.(".tree-node")) {
      e.preventDefault();
      moveFocus(dir[0], dir[1]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomAt(1.25);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomAt(0.8);
    } else if (e.key === "0") {
      e.preventDefault();
      recenter();
    }
  };

  // Summary entries jump to their node: centre it, zoomed in, and focus it so its tooltip opens.
  const locate = useCallback(
    (id: string) => {
      const n = NODE_BY_ID.get(id);
      if (!n) return;
      const p = toPx(n.x, n.y);
      centerOn(p.x, p.y, size.w < 640 ? 4.5 : 3.5);
      setFocusId(id);
      setSummaryOpen(false);
      requestAnimationFrame(() => nodeRefs.current.get(id)?.focus({ preventScroll: true }));
    },
    [toPx, centerOn, size.w],
  );

  const copy = async (text: string) => {
    if (await copyToClipboard(text)) notify(t("tree.copied"), "success");
  };
  const shareUrl = () => `${location.origin}${location.pathname}#tree=${yoursCode}`;

  const sigilCentre = toPx(CENTER.x, CENTER.y);
  const sigilSize = 1500 * scale;

  return (
    <div className={`tree ${summaryOpen ? "tree--summary-open" : ""}`} onKeyDown={onKeyDown}>
      <div className="tree__toolbar">
        <div role="tablist" aria-label={t("tree.title")} className="tabs">
          {(["mine", "yours"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tree-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="tree-panel"
              tabIndex={tab === id ? 0 : -1}
              className="tab"
              onClick={() => onTabChange(id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  const next = id === "mine" ? "yours" : "mine";
                  onTabChange(next);
                  document.getElementById(`tree-tab-${next}`)?.focus();
                }
              }}
            >
              {t(id === "mine" ? "tree.tab.mine" : "tree.tab.yours")}
            </button>
          ))}
        </div>

        <p className="tree__points" aria-live="polite">
          {t("tree.points")}: <strong data-testid="points">{pointsSpent(allocated)}</strong>
        </p>

        <div className="tree__actions">
          {!readOnly && (
            <>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setYoursCode(ROOT_CODE)}>
                {t("tree.reset")}
              </button>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => copy(shareUrl())}>
                {t("tree.share")}
              </button>
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => copy(yoursCode)}>
                {t("tree.export")}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            aria-pressed={nebula}
            onClick={() => setNebula(!nebula)}
            data-testid="toggle-nebula"
          >
            {t("tree.nebula")}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost tree__summary-toggle"
            aria-expanded={summaryOpen}
            aria-controls="build-summary"
            onClick={() => setSummaryOpen(!summaryOpen)}
            data-testid="toggle-summary"
          >
            {t("summary.title")}
          </button>
          <div className="tree__zoom" role="group" aria-label={t("tree.zoom")}>
            <button type="button" className="icon-btn" onClick={() => zoomAt(0.8)} aria-label={t("tree.zoomOut")}>
              −
            </button>
            <button type="button" className="icon-btn" onClick={recenter} aria-label={t("tree.recenter")}>
              ⌖
            </button>
            <button type="button" className="icon-btn" onClick={() => zoomAt(1.25)} aria-label={t("tree.zoomIn")}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="tree__body">
        <div
          id="tree-panel"
          role="tabpanel"
          aria-labelledby={`tree-tab-${tab}`}
          className={`tree__viewport ${readOnly ? "is-readonly" : ""}`}
          ref={viewport}
        >
          <div className="tree__stage" ref={stage}>
            <div
              className="tree__sigil-wrap"
              style={{
                left: sigilCentre.x - sigilSize / 2,
                top: sigilCentre.y - sigilSize / 2,
                width: sigilSize,
                height: sigilSize,
              }}
            >
              <RuneSigil className="tree__sigil" />
            </div>
            <svg
              className="tree__svg"
              width={size.w}
              height={size.h}
              viewBox={`${WORLD.x} ${WORLD.y} ${WORLD.w} ${WORLD.h}`}
              role="group"
              aria-label={t("tree.title")}
            >
              <TreeDefs />
              <RegionBackdrop nebula={nebula} titleCentres={titleCentres} />
              {REGION_LABELS.map((r) => (
                <RegionLabel
                  key={r.region}
                  region={r.region}
                  x={r.x}
                  y={r.y}
                  text={r.text}
                  anchor={r.anchor}
                  textRef={(el) => {
                    if (el) titleEls.current.set(r.region, el);
                  }}
                />
              ))}
              <g className="tree__links" aria-hidden="true">
                {LINKS.map((link) => {
                  const { from, to } = link;
                  const on = allocated.has(from) && allocated.has(to);
                  const adding =
                    !on && (preview.add.has(from) || allocated.has(from)) && (preview.add.has(to) || allocated.has(to));
                  const removing = on && (preview.remove.has(from) || preview.remove.has(to));
                  return (
                    <path
                      key={`${from}-${to}`}
                      d={linkPath(link)}
                      className={`link link--${linkRegion(link)} ${on ? "is-on" : ""} ${adding ? "is-adding" : ""} ${removing ? "is-removing" : ""}`}
                    />
                  );
                })}
              </g>
              <g className="tree__nodes">
                {NODES.map((n) => (
                  <TreeNodeView
                    key={n.id}
                    node={n}
                    allocated={allocated.has(n.id)}
                    readOnly={readOnly}
                    previewAdd={preview.add.has(n.id)}
                    previewRemove={preview.remove.has(n.id)}
                    cost={hovered === n.id ? (allocated.has(n.id) ? -preview.remove.size : preview.add.size) : 0}
                    focusable={focusId === n.id}
                    registerRef={registerRef}
                    onHover={setHovered}
                    onFocusNode={setFocusId}
                    onActivate={onActivate}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
        <BuildSummary allocated={allocated} onLocate={locate} />
      </div>

      <p className="tree__hint">
        <span className="tree__hint-text">
          {readOnly ? t("tree.readonly") : `${t("tree.hintMouse")} — ${t("tree.hintKeys")}`}
        </span>
        <span className="tree__credit">
          {t("tree.iconCredit")}{" "}
          <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer">
            game-icons.net
          </a>{" "}
          (CC BY 3.0)
        </span>
      </p>
    </div>
  );
}

function RegionLabel({
  region,
  x,
  y,
  text,
  anchor,
  textRef,
}: {
  region: string;
  x: number;
  y: number;
  text: { en: string; pt: string };
  anchor: "start" | "middle" | "end";
  textRef: (el: SVGTextElement | null) => void;
}) {
  const { l } = useI18n();
  return (
    <text
      ref={textRef}
      className={`region-label region-label--${region}`}
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      aria-hidden="true"
    >
      {l(text)}
    </text>
  );
}
