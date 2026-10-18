import { applyOrb, startSession } from "./useCraftSession";
import { bugReport, reproUrl } from "./report";

describe("craft bug report", () => {
  test("lists every attempt, failures included, with a working repro link", () => {
    let session = startSession({ base: "bug", seed: 0xabc, orbs: [] });
    for (const orb of ["chaos", "transmute"] as const) session = applyOrb(session, orb).session;

    const report = bugReport(session, "en", "https://example.test/");
    expect(report).toContain("- Seed: 0xabc");
    expect(report).toContain("2. Apply Entropy Orb → FAIL — Item must be Rare");
    expect(report).toContain("3. Apply Orb of Triage → OK");
    expect(report).toContain("Rarity: Magic");
    // Only successful orbs go into the recipe, so the link replays cleanly.
    expect(reproUrl(session, "https://example.test/")).toBe("https://example.test/#craft=bug.abc.0");
  });

  test("replaying a session's recipe reproduces its item", () => {
    let session = startSession({ base: "testcase", seed: 77, orbs: [] });
    for (const orb of ["transmute", "augmentation", "regal", "exalted", "vaal"] as const)
      session = applyOrb(session, orb).session;
    expect(startSession(session.recipe).item).toEqual(session.item);
  });
});
