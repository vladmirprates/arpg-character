import fc from "fast-check";
import { MY_BUILD_CODE, MY_BUILD_NODES } from "../../data/myBuild";
import { NODES, ROOT_ID } from "./data";
import { buildFromTargets, CODE_ORDER, decodeBuild, encodeBuild } from "./build";
import { CODE_ORDER_V1 } from "./codeOrder";
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

/**
 * Build codes already out in the world (shared links, saved builds) must keep their meaning when
 * the tree grows. With bits in layout order, adding four Game Testing notables would have turned
 * the published build into a different one: 51 nodes lost, 23 wrong ones gained.
 */
describe("build codes survive the tree changing", () => {
  /** The published build as encoded before any node was added (2026-10-18): 211 nodes. */
  const V1_CODE = "____z__8Pfn_7____z-_4v___3_-8x__-_7___x_AA";

  test("no node in the frozen order was removed or renamed", () => {
    const ids = new Set(NODES.map((n) => n.id));
    expect(CODE_ORDER_V1.filter((id) => !ids.has(id))).toEqual([]);
  });

  test("every node has exactly one place in the frozen order", () => {
    expect(CODE_ORDER.slice(0, CODE_ORDER_V1.length)).toEqual(CODE_ORDER_V1);
    expect(new Set(CODE_ORDER).size).toBe(CODE_ORDER.length);
    // A failure here means a new node: append its id to CODE_ORDER_ADDED in codeOrder.ts.
    const order = new Set(CODE_ORDER);
    expect(NODES.map((n) => n.id).filter((id) => !order.has(id))).toEqual([]);
    expect([...CODE_ORDER].sort()).toEqual(NODES.map((n) => n.id).sort());
  });

  test("adding nodes in the middle of the tree doesn't change what a newer code means", () => {
    // Encoded after the bridge notables were added, before the balance clusters (2026-10-18).
    const build = decodeBuild("____z__8Pfn_7____z-_4v___3_-8x__-_7___x__vE")!;
    expect(build.size).toBe(223);
    for (const id of ["gm_quest", "br_graphics", "br_bvt", "br_patch"]) expect(build).toContain(id);
    expect(build).not.toContain("man_repro");
  });

  test("a code made before nodes were added decodes to the same build", () => {
    const build = decodeBuild(V1_CODE)!;
    expect(build.size).toBe(211);
    for (const id of ["gm_mechanics", "gm_pc", "gm_master"]) expect(build).toContain(id);
    // None of the nodes added since: an old code can't know about them.
    for (const id of CODE_ORDER.slice(CODE_ORDER_V1.length)) expect(build).not.toContain(id);
  });
});
