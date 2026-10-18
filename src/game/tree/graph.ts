import { buildAdjacency, type Adjacency } from "./adjacency";
import { LINKS, NODES, ROOT_ID } from "./data";

export { buildAdjacency, type Adjacency };

/** Adjacency of the default layout; every function also takes another layout's adjacency. */
export const TREE_ADJACENCY = buildAdjacency(NODES, LINKS);

/** Allocated nodes connected to the root through allocated nodes only (BFS). */
export function reachableFromRoot(allocated: ReadonlySet<string>, adj: Adjacency = TREE_ADJACENCY): Set<string> {
  const seen = new Set<string>([ROOT_ID]);
  const queue = [ROOT_ID];
  for (let i = 0; i < queue.length; i++) {
    for (const next of adj.get(queue[i]!) ?? []) {
      if (allocated.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/**
 * Shortest chain of unallocated nodes that connects `target` to the allocated tree,
 * ordered from the tree outwards and ending with `target`. Empty if already allocated.
 */
export function pathTo(target: string, allocated: ReadonlySet<string>, adj: Adjacency = TREE_ADJACENCY): string[] {
  if (allocated.has(target) || !adj.has(target)) return [];

  // BFS outward from the target until we touch any allocated node.
  const parent = new Map<string, string | null>([[target, null]]);
  const queue = [target];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    for (const next of adj.get(current) ?? []) {
      if (allocated.has(next)) {
        const path: string[] = [];
        for (let n: string | null = current; n; n = parent.get(n) ?? null) path.push(n);
        return path;
      }
      if (!parent.has(next)) {
        parent.set(next, current);
        queue.push(next);
      }
    }
  }
  return [];
}

/** Allocates `target` plus every node needed to reach it. */
export function allocate(target: string, allocated: ReadonlySet<string>, adj: Adjacency = TREE_ADJACENCY): Set<string> {
  return new Set([...allocated, ...pathTo(target, allocated, adj)]);
}

/** Refunds `target` and any nodes that lose their connection to the root because of it. */
export function deallocate(
  target: string,
  allocated: ReadonlySet<string>,
  adj: Adjacency = TREE_ADJACENCY,
): Set<string> {
  if (target === ROOT_ID || !allocated.has(target)) return new Set(allocated);
  const remaining = new Set(allocated);
  remaining.delete(target);
  return reachableFromRoot(remaining, adj);
}

/** Nodes that `deallocate(target)` would remove — used to preview refunds on hover. */
export function refundPreview(
  target: string,
  allocated: ReadonlySet<string>,
  adj: Adjacency = TREE_ADJACENCY,
): string[] {
  const after = deallocate(target, allocated, adj);
  return [...allocated].filter((id) => !after.has(id));
}

export function toggle(target: string, allocated: ReadonlySet<string>, adj: Adjacency = TREE_ADJACENCY): Set<string> {
  return allocated.has(target) ? deallocate(target, allocated, adj) : allocate(target, allocated, adj);
}

/** Points spent = allocated nodes minus the free root. */
export function pointsSpent(allocated: ReadonlySet<string>): number {
  return allocated.size - (allocated.has(ROOT_ID) ? 1 : 0);
}
