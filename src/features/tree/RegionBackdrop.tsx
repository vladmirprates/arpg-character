import { memo } from "react";
import { NODES, REGION_LABELS, type Region } from "../../game/tree/data";
import { emblemBox } from "../../game/tree/layout";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";

/** Emblems beside the four main regions' titles, like PoE's class art (game-icons.net, bundled by the icon script). */
const EMBLEMS: Record<string, string> = {
  northIcon: "gamepad",
  southIcon: "magnifying-glass",
  eastIcon: "robot-golem",
  westIcon: "chess-queen",
};

/** Where each region sits: the centre of its nodes, and a radius that covers most of them. */
const AREAS = (() => {
  const byRegion = new Map<Region, { x: number; y: number }[]>();
  for (const n of NODES) {
    if (n.region === "core") continue;
    byRegion.set(n.region, [...(byRegion.get(n.region) ?? []), n]);
  }
  return [...byRegion].map(([region, pts]) => {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const r = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)));
    return { region, cx, cy, r };
  });
})();

/**
 * The tree's backdrop: a soft glow in each region's colour, and a large faint emblem by each main
 * region's title — so the areas read at a glance. Static SVG, so panning and zooming cost nothing extra.
 */
export const RegionBackdrop = memo(function RegionBackdrop({
  nebula,
  titleCentres,
}: {
  /** Show the coloured region glows. */
  nebula: boolean;
  /** Each title's measured horizontal centre, so its emblem lines up with the real text. */
  titleCentres: Partial<Record<Region, number>>;
}) {
  return (
    <g className="region-backdrop" aria-hidden="true">
      <defs>
        {AREAS.map(({ region }) => (
          <radialGradient key={region} id={`glow-${region}`}>
            <stop offset="0%" className={`glow-stop glow-stop--${region}`} stopOpacity="0.12" />
            <stop offset="55%" className={`glow-stop glow-stop--${region}`} stopOpacity="0.04" />
            <stop offset="100%" className={`glow-stop glow-stop--${region}`} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {nebula &&
        AREAS.map(({ region, cx, cy, r }) => (
          <circle key={region} className="region-glow" cx={cx} cy={cy} r={r * 1.25} fill={`url(#glow-${region})`} />
        ))}
      {REGION_LABELS.map((label) => {
        const icon = EMBLEMS[`${label.region}Icon`];
        if (!icon) return null;
        const box = emblemBox(label, titleCentres[label.region]);
        return (
          <svg
            key={`emblem-${label.region}`}
            className={`region-emblem region-emblem--${label.region}`}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            viewBox={iconViewBox(icon)}
          >
            {TREE_ICONS[icon]?.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        );
      })}
    </g>
  );
});
