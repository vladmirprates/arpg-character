import { LINKS, NODES, REGION_LABELS, ROOT_ID, WORLD } from "./data";
import { emblemBox, labelBox } from "./layout";
import { TREE_ADJACENCY, reachableFromRoot } from "./graph";
import { TREE_ICONS } from "./icons.generated";

/** Visual radius of each node kind, in world units (mirrors the renderer). */
const RADIUS = { start: 46, minor: 14, notable: 24, mastery: 30, keystone: 38 } as const;
const MAIN = ["north", "south", "east", "west"];
const BRIDGE = ["northeast", "southeast", "southwest", "northwest"];

describe("tree layout", () => {
  test("has the expected size and mix", () => {
    const count = (kind: string) => NODES.filter((n) => n.kind === kind).length;
    expect(NODES.length).toBeGreaterThanOrEqual(230);
    expect(NODES.length).toBeLessThanOrEqual(300);
    expect(count("start")).toBe(1);
    expect(count("keystone")).toBe(16);
    expect(count("mastery")).toBe(13);
    expect(count("notable")).toBe(62);
  });

  test("every cluster centre is a mastery, and soft skills ring the start", () => {
    const masteriesIn = (region: string) => NODES.filter((n) => n.kind === "mastery" && n.region === region).length;
    expect(MAIN.map(masteriesIn)).toEqual([2, 2, 4, 1]);
    for (const region of BRIDGE) expect(masteriesIn(region)).toBe(1);
    const soft = NODES.filter((n) => n.id.startsWith("soft_"));
    expect(soft).toHaveLength(8);
    for (const n of soft) {
      expect(n.region).toBe("core");
      expect(n.kind).toBe("notable");
    }
  });

  test("every region has its own keystones", () => {
    const keystonesIn = (region: string) => NODES.filter((n) => n.kind === "keystone" && n.region === region).length;
    for (const region of MAIN) expect(keystonesIn(region)).toBe(3);
    for (const region of BRIDGE) expect(keystonesIn(region)).toBe(1);
  });

  test("has specific skills, tools and masteries", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const id of ["gm_mechanics", "man_testcase", "tech_cicd", "proc_istqb", "tech_master", "man_master"]) {
      expect(ids.has(id)).toBe(true);
    }
    for (const id of [
      "tech_playwright",
      "tech_appium",
      "tech_python",
      "gm_engine",
      "br_load",
      "br_android",
      "ks_perf",
      "ks_mobile",
      "tech_m_web",
      "soft_comm",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  test("ids are unique and every node is reachable from the start", () => {
    const ids = NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(ROOT_ID);
    expect(reachableFromRoot(new Set(ids)).size).toBe(NODES.length);
  });

  test("links are well-formed", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const { from, to } of LINKS) {
      expect(ids.has(from) && ids.has(to)).toBe(true);
      expect(from).not.toBe(to);
    }
  });

  test("main regions only connect through the bridge regions (paths, not a mesh)", () => {
    const region = new Map(NODES.map((n) => [n.id, n.region]));
    const crossings = LINKS.filter(({ from, to }) => {
      const a = region.get(from)!;
      const b = region.get(to)!;
      return a !== b && MAIN.includes(a) && MAIN.includes(b);
    });
    expect(crossings).toEqual([]);
  });

  test("stays sparse like a PoE tree (average degree under 2.5)", () => {
    const degrees = [...TREE_ADJACENCY.values()].map((s) => s.size);
    const average = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    expect(average).toBeLessThan(2.5);
  });

  test("no two nodes overlap", () => {
    const overlaps: string[] = [];
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i]!;
        const b = NODES[j]!;
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - RADIUS[a.kind] - RADIUS[b.kind];
        if (gap < 8) overlaps.push(`${a.id} ↔ ${b.id} (${gap.toFixed(0)})`);
      }
    }
    expect(overlaps).toEqual([]);
  });

  test("unlinked large nodes keep their distance, so no two read as one cluster", () => {
    const big = NODES.filter((n) => n.kind !== "minor");
    const crowded: string[] = [];
    for (let i = 0; i < big.length; i++) {
      for (let j = i + 1; j < big.length; j++) {
        const a = big[i]!;
        const b = big[j]!;
        if (TREE_ADJACENCY.get(a.id)!.has(b.id)) continue;
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - RADIUS[a.kind] - RADIUS[b.kind];
        if (gap < 30) crowded.push(`${a.id} ↔ ${b.id} (${gap.toFixed(0)})`);
      }
    }
    expect(crowded).toEqual([]);
  });

  test("region titles and emblems never sit on top of a node", () => {
    const covered: string[] = [];
    for (const label of REGION_LABELS) {
      for (const box of [labelBox(label), emblemBox(label)]) {
        for (const n of NODES) {
          const r = RADIUS[n.kind] + 30;
          if (n.x + r > box.x && n.x - r < box.x + box.w && n.y + r > box.y && n.y - r < box.y + box.h) {
            covered.push(`${label.region} ↔ ${n.id}`);
          }
        }
      }
    }
    expect(covered).toEqual([]);
  });

  test("every node fits inside the world bounds", () => {
    for (const n of NODES) {
      expect(n.x).toBeGreaterThan(WORLD.x);
      expect(n.y).toBeGreaterThan(WORLD.y);
      expect(n.x).toBeLessThan(WORLD.x + WORLD.w);
      expect(n.y).toBeLessThan(WORLD.y + WORLD.h);
    }
  });

  test("every node's icon is bundled and every text is bilingual", () => {
    expect(NODES.filter((n) => !TREE_ICONS[n.icon]).map((n) => `${n.id}: ${n.icon}`)).toEqual([]);
    for (const n of NODES) {
      expect(n.name.en && n.name.pt).toBeTruthy();
      for (const s of n.stats) expect(s.en && s.pt).toBeTruthy();
    }
  });
});
