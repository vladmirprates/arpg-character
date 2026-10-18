import { memo } from "react";
import { useTooltip } from "../../components/Tooltip";
import type { NodeKind, TreeNode } from "../../game/tree/data";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";

/** Visual radius per kind, in world units. Mirrored by the layout overlap test. */
export const NODE_RADIUS: Record<NodeKind, number> = {
  start: 46,
  minor: 14,
  notable: 24,
  mastery: 30,
  keystone: 38,
};

/** Icon half-size inside the frame. */
const ICON_HALF: Record<NodeKind, number> = { start: 26, minor: 8, notable: 14, mastery: 19, keystone: 22 };

/** Shared SVG definitions (gradients) for every node frame. */
export function TreeDefs() {
  return (
    <defs>
      <linearGradient id="frame-bronze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a6b3e" />
        <stop offset="50%" stopColor="#4f3a20" />
        <stop offset="100%" stopColor="#7a5c33" />
      </linearGradient>
      <linearGradient id="frame-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff0bf" />
        <stop offset="45%" stopColor="#d9a441" />
        <stop offset="100%" stopColor="#8a5a17" />
      </linearGradient>
      <radialGradient id="node-core">
        <stop offset="0%" stopColor="#2a2326" />
        <stop offset="100%" stopColor="#0b090a" />
      </radialGradient>
    </defs>
  );
}

/** Ornamental studs around keystone/start frames. */
function Studs({ count, r, size }: { count: number; r: number; size: number }) {
  return (
    <g className="tree-node__studs">
      {Array.from({ length: count }, (_, i) => {
        const a = (360 / count) * i;
        return (
          <rect
            key={i}
            x={-size / 2}
            y={-r - size / 2}
            width={size}
            height={size}
            transform={`rotate(${a}) rotate(45 0 ${-r})`}
          />
        );
      })}
    </g>
  );
}

interface Props {
  node: TreeNode;
  allocated: boolean;
  readOnly: boolean;
  previewAdd: boolean;
  previewRemove: boolean;
  /** Points a click would cost (+) or refund (−) — only set while hovered. */
  cost: number;
  focusable: boolean;
  registerRef: (id: string, el: SVGGElement | null) => void;
  onHover: (id: string | null) => void;
  onFocusNode: (id: string) => void;
  onActivate: (id: string) => void;
}

export const TreeNodeView = memo(function TreeNodeView({
  node,
  allocated,
  readOnly,
  previewAdd,
  previewRemove,
  cost,
  focusable,
  registerRef,
  onHover,
  onFocusNode,
  onActivate,
}: Props) {
  const { t, l } = useI18n();
  const kindLabel =
    node.kind === "keystone"
      ? t("tree.keystone")
      : node.kind === "mastery"
        ? t("tree.mastery")
        : node.kind === "notable"
          ? t("tree.notable")
          : null;
  const card = (
    <div className={`node-tip node-tip--${node.region} node-tip--${node.kind}`}>
      <strong>{l(node.name)}</strong>
      {kindLabel && <span className="node-tip__kind">{kindLabel}</span>}
      <div className="node-tip__stats">
        {node.stats.map((s, i) => (
          <p key={i}>{l(s)}</p>
        ))}
      </div>
      <span className={`node-tip__status ${allocated ? "is-on" : ""}`}>
        {allocated ? t("tree.allocated") : t("tree.unallocated")}
      </span>
      {cost > 0 && <span className="node-tip__cost">{t("tree.costs", { n: cost })}</span>}
      {cost < 0 && <span className="node-tip__cost is-refund">{t("tree.refunds", { n: -cost })}</span>}
    </div>
  );
  const tip = useTooltip<SVGGElement & HTMLElement>(card, "top");
  const r = NODE_RADIUS[node.kind];
  const s = ICON_HALF[node.kind];

  return (
    <g
      ref={(el) => {
        (tip.ref as { current: unknown }).current = el;
        registerRef(node.id, el);
      }}
      className={`tree-node tree-node--${node.kind} tree-node--${node.region} ${allocated ? "is-on" : ""} ${previewAdd ? "is-adding" : ""} ${previewRemove ? "is-removing" : ""}`}
      transform={`translate(${node.x} ${node.y})`}
      role="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={`${l(node.name)}. ${node.stats.map(l).join(". ")}`}
      aria-pressed={allocated}
      aria-disabled={readOnly || node.kind === "start" ? true : undefined}
      data-testid={`node-${node.id}`}
      data-allocated={allocated}
      onPointerEnter={(e) => {
        tip.onPointerEnter(e);
        onHover(node.id);
      }}
      onPointerLeave={() => {
        tip.onPointerLeave();
        onHover(null);
      }}
      onFocus={() => {
        tip.onFocus();
        onFocusNode(node.id);
        onHover(node.id);
      }}
      onBlur={() => {
        tip.onBlur();
        onHover(null);
      }}
      onClick={() => onActivate(node.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(node.id);
        }
      }}
    >
      {/* Larger invisible hit area so small nodes are easy to click and tap. */}
      <circle className="tree-node__hit" r={Math.max(r + 6, 22)} />
      <circle className="tree-node__halo" r={r + 7} />
      {node.kind === "keystone" && <Studs count={8} r={r + 7} size={7} />}
      {node.kind === "start" && <Studs count={12} r={r + 8} size={8} />}
      {/* Masteries: a plain medallion inside a dotted orbit, like PoE's cluster centres. */}
      {node.kind === "mastery" && <circle className="tree-node__orbit" r={r + 7} />}
      <circle className="tree-node__core" r={r} />
      <circle className="tree-node__tint" r={r} />
      <svg
        className="tree-node__icon"
        x={-s}
        y={-s}
        width={s * 2}
        height={s * 2}
        viewBox={iconViewBox(node.icon)}
        aria-hidden="true"
      >
        {TREE_ICONS[node.icon]?.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
      <circle className="tree-node__frame" r={r} />
      {(node.kind === "notable" || node.kind === "keystone" || node.kind === "start") && (
        <circle className="tree-node__inner" r={r - (node.kind === "notable" ? 5 : 7)} />
      )}
    </g>
  );
});
