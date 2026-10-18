import type { L } from "../../i18n/types";
import type { RegionContent } from "./content";
import type { Region, TreeLink, TreeNode } from "./data";

/**
 * Procedural PoE-style layout. Each region draws its own shape with a small set of primitives
 * (chains, wheels, loops, stars, arc bands); this module turns that into coordinates and links.
 * Nothing is placed node-by-node by hand, and the layout test guarantees no two nodes overlap.
 */

export type Pt = { x: number; y: number };
type Content = { icon: string; name: L; stats: L[] };
type Arc = NonNullable<TreeLink["arc"]>;

/** A region's content plus the geometry a layout gives it. */
export interface RegionSpec<D> extends RegionContent<D> {
  /** Draws the region with the builder's primitives. */
  shape: (b: RegionBuilder) => void;
  /** Gap between the region's outermost node and its title, in world units; omit for no title. */
  labelGap?: number;
}

interface BuildInput<D> {
  start: D;
  startIcon: string;
  ringIcon: string;
  ringStats: L[];
  /** Notables placed on every other inner-ring node (between the region entries). */
  ringNotables: [string, D][];
  regions: RegionSpec<D>[];
  toNode: (def: D) => Content;
}

export const RING_RADIUS = 260;

/** Region titles: font size in world units, and a rough glyph width for sizing their box. */
export const LABEL_SIZE = 200;
const LABEL_CHAR_WIDTH = LABEL_SIZE * 0.92; // caps + 0.2em letter-spacing

export type LabelAnchor = "start" | "middle" | "end";
export interface RegionLabel {
  region: Region;
  text: L;
  x: number;
  y: number;
  anchor: LabelAnchor;
}

/** Approximate box of a title, for bounds and the no-overlap test. */
export function labelBox(label: RegionLabel) {
  const w = Math.max(label.text.en.length, label.text.pt.length) * LABEL_CHAR_WIDTH;
  const x = label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - w : label.x - w / 2;
  return { x, y: label.y - LABEL_SIZE / 2, w, h: LABEL_SIZE };
}

/** Size of a region's emblem, in world units. */
export const EMBLEM_SIZE = 520;

/**
 * Where a region's emblem sits: in the open space beyond its title — above the top and side
 * titles, below the bottom one — so it frames the tree instead of hiding behind the nodes.
 */
export function emblemBox(label: RegionLabel, measuredCentreX?: number) {
  const box = labelBox(label);
  const gap = 70;
  // Centred on the title: its real rendered centre when measured, else the estimated box's.
  const cx = measuredCentreX ?? (label.anchor === "middle" ? label.x : box.x + box.w / 2);
  const below = label.anchor === "middle" && label.y > 0;
  const cy = below ? box.y + box.h + gap + EMBLEM_SIZE / 2 : box.y - gap - EMBLEM_SIZE / 2;
  return { x: cx - EMBLEM_SIZE / 2, y: cy - EMBLEM_SIZE / 2, w: EMBLEM_SIZE, h: EMBLEM_SIZE };
}
export const RING_COUNT = 16;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const polar = (c: Pt, r: number, a: number): Pt => ({
  x: c.x + r * Math.cos(rad(a)),
  y: c.y + r * Math.sin(rad(a)),
});
const angleOf = (from: Pt, to: Pt) => deg(Math.atan2(to.y - from.y, to.x - from.x));
const round = (p: Pt): Pt => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Slot index → notable id, or `true` for the next notable in content order. */
type Slots = Record<number, string | true>;

/** Primitives a region uses to draw itself. */
export interface RegionBuilder {
  /** Local frame: u = distance outward from the inner ring, v = sideways (+ is clockwise). */
  at(u: number, v: number): Pt;
  /** World point at radius r from the tree centre, `da` degrees off the region's axis. */
  radial(r: number, da: number): Pt;
  /** The inner-ring node this region grows from. */
  ringEntry: string;
  minor(stat: string, p: Pt): string;
  /** Next notable in content order, or a specific one by id. */
  notable(p: Pt, id?: string): string;
  /** Next mastery in content order (a cluster's centrepiece). */
  mastery(p: Pt): string;
  keystone(p: Pt): string;
  link(a: string, b: string, arc?: Arc): void;
  pos(id: string): Pt;
  /** `n` minors evenly spaced between node `from` and point `to` (ends excluded), linked in a line. */
  chain(stat: string, from: string, to: Pt, n: number): string[];
  /** Chain ending in a link to an existing node. */
  connect(stat: string, from: string, to: string, n: number): string[];
  /**
   * Arc of `n` nodes round `centre`, from the side facing `entry` the long way towards `exit`.
   * `notables` maps slot index → notable id (or `true` for the next one in order) for slots that
   * hold a notable instead of a minor.
   */
  wheel(
    stat: string,
    centre: Pt,
    r: number,
    entry: string,
    exit: Pt,
    n: number,
    notables?: Slots,
  ): { ids: string[]; angles: number[] };
  /** Closed loop of `n` nodes round `centre`, starting at local angle `a0` (0 = outward). */
  loop(
    stat: string,
    centre: Pt,
    r: number,
    n: number,
    a0: number,
    notables?: Slots,
  ): { ids: string[]; angles: number[] };
  /** Dead-end spokes (one minor each) radiating from `hub` at local angles. */
  star(stat: string, hub: string, len: number, angles: number[]): string[];
  /** Minors along an arc round the tree centre at radius `r`, from local angle a0 to a1. */
  band(stat: string, r: number, a0: number, a1: number, n: number): string[];
  /** Nearest already-built node of another region (for cross-region paths). */
  nearest(region: Region, to: string): string;
}

export function buildTree<D>({ start, startIcon, ringIcon, ringStats, ringNotables, regions, toNode }: BuildInput<D>) {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];
  const byId = new Map<string, TreeNode>();
  const add = (node: Omit<TreeNode, "x" | "y">, p: Pt) => {
    const full = { ...node, ...round(p) };
    nodes.push(full);
    byId.set(full.id, full);
    return full.id;
  };
  const link = (from: string, to: string, arc?: Arc) => links.push(arc ? { from, to, arc } : { from, to });

  // ---- Start + inner ring ----
  const s = toNode(start);
  add({ id: "start", kind: "start", region: "core", icon: startIcon, name: s.name, stats: s.stats }, { x: 0, y: 0 });
  // Region entries sit on even ring nodes; the odd ones between them hold the ring notables.
  const ring: string[] = [];
  const ringQueue = [...ringNotables];
  for (let i = 0; i < RING_COUNT; i++) {
    const p = polar({ x: 0, y: 0 }, RING_RADIUS, -90 + (360 / RING_COUNT) * i);
    const special = i % 2 === 1 ? ringQueue.shift() : undefined;
    if (special) {
      const c = toNode(special[1]);
      ring.push(
        add({ id: special[0], kind: "notable", region: "core", icon: c.icon, name: c.name, stats: c.stats }, p),
      );
      continue;
    }
    ring.push(
      add(
        {
          id: `ring_${i}`,
          kind: "minor",
          region: "core",
          icon: ringIcon,
          name: { en: "Foundation", pt: "Fundamento" },
          stats: [ringStats[i % ringStats.length]!],
        },
        p,
      ),
    );
  }
  if (ringQueue.length) throw new Error(`${ringQueue.length} ring notables left unplaced`);
  for (let i = 0; i < RING_COUNT; i++) link(ring[i]!, ring[(i + 1) % RING_COUNT]!, { cx: 0, cy: 0, r: RING_RADIUS });
  const ringAt = (angle: number) =>
    ring[Math.round(((((angle + 90) % 360) + 360) % 360) / (360 / RING_COUNT)) % RING_COUNT]!;

  const labels: RegionLabel[] = [];

  for (const spec of regions) {
    const dir = { x: Math.cos(rad(spec.angle)), y: Math.sin(rad(spec.angle)) };
    const perp = { x: -dir.y, y: dir.x };
    const at = (u: number, v: number): Pt => ({
      x: (RING_RADIUS + u) * dir.x + v * perp.x,
      y: (RING_RADIUS + u) * dir.y + v * perp.y,
    });
    const notables = [...spec.notables];
    const keystones = [...spec.keystones];
    const masteries = [...spec.masteries];
    let minorCount = 0;

    const b: RegionBuilder = {
      at,
      radial: (r, da) => polar({ x: 0, y: 0 }, r, spec.angle + da),
      ringEntry: ringAt(spec.angle),
      link,
      pos: (id) => {
        const n = byId.get(id);
        if (!n) throw new Error(`Unknown node ${id}`);
        return n;
      },
      minor: (stat, p) => {
        const text = spec.minorStats[stat];
        if (!text) throw new Error(`Region ${spec.region} has no minor stat "${stat}"`);
        return add(
          {
            id: `${spec.region}_m${minorCount++}`,
            kind: "minor",
            region: spec.region,
            icon: spec.minorIcon,
            name: spec.label,
            stats: [text],
          },
          p,
        );
      },
      notable: (p, id) => {
        const index = id === undefined ? 0 : notables.findIndex(([nid]) => nid === id);
        if (index < 0) throw new Error(`Region ${spec.region} has no unplaced notable "${id}"`);
        const [next] = notables.splice(index, 1);
        if (!next) throw new Error(`Region ${spec.region} ran out of notables`);
        const c = toNode(next[1]);
        return add(
          { id: next[0], kind: "notable", region: spec.region, icon: c.icon, name: c.name, stats: c.stats },
          p,
        );
      },
      mastery: (p) => {
        const next = masteries.shift();
        if (!next) throw new Error(`Region ${spec.region} ran out of masteries`);
        const c = toNode(next[1]);
        return add(
          { id: next[0], kind: "mastery", region: spec.region, icon: c.icon, name: c.name, stats: c.stats },
          p,
        );
      },
      keystone: (p) => {
        const next = keystones.shift();
        if (!next) throw new Error(`Region ${spec.region} ran out of keystones`);
        const c = toNode(next[1]);
        return add(
          {
            id: next[0],
            kind: "keystone",
            region: spec.region,
            icon: c.icon,
            name: c.name,
            stats: [...c.stats, ...next[2]],
          },
          p,
        );
      },
      chain: (stat, from, to, n) => {
        const a = b.pos(from);
        const ids: string[] = [];
        let prev = from;
        for (let i = 1; i <= n; i++) {
          const id = b.minor(stat, lerp(a, to, i / (n + 1)));
          link(prev, id);
          ids.push(id);
          prev = id;
        }
        return ids;
      },
      connect: (stat, from, to, n) => {
        const ids = b.chain(stat, from, b.pos(to), n);
        link(ids.at(-1) ?? from, to);
        return ids;
      },
      wheel: (stat, centre, r, entry, exit, n, slots = {}) => {
        const aIn = angleOf(centre, b.pos(entry));
        const aOut = angleOf(centre, exit);
        const ccw = (((aOut - aIn) % 360) + 360) % 360;
        const sweep = ccw > 180 ? ccw : ccw - 360;
        const ids: string[] = [];
        const angles: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = aIn + (sweep * i) / (n - 1);
          angles.push(a);
          const p = polar(centre, r, a);
          ids.push(slot(p, slots[i], stat));
          if (i > 0) link(ids[i - 1]!, ids[i]!, { cx: centre.x, cy: centre.y, r });
        }
        link(entry, ids[0]!);
        return { ids, angles };
      },
      loop: (stat, centre, r, n, a0, slots = {}) => {
        const ids: string[] = [];
        const angles: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = spec.angle + a0 + (360 / n) * i;
          angles.push(a);
          const p = polar(centre, r, a);
          ids.push(slot(p, slots[i], stat));
          if (i > 0) link(ids[i - 1]!, ids[i]!, { cx: centre.x, cy: centre.y, r });
        }
        link(ids[n - 1]!, ids[0]!, { cx: centre.x, cy: centre.y, r });
        return { ids, angles };
      },
      star: (stat, hub, len, angles) =>
        angles.map((a) => {
          const id = b.minor(stat, polar(b.pos(hub), len, spec.angle + a));
          link(hub, id);
          return id;
        }),
      band: (stat, r, a0, a1, n) => {
        const ids: string[] = [];
        for (let i = 0; i < n; i++) {
          ids.push(b.minor(stat, b.radial(r, a0 + ((a1 - a0) * i) / (n - 1))));
          if (i > 0) link(ids[i - 1]!, ids[i]!, { cx: 0, cy: 0, r });
        }
        return ids;
      },
      nearest: (region, to) => {
        const a = b.pos(to);
        let best: TreeNode | null = null;
        for (const n of nodes) {
          if (n.region !== region) continue;
          if (!best || Math.hypot(n.x - a.x, n.y - a.y) < Math.hypot(best.x - a.x, best.y - a.y)) best = n;
        }
        if (!best) throw new Error(`No ${region} nodes built yet`);
        return best.id;
      },
    };

    function slot(p: Pt, s: string | true | undefined, stat: string) {
      if (s === undefined) return b.minor(stat, p);
      return b.notable(p, s === true ? undefined : s);
    }

    link("start", b.ringEntry);
    spec.shape(b);
    if (notables.length || keystones.length || masteries.length) {
      throw new Error(
        `Region ${spec.region} left ${notables.length} notables / ${masteries.length} masteries / ${keystones.length} keystones unplaced`,
      );
    }
    if (spec.labelGap !== undefined) {
      // Title just past the region's outermost node; side titles grow away from the tree.
      const own = nodes.filter((n) => n.region === spec.region);
      const reach = Math.max(...own.map((n) => n.x * dir.x + n.y * dir.y));
      const sideways = Math.abs(dir.x) > 0.7;
      const anchor: LabelAnchor = sideways ? (dir.x > 0 ? "start" : "end") : "middle";
      const distance = reach + spec.labelGap + (sideways ? 0 : LABEL_SIZE / 2);
      labels.push({
        region: spec.region,
        text: spec.label,
        anchor,
        ...round({ x: dir.x * distance, y: dir.y * distance }),
      });
    }
  }

  const boxes = [...labels.map(labelBox), ...labels.map(emblemBox)];
  const xs = nodes.map((n) => n.x).concat(boxes.flatMap((b) => [b.x, b.x + b.w]));
  const ys = nodes.map((n) => n.y).concat(boxes.flatMap((b) => [b.y, b.y + b.h]));
  const pad = 260;
  const bounds = {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad / 2,
    w: Math.max(...xs) - Math.min(...xs) + pad * 2,
    h: Math.max(...ys) - Math.min(...ys) + pad,
  };

  return { nodes, links, labels, bounds };
}
