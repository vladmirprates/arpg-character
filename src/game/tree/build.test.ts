import fc from "fast-check";
import { MY_BUILD_CODE, MY_BUILD_NODES } from "../../data/myBuild";
import { NODES, ROOT_ID } from "./data";
import { buildFromTargets, decodeBuild, encodeBuild } from "./build";
import { reachableFromRoot, toggle } from "./graph";

describe("build codes", () => {
  test("any legal tree round-trips through a build code", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...NODES.map((n) => n.id)), { maxLength: 60 }), (clicks) => {
        let tree: Set<string> = new Set([ROOT_ID]);
        for (const id of clicks) tree = toggle(id, tree);
        expect(decodeBuild(encodeBuild(tree))).toEqual(tree);
      }),
    );
  });

  test("garbage input never yields an illegal tree", () => {
    fc.assert(
      fc.property(fc.string(), (code) => {
        const tree = decodeBuild(code);
        if (tree) expect(reachableFromRoot(tree)).toEqual(tree);
      }),
    );
  });

  test.each(["", "!!", "a b", "<img>"])("rejects %j", (code) => {
    expect(decodeBuild(code)).toBeNull();
  });

  test("the published 'My Build' allocates every target on a connected tree", () => {
    const tree = buildFromTargets(MY_BUILD_NODES);
    for (const id of MY_BUILD_NODES) expect(tree.has(id)).toBe(true);
    expect(reachableFromRoot(tree)).toEqual(tree);
  });

  test("the published My Build code still fits the current tree", () => {
    // A tree change can invalidate the code; then the app would quietly fall back to MY_BUILD_NODES.
    if (!MY_BUILD_CODE) return;
    const build = decodeBuild(MY_BUILD_CODE);
    expect(build).not.toBeNull();
    expect(reachableFromRoot(build!)).toEqual(build);
  });
});
