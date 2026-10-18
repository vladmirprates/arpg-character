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

/** The node of `ids` closest to point `p`. */
const closestTo = (b: RegionBuilder, ids: string[], p: Pt) =>
  ids.reduce((best, id) => {
    const a = b.pos(id);
    const s = b.pos(best);
    return Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(s.x - p.x, s.y - p.y) ? id : best;
  });

/** A wheel of minors round a mastery, with no notables: a small cluster off an existing node. */
function masteryWheel(b: RegionBuilder, stat: string, centre: Pt, entry: string, toward: Pt) {
  const wheel = b.wheel(stat, centre, 90, entry, toward, 5);
  b.link(wheel.ids[2]!, b.mastery(centre));
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

    // Added later, and kept last so every node above keeps its id (minor ids count up in order).
    // The right wheel gets the matching outward notable, and the outer hub two side branches.
    b.link(right.wheel.ids[3]!, b.notable(polar(b.at(480, 260), 200, right.wheel.angles[3]!)));
    const sides = ([-1, 1] as const).map((side) => reach(b, "path", hub, b.at(1240, 230 * side), 1, b.notable));
    reach(b, "fortress", ring.ids[2]!, b.at(860, -330), 1, b.notable);

    // Balance (2026-10-18): a mastery wheel past each side branch, so every main region has four.
    sides.forEach((id, i) => {
      const side = i === 0 ? -1 : 1;
      masteryWheel(b, "path", b.at(1180, 480 * side), id, b.at(1180, 800 * side));
    });
  },
};

// ---- South · Bug Report: mirror-symmetric — side wheels to two keystones, a road to the capstone, and outer wheels meeting at a notable ----
const SOUTH_SPEC: RegionSpec<Def> = {
  ...SOUTH,
  labelGap: 170,
  shape(b) {
    // Redrawn symmetric on 2026-10-18. Build codes store minor ids, which count up as minors are
    // made, so the minors are made in an order that gives every path its old ids (south_m0…m23);
    // ids that were never part of a published build (m3, m4, m8–m12) go to the new outer wheels.
    const at = (u: number, v: number, side: number) => b.at(u, v * side);
    const s1 = b.minor("spine", b.at(90, 0));
    b.link(b.ringEntry, s1);
    const s2 = b.minor("spine", b.at(180, 0));
    b.link(s1, s2);
    const bugs = b.notable(b.at(280, 0), "man_bugs");
    b.link(s2, bugs);
    const spur = (side: number, id: string) => {
      const m = b.minor("spur", at(220, 120, side));
      b.link(s2, m);
      b.link(m, b.notable(at(250, 215, side), id));
    };
    spur(-1, "man_testcase"); // m2
    const roads = [-1, 1].map((side) => b.minor("root", at(840, 150, side))); // m3, m4
    spur(1, "man_smoke"); // m5
    const axis = [b.minor("root", b.at(430, 0)), b.minor("root", b.at(580, 0))]; // m6, m7
    b.link(bugs, axis[0]!);
    b.link(axis[0]!, axis[1]!);

    // Outer wheels round a mastery, each leaving towards the notable where they meet.
    const meet = b.notable(b.at(1330, 0), "man_repro");
    const outerWheel = (side: number, slots: [string, string, string], mastery: string) => {
      const c = at(1000, 260, side);
      const w = b.wheel("loop", c, 90, roads[side < 0 ? 0 : 1]!, b.pos(meet), 6, { 1: slots[0], 4: slots[1] });
      b.link(w.ids[2]!, b.mastery(c, mastery));
      const exit = b.notable(polar(c, 170, w.angles[5]!), slots[2]);
      b.link(w.ids[5]!, exit);
      return exit;
    };
    const left = outerWheel(-1, ["man_boundary", "man_session", "man_data"], "man_m_design"); // m8–m11
    b.connect("root", left, meet, 1); // m12

    // Side wheels off the first notable, each leading on to a notable and a keystone.
    const sideWheel = (side: number, slot: string, mastery: string, exit: string) => {
      const c = at(480, 260, side);
      const w = b.wheel("wheel", c, 100, bugs, at(700, 500, side), 5, { 2: slot });
      b.link(w.ids[1]!, b.mastery(c, mastery));
      const out = b.notable(polar(c, 180, w.angles[4]!), exit);
      b.link(w.ids[4]!, out);
      return out;
    };
    const explore = sideWheel(-1, "man_triage", "man_m_advocacy", "man_explore"); // m13–m16
    const uat = sideWheel(1, "man_regression", "man_m_execution", "man_uat"); // m17–m20
    const tips = [
      [explore, "man_logs", "ks_zero_bug", -1],
      [uat, "man_compat", "ks_pixel", 1],
    ] as const;
    for (const [from, id, keystone, side] of tips) {
      const n = b.notable(at(770, 520, side), id);
      b.link(from, n);
      reach(b, "path", n, at(1020, 590, side), 1, (p) => b.keystone(p, keystone)); // m21, m22
    }

    // The road down the middle to the capstone, and the outer wheels off its end.
    const end = b.minor("root", b.at(730, 0)); // m23
    b.link(axis[1]!, end);
    b.link(end, b.keystone(b.at(880, 0), "man_master"));
    for (const r of roads) b.link(end, r);
    const right = outerWheel(1, ["man_lqa", "man_usability", "man_store"], "man_m_market");
    b.connect("root", right, meet, 1);
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
    const outer = reach(b, "path", ring.ids[5]!, b.at(1060, 0), 2, b.notable);
    reach(b, "path", outer, b.at(1200, 0), 1, b.keystone);
    reach(b, "path", hubR, b.at(1210, 420), 1, b.keystone);

    // Balance (2026-10-18): a wheel each side of the capstone, both feeding a loop beyond it.
    const tails = ([-1, 1] as const).map((side) => {
      const entry = b.chain("sprint", outer, b.at(1150, 175 * side), 1)[0]!;
      const c = b.at(1270, 250 * side);
      const w = b.wheel("sprint", c, 90, entry, b.at(1400, 60 * side), 5, { 1: true, 3: true });
      b.link(w.ids[2]!, b.mastery(c));
      return w.ids[4]!;
    });
    const lc = b.at(1370, 0);
    const loop = b.loop("sprint", lc, 85, 8, 180, { 3: true, 5: true });
    b.link(loop.ids[4]!, b.mastery(lc));
    for (const t of tails) b.link(t, closestTo(b, loop.ids, b.pos(t)));
  },
};

// ---- Bridges: the diagonals between regions, each a wheel round a mastery with a keystone, linked to both neighbours ----
function bridge(spec: BridgeContent): RegionSpec<Def> {
  return {
    region: spec.region,
    angle: spec.angle,
    label: spec.label,
    minorIcon: "linked-rings",
    attribute: spec.attributes,
    attributeScale: 0.5,
    minorStats: { bridge: null },
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
      // Added later, and kept last so every node above keeps its id: a notable on each side of
      // the keystone, branching off the wheel, so each bridge has four.
      for (const side of [-1, 1]) {
        const p = b.at(900, 200 * side);
        const from = w.ids.reduce((best, id) => {
          const a = b.pos(id);
          const s = b.pos(best);
          return Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(s.x - p.x, s.y - p.y) ? id : best;
        });
        reach(b, "bridge", from, p, 0, b.notable);
      }
    },
  };
}

export function treeLayout(): RegionSpec<Def>[] {
  // Main regions first: bridges link into nodes that must already exist.
  return [NORTH_SPEC, EAST_SPEC, SOUTH_SPEC, WEST_SPEC, ...BRIDGES.map(bridge)];
}
