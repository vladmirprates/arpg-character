import { CODE_ORDER_ADDED, CODE_ORDER_V1 } from "./codeOrder";
import { ROOT_ID } from "./data";
import { MY_BUILD_CODE, MY_BUILD_NODES } from "../../data/myBuild";
import { TREE_ADJACENCY, allocate, reachableFromRoot, type Adjacency } from "./graph";

/**
 * Build codes are URL-safe: a bitmask over the tree's nodes as base64url.
 *
 * The bit order is frozen (codeOrder.ts), not the order the layout happens to create nodes in:
 * otherwise adding one node would shift every later bit and silently turn every shared link and
 * saved build into a different build. New nodes are appended to the frozen list, so old codes
 * keep their meaning and new codes simply grow.
 */
export const CODE_ORDER: readonly string[] = [...CODE_ORDER_V1, ...CODE_ORDER_ADDED];

/** The build shown on "My Build" — and the one the character sheet's attributes come from. */
export function publishedBuild(): Set<string> {
  return (MY_BUILD_CODE ? decodeBuild(MY_BUILD_CODE) : null) ?? buildFromTargets(MY_BUILD_NODES);
}

export function encodeBuild(allocated: ReadonlySet<string>, order: readonly string[] = CODE_ORDER): string {
  const bytes = new Uint8Array(Math.ceil(order.length / 8));
  order.forEach((id, i) => {
    if (allocated.has(id)) bytes[i >> 3]! |= 1 << (i & 7);
  });
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes a build code. Untrusted input: invalid codes return null, and nodes that are not
 * connected to the root are dropped, so the result is always a legal tree.
 */
export function decodeBuild(
  code: string,
  order: readonly string[] = CODE_ORDER,
  adj: Adjacency = TREE_ADJACENCY,
): Set<string> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
  let raw: string;
  try {
    raw = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  const ids = new Set<string>([ROOT_ID]);
  order.forEach((id, i) => {
    if ((raw.charCodeAt(i >> 3) >> (i & 7)) & 1) ids.add(id);
  });
  // Ids the tree no longer has (none today) are dropped here, with anything cut off by them.
  return reachableFromRoot(ids, adj);
}

/** Allocates each target in order along with the shortest path to it — how a build is planned. */
export function buildFromTargets(targets: readonly string[], adj: Adjacency = TREE_ADJACENCY): Set<string> {
  return targets
    .filter((id) => adj.has(id))
    .reduce<Set<string>>((tree, id) => allocate(id, tree, adj), new Set([ROOT_ID]));
}
