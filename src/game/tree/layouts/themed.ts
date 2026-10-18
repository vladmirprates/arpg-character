import { BRIDGES, EAST, NORTH, SOUTH, WEST, type BridgeContent, type Def } from "../content";
import { polar, type Pt, type RegionBuilder, type RegionSpec } from "../layout";

/**
 * The passive tree's geometry. Every main region is built from the same PoE vocabulary —
 * roads of small nodes leading to clusters — but each mixes the cluster types differently:
 *
 *   wheel cluster   an arc of nodes round a mastery, with an exit notable (the classic shape)
 *   hub cluster     a notable with a few dead-end nodes around it
 *   ring            a closed loop guarding a keystone or mastery in its centre
 *   twin wheels     two small wheels facing each other, joined in the middle
 *
 * Regions don't interconnect except through the bridge regions on the diagonals, which each
 * reach into their two neighbours — so paths exist, but the tree is not a mesh.
 */

/** Chain of `n` minors from `from` to a new node made at `p` by `make`. */
function reach(b: RegionBuilder, stat: string, from: string, p: Pt, n: number, make: (p: Pt) => string) {
  const ids = b.chain(stat, from, p, n);
  const id = make(p);
  b.link(ids.at(-1) ?? from, id);
  return id;
}

/** Spine shared by the four main regions: ring → 2 minors → first notable, plus side spurs. */
function spine(b: RegionBuilder, spurs: (-1 | 1)[]) {
  const s1 = b.minor("spine", b.at(90, 0));
  b.link(b.ringEntry, s1);
  const s2 = b.minor("spine", b.at(180, 0));
  b.link(s1, s2);
  const n0 = b.notable(b.at(280, 0));
  b.link(s2, n0);
  for (const side of spurs) {
    const m = b.minor("spur", b.at(220, 120 * side));
    b.link(s2, m);
    b.link(m, b.notable(b.at(250, 215 * side)));
  }
  return n0;
}

/**
 * Classic wheel cluster: arc of `n` nodes round a mastery, entered from `entry`, leaving towards
 * `toward`, with an exit notable. `slots` puts notables on the wheel itself.
 */
function wheelCluster(
  b: RegionBuilder,
  stat: string,
  centre: Pt,
  r: number,
  n: number,
  entry: string,
  toward: Pt,
  slots: Record<number, string | true> = {},
) {
  const wheel = b.wheel(stat, centre, r, entry, toward, n, slots);
  b.link(wheel.ids[Math.floor(n / 2) - 1]!, b.mastery(centre));
  const exit = b.notable(polar(centre, r + 80, wheel.angles[n - 1]!));
  b.link(wheel.ids[n - 1]!, exit);
  return { wheel, exit };
}

/** Hub cluster: dead-end spokes round `hub` at local angles (0 = outward); one spoke may be a notable. */
function hubCluster(b: RegionBuilder, stat: string, hub: string, len: number, angles: number[], notableAt = -1) {
  const axis = axisAngle(b);
  angles.forEach((a, i) => {
    const p = polar(b.pos(hub), len, axis + a);
    b.link(hub, i === notableAt ? b.notable(p) : b.minor(stat, p));
  });
}

const axisAngle = (b: RegionBuilder) => {
  const o = b.at(0, 0);
  const u = b.at(1, 0);
  return (Math.atan2(u.y - o.y, u.x - o.x) * 180) / Math.PI;
};

/** The node of `ids` furthest out along the region's axis. */
const outermost = (b: RegionBuilder, ids: string[]) => {
  const o = b.at(0, 0);
  const u = b.at(1, 0);
  const along = (id: string) => {
    const p = b.pos(id);
    return (p.x - o.x) * (u.x - o.x) + (p.y - o.y) * (u.y - o.y);
  };
  return ids.reduce((best, id) => (along(id) > along(best) ? id : best));
};

/** Road from `from` to whichever of `targets` is nearest, with minors every ~150 units. */
function joinNearest(b: RegionBuilder, stat: string, from: string, targets: string[]) {
  const a = b.pos(from);
  const to = targets.reduce((best, id) => {
    const p = b.pos(id);
    const q = b.pos(best);
    return Math.hypot(p.x - a.x, p.y - a.y) < Math.hypot(q.x - a.x, q.y - a.y) ? id : best;
  });
  const q = b.pos(to);
  b.connect(stat, from, to, Math.max(0, Math.round(Math.hypot(q.x - a.x, q.y - a.y) / 150) - 1));
}

// ---- North · Systems: two classic wheels feed a fortress ring with a keystone at its heart ----
const NORTH_SPEC: RegionSpec<Def> = {
  ...NORTH,
  labelGap: 170,
  shape(b) {
    const n0 = spine(b, [-1, 1]);
    const left = wheelCluster(b, "wheel", b.at(480, -260), 100, 6, n0, b.at(840, 0), { 4: "gm_physics" });
    const right = wheelCluster(b, "star", b.at(480, 260), 100, 6, n0, b.at(840, 0), { 4: "gm_tuto" });

    // Fortress: 10 nodes every 36° from the inward side; 2 = left, 5 = outward, 8 = right.
    const fc = b.at(860, 0);
    const ring = b.loop("fortress", fc, 125, 10, 180, { 3: "gm_engine", 7: "gm_pc" });
    b.link(left.exit, ring.ids[2]!);
    b.link(right.exit, ring.ids[8]!);
    b.link(ring.ids[5]!, b.keystone(fc));

    // Beyond the walls: a road to a hub cluster that forks to two more keystones.
    const hub = reach(b, "climb", ring.ids[5]!, b.at(1200, 0), 2, b.notable);
    hubCluster(b, "path", hub, 90, [-100, 100, 0], 2);
    reach(b, "path", hub, b.at(1390, -190), 1, b.keystone);
    reach(b, "path", hub, b.at(1390, 190), 1, b.keystone);

    // The region's extra notable hangs outward off the left wheel, as in the classic tree.
    b.link(left.wheel.ids[3]!, b.notable(polar(b.at(480, -260), 200, left.wheel.angles[3]!)));
  },
};

// ---- South · Bug Report: roots — a wheel, a hub cluster and a long road to an outer wheel, cross-linked ----
const SOUTH_SPEC: RegionSpec<Def> = {
  ...SOUTH,
  labelGap: 170,
  shape(b) {
    const n0 = spine(b, [-1]);
    const left = wheelCluster(b, "wheel", b.at(480, -260), 100, 6, n0, b.at(880, 0), { 4: "man_triage" });

    const hub = reach(b, "root", n0, b.at(520, 240), 1, b.notable);
    hubCluster(b, "star", hub, 85, [0, 60, 120], 1);

    const road = b.chain("root", n0, b.at(700, 0), 2);
    const outer = wheelCluster(b, "loop", b.at(900, 0), 115, 6, road.at(-1)!, b.at(1250, 60), { 3: "man_uat" });
    reach(b, "path", outer.exit, b.at(1290, 0), 1, b.keystone);

    // Roots cross-link into the outer wheel.
    joinNearest(b, "root", left.exit, outer.wheel.ids);
    joinNearest(b, "root", hub, outer.wheel.ids);

    // Keystones off the side roots.
    const mid = reach(b, "path", left.exit, b.at(850, -360), 1, b.notable);
    reach(b, "path", mid, b.at(1080, -460), 1, b.keystone);
    reach(b, "loop", hub, b.at(1000, 430), 2, b.keystone);
  },
};

// ---- East · Technical: lopsided wheels lead to twin wheels joined like a circuit ----
const EAST_SPEC: RegionSpec<Def> = {
  ...EAST,
  labelGap: 170,
  shape(b) {
    const n0 = spine(b, [-1, 1]);
    const small = wheelCluster(b, "grid", b.at(470, -250), 90, 5, n0, b.at(850, -130), {
      0: "tech_python",
      3: "tech_java",
      4: "tech_js",
    });
    const large = wheelCluster(b, "bus", b.at(500, 280), 120, 7, n0, b.at(850, 130), {
      1: "tech_playwright",
      3: "tech_selenium",
      5: "tech_cypress",
    });

    // Twin wheels: each sweeps round its outer side and ends facing the other.
    const t1c = b.at(860, -140);
    const t2c = b.at(860, 140);
    const t1 = b.wheel("trace", t1c, 85, small.exit, b.at(860, 300), 5, { 1: "tech_visual", 3: "tech_appium" });
    b.link(t1.ids[1]!, b.mastery(t1c));
    const t2 = b.wheel("trace", t2c, 85, large.exit, b.at(860, -300), 5, { 1: "tech_sql", 3: "tech_api_tools" });
    b.link(t2.ids[1]!, b.mastery(t2c));
    // The junction where the twin wheels meet is a notable of its own.
    const e1 = b.pos(t1.ids.at(-1)!);
    const e2 = b.pos(t2.ids.at(-1)!);
    const junction = b.notable({ x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2 }, "tech_docker");
    b.link(t1.ids.at(-1)!, junction);
    b.link(junction, t2.ids.at(-1)!);

    reach(b, "trace", outermost(b, t1.ids), b.at(1180, -290), 1, b.keystone);
    reach(b, "trace", junction, b.at(1250, 0), 2, b.keystone);
    reach(b, "trace", outermost(b, t2.ids), b.at(1180, 290), 1, b.keystone);
  },
};

// ---- West · Process: a sprint ring around a notable, with hub clusters off both sides ----
const WEST_SPEC: RegionSpec<Def> = {
  ...WEST,
  labelGap: 170,
  shape(b) {
    const n0 = spine(b, [-1, 1]);
    const lead = b.chain("spoke", n0, b.at(520, 0), 1);

    // Ring of 10 every 36° from the inward side: 3 ≈ left, 5 = outward, 7 ≈ right.
    const rc = b.at(700, 0);
    const ring = b.loop("cycle", rc, 130, 10, 180, { 1: "proc_tms" });
    b.link(lead[0]!, ring.ids[0]!);
    b.link(ring.ids[5]!, b.mastery(rc));
    const leftExit = b.notable(b.at(700, -225));
    b.link(ring.ids[3]!, leftExit);
    const rightExit = b.notable(b.at(700, 225));
    b.link(ring.ids[7]!, rightExit);

    const hubL = reach(b, "sprint", leftExit, b.at(950, -310), 1, b.notable);
    hubCluster(b, "sprint", hubL, 85, [-130, -60]);
    const hubR = reach(b, "sprint", rightExit, b.at(950, 310), 1, b.notable);
    hubCluster(b, "sprint", hubR, 85, [60, 130]);

    reach(b, "path", hubL, b.at(1210, -420), 1, b.keystone);
    const outer = reach(b, "path", ring.ids[5]!, b.at(1120, 0), 2, b.notable);
    reach(b, "path", outer, b.at(1300, 0), 1, b.keystone);
    reach(b, "path", hubR, b.at(1210, 420), 1, b.keystone);
  },
};

// ---- Bridges: the diagonals between regions, each a wheel round a mastery with a keystone, linked to both neighbours ----
function bridge(spec: BridgeContent): RegionSpec<Def> {
  return {
    region: spec.region,
    angle: spec.angle,
    label: spec.label,
    minorIcon: "linked-rings",
    minorStats: { bridge: spec.stat },
    notables: spec.notables,
    masteries: [spec.mastery],
    keystones: [spec.keystone],
    shape(b) {
      const n1 = reach(b, "bridge", b.ringEntry, b.at(390, 0), 2, b.notable);
      const wc = b.at(640, 0);
      const w = b.wheel("bridge", wc, 110, n1, b.at(900, 60), 7, { 1: true });
      b.link(w.ids[3]!, b.mastery(wc));
      reach(b, "bridge", w.ids[6]!, b.at(960, 0), 1, b.keystone);
      // One road into each neighbouring region — the only links between regions. Each road leaves
      // from the wheel node facing its target, so it heads outward instead of cutting across the wheel.
      for (const region of spec.neighbours) {
        const to = b.nearest(region, w.ids[3]!);
        const q = b.pos(to);
        const from = w.ids.reduce((best, id) => {
          const p = b.pos(id);
          const s = b.pos(best);
          return Math.hypot(p.x - q.x, p.y - q.y) < Math.hypot(s.x - q.x, s.y - q.y) ? id : best;
        });
        const p = b.pos(from);
        b.connect("bridge", from, to, Math.max(1, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / 150) - 1));
      }
    },
  };
}

export function treeLayout(): RegionSpec<Def>[] {
  // Main regions first: bridges link into nodes that must already exist.
  return [NORTH_SPEC, EAST_SPEC, SOUTH_SPEC, WEST_SPEC, ...BRIDGES.map(bridge)];
}
