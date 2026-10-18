import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CERT_AREAS, CERT_CHECKS } from "./certification";

/**
 * Traceability: every requirement on the certification checklist must be proven by a tagged test,
 * and every tag must point at a real requirement. Otherwise the checklist could claim coverage
 * that doesn't exist, or a test could silently stop counting.
 */
const e2eDir = join(__dirname, "../../e2e");
const specs = readdirSync(e2eDir)
  .filter((f) => f.endsWith(".spec.ts"))
  .map((f) => readFileSync(join(e2eDir, f), "utf8"))
  .join("\n");
const tagged = new Set([...specs.matchAll(/test\(\s*`?"?\[(CERT-[A-Z0-9-]+)\]/g)].map((m) => m[1]!));

describe("certification checklist", () => {
  it.each(CERT_CHECKS.filter((c) => c.evidence === "e2e").map((c) => c.id))("%s has a tagged e2e test", (id) => {
    expect(tagged).toContain(id);
  });

  it("has no tags for requirements that don't exist", () => {
    const ids = new Set(CERT_CHECKS.map((c) => c.id));
    expect([...tagged].filter((id) => !ids.has(id))).toEqual([]);
  });

  it("backs Lighthouse evidence with a performance budget in the CI config", () => {
    const config = JSON.parse(readFileSync(join(__dirname, "../../lighthouserc.json"), "utf8"));
    expect(config.ci.assert.assertions["categories:performance"][1].minScore).toBeGreaterThanOrEqual(0.9);
  });

  it("has unique ids, and every check sits in a known area", () => {
    const ids = CERT_CHECKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const areas = new Set(CERT_AREAS.map((a) => a.id));
    for (const c of CERT_CHECKS) expect(areas).toContain(c.area);
  });

  it("is translated: no requirement text is left empty in either language", () => {
    for (const c of CERT_CHECKS) {
      for (const text of [c.console, c.web, c.how]) {
        expect(text.en.trim()).not.toBe("");
        expect(text.pt.trim()).not.toBe("");
      }
    }
  });
});
