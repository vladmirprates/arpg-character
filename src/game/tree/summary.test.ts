import { NODES, ROOT_ID } from "./data";
import { buildFromTargets } from "./build";
import { sumStats, summarize } from "./summary";

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
