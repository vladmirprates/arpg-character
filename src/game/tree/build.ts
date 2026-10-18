import { NODES, ROOT_ID, type TreeNode } from "./data";
import { MY_BUILD_CODE, MY_BUILD_NODES } from "../../data/myBuild";
import { TREE_ADJACENCY, allocate, reachableFromRoot, type Adjacency } from "./graph";

/**
 * Build codes are URL-safe: a bitmask over a layout's nodes (in data order) as base64url.
 * Each layout has its own node order, so a code belongs to the layout it was made in.
 * Defaults are the default layout.
 */
/** The build shown on "My Build" — and the one the character sheet's attributes come from. */
export function publishedBuild(): Set<string> {
  return (MY_BUILD_CODE ? decodeBuild(MY_BUILD_CODE) : null) ?? buildFromTargets(MY_BUILD_NODES);
}

export function encodeBuild(allocated: ReadonlySet<string>, nodes: readonly TreeNode[] = NODES): string {
  const bytes = new Uint8Array(Math.ceil(nodes.length / 8));
  nodes.forEach((node, i) => {
    if (allocated.has(node.id)) bytes[i >> 3]! |= 1 << (i & 7);
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
  nodes: readonly TreeNode[] = NODES,
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
  nodes.forEach((node, i) => {
    if ((raw.charCodeAt(i >> 3) >> (i & 7)) & 1) ids.add(node.id);
  });
  return reachableFromRoot(ids, adj);
}

/** Allocates each target in order along with the shortest path to it — how a build is planned. */
export function buildFromTargets(targets: readonly string[], adj: Adjacency = TREE_ADJACENCY): Set<string> {
  return targets
    .filter((id) => adj.has(id))
    .reduce<Set<string>>((tree, id) => allocate(id, tree, adj), new Set([ROOT_ID]));
}
