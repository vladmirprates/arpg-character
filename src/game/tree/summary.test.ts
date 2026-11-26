import { NODES, ROOT_ID } from "./data";
import { buildFromTargets } from "./build";
import { sumStats, summarize, specialization } from "./summary";

describe("sumStats", () => {
  test("adds lines that differ only in their number, keeping the sign style", () => {
    expect(
      sumStats([
        "+10 to Manual (Str)",
        "+12 to Manual (Str)",
        "6% increased Suite Speed",
        "6% increased Suite Speed",
        "+5% Coffee Regeneration",
      ]),
    ).toEqual(["+22 to Manual (Str)", "12% increased Suite Speed", "+5% Coffee Regeneration"]);
  });

  test("lines without numbers are kept once", () => {
    expect(sumStats(["Immune to meetings", "Immune to meetings"])).toEqual(["Immune to meetings"]);
  });
});

describe("summarize", () => {
  test("groups the build into keystones, masteries, skills by region and minor stats", () => {
    const build = buildFromTargets(["tech_master", "tech_m_web", "soft_comm"]);
    const s = summarize(build, NODES);
    expect(s.keystones.map((n) => n.id)).toEqual(["tech_master"]);
    expect(s.masteries.map((n) => n.id)).toEqual(["tech_m_web"]);
    expect(s.skills[0]!.region).toBe("core");
    expect(s.skills[0]!.nodes.map((n) => n.id)).toContain("soft_comm");
    const minors = NODES.filter((n) => build.has(n.id) && n.kind === "minor");
    expect(s.minorStats).toHaveLength(minors.reduce((k, n) => k + n.stats.length, 0));
  });

  test("an empty build has nothing to show", () => {
    const s = summarize(new Set([ROOT_ID]), NODES);
    expect(s).toEqual({ keystones: [], masteries: [], skills: [], minorStats: [] });
  });
});

describe("specialization", () => {
  const byRegion = (region: string) => NODES.filter((n) => n.region === region).map((n) => n.id);
  const build = (counts: Record<string, number>) =>
    new Set(Object.entries(counts).flatMap(([region, n]) => byRegion(region).slice(0, n)));

  test("the two most-invested disciplines name the class, in either order", () => {
    expect(specialization(build({ south: 5, east: 2 }), NODES)?.name.en).toBe("Test Alchemist");
    expect(specialization(build({ south: 2, east: 5 }), NODES)?.name.en).toBe("Test Alchemist");
  });

  test("a third, smaller discipline doesn't change it", () => {
    expect(specialization(build({ north: 6, west: 4, east: 1 }), NODES)?.name.en).toBe("Release Warden");
  });

  test("every pair has a name in both languages", () => {
    const regions = ["north", "south", "east", "west"];
    const names = new Set<string>();
    for (const a of regions) {
      for (const b of regions) {
        if (a === b) continue;
        const dual = specialization(build({ [a]: 3, [b]: 2 }), NODES)!;
        expect(dual.name.en).toBeTruthy();
        expect(dual.name.pt).toBeTruthy();
        names.add(dual.name.en);
      }
    }
    expect(names.size).toBe(6);
  });

  test("it takes two: nothing until a build reaches a second discipline", () => {
    expect(specialization(new Set(), NODES)).toBeNull();
    expect(specialization(build({ north: 4 }), NODES)).toBeNull();
    expect(specialization(build({ northeast: 4, core: 2 }), NODES)).toBeNull(); // bridges and soft skills don't count
  });
});
