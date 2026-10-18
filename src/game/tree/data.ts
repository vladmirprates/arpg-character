import type { L } from "../../i18n/types";
import { RING_STATS, SOFT_SKILLS, START } from "./content";
import { buildTree } from "./layout";
import { treeLayout } from "./layouts/themed";

export type Region =
  "core" | "north" | "south" | "east" | "west" | "northeast" | "southeast" | "southwest" | "northwest";
/** PoE kinds plus masteries: the large node at the heart of a cluster, naming its discipline. */
export type NodeKind = "start" | "minor" | "notable" | "mastery" | "keystone";

export interface TreeNode {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
  region: Region;
  /** game-icons.net icon name (see icons.generated.ts). */
  icon: string;
  name: L;
  /** Stat lines, PoE-style. */
  stats: L[];
}

export interface TreeLink {
  from: string;
  to: string;
  /** Present when the link follows an orbit: drawn as an arc around (cx, cy). */
  arc?: { cx: number; cy: number; r: number };
}

export const ROOT_ID = "start";
export const CENTER = { x: 0, y: 0 } as const;

// Content (content.ts) + geometry (layouts/themed.ts) → nodes and links.
const tree = buildTree({
  start: START,
  startIcon: START.icon,
  ringIcon: "rune-stone",
  ringStats: RING_STATS,
  ringNotables: SOFT_SKILLS,
  regions: treeLayout(),
  toNode: (def) => ({ icon: def.icon, name: def.name, stats: [def.desc] }),
});

export const NODES: readonly TreeNode[] = tree.nodes;
export const LINKS: readonly TreeLink[] = tree.links;
export const REGION_LABELS = tree.labels;
/** World-space bounds of the whole tree including labels. */
export const WORLD = tree.bounds;
