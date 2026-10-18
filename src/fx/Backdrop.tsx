import { memo } from "react";
import { LINKS, NODES } from "../game/tree/data";
import "./Backdrop.css";

const BY_ID = new Map(NODES.map((n) => [n.id, n]));

// Framed on the nodes alone: the tree's WORLD box also holds region titles and emblems, which
// the backdrop doesn't draw and which would shrink the constellation.
const xs = NODES.map((n) => n.x);
const ys = NODES.map((n) => n.y);
const SIZE = Math.max(Math.max(...xs) - Math.min(...xs) + 520, Math.max(...ys) - Math.min(...ys) + 260);
const CX = (Math.min(...xs) + Math.max(...xs)) / 2;
const CY = (Math.min(...ys) + Math.max(...ys)) / 2;
const VIEW_BOX = `${CX - SIZE / 2} ${CY - SIZE / 2} ${SIZE} ${SIZE}`;

/**
 * Page background: drifting fog under a faint constellation of the actual passive tree,
 * turning very slowly. Both are static rasters moved only by `transform`, so the GPU
 * compositor animates them without repainting.
 */
export const Backdrop = memo(function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__fog backdrop__fog--warm" />
      <div className="backdrop__fog backdrop__fog--cold" />
      <svg className="backdrop__stars" viewBox={VIEW_BOX}>
        <g className="backdrop__links">
          {LINKS.map(({ from, to }) => {
            const a = BY_ID.get(from)!;
            const b = BY_ID.get(to)!;
            return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        <g className="backdrop__nodes">
          {NODES.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r={n.kind === "minor" ? 6 : n.kind === "notable" ? 11 : 17} />
          ))}
        </g>
      </svg>
    </div>
  );
});
