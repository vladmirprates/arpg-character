import fc from "fast-check";
import { LINKS, NODES, ROOT_ID } from "./data";
import {
  TREE_ADJACENCY,
  allocate,
  deallocate,
  pathTo,
  pointsSpent,
  reachableFromRoot,
  refundPreview,
  toggle,
} from "./graph";

const start = () => new Set([ROOT_ID]);

/** Plain BFS distance from the root, to check shortest paths independently of pathTo. */
function distanceFromRoot(target: string): number {
  const dist = new Map([[ROOT_ID, 0]]);
  const queue = [ROOT_ID];
  for (let i = 0; i < queue.length; i++) {
    for (const n of TREE_ADJACENCY.get(queue[i]!) ?? []) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(queue[i]!)! + 1);
        queue.push(n);
      }
    }
  }
  return dist.get(target)!;
}

describe("allocation", () => {
  test("allocating a neighbour of the root adds just that node", () => {
    expect([...allocate("ring_0", start())].sort()).toEqual(["ring_0", ROOT_ID].sort());
  });

  test("allocating a distant node allocates a shortest connected path to it", () => {
    const path = pathTo("tech_master", start());
    expect(path.at(-1)).toBe("tech_master");
    expect(path).toHaveLength(distanceFromRoot("tech_master"));
    expect(TREE_ADJACENCY.get(ROOT_ID)!.has(path[0]!)).toBe(true);
    for (let i = 1; i < path.length; i++) expect(TREE_ADJACENCY.get(path[i - 1]!)!.has(path[i]!)).toBe(true);

    const result = allocate("tech_master", start());
    expect(pointsSpent(result)).toBe(path.length);
    expect(reachableFromRoot(result)).toEqual(result);
  });

  test("the root can never be refunded", () => {
    expect(toggle(ROOT_ID, start())).toEqual(start());
  });

  test("refunding a node prunes everything that depended on it", () => {
    const tree = allocate("gm_collision", start());
    expect(deallocate("ring_0", tree)).toEqual(start());
    expect(refundPreview("ring_0", tree).sort()).toEqual([...tree].filter((id) => id !== ROOT_ID).sort());
  });

  test("refunding a leaf keeps the rest of the branch", () => {
    const tree = allocate("man_logs", start());
    const after = deallocate("man_logs", tree);
    expect(after.has("man_logs")).toBe(false);
    expect(pointsSpent(after)).toBe(pointsSpent(tree) - 1);
  });

  test("links are well-formed", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const { from, to } of LINKS) {
      expect(ids.has(from) && ids.has(to)).toBe(true);
      expect(from).not.toBe(to);
    }
  });
});

describe("allocation invariants (property-based)", () => {
  const arbClicks = fc.array(fc.constantFrom(...NODES.map((n) => n.id)), { maxLength: 80 });

  test("after any sequence of clicks the tree stays connected and contains the root", () => {
    fc.assert(
      fc.property(arbClicks, (clicks) => {
        let tree: Set<string> = start();
        for (const id of clicks) {
          tree = toggle(id, tree);
          expect(tree.has(ROOT_ID)).toBe(true);
          expect(reachableFromRoot(tree)).toEqual(tree);
        }
      }),
      { numRuns: 200 },
    );
  });

  test("clicking an unallocated node always allocates it", () => {
    fc.assert(
      fc.property(arbClicks, fc.constantFrom(...NODES.map((n) => n.id)), (clicks, target) => {
        let tree: Set<string> = start();
        for (const id of clicks) tree = toggle(id, tree);
        if (!tree.has(target)) expect(toggle(target, tree).has(target)).toBe(true);
      }),
    );
  });
});
