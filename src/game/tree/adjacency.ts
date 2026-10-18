export type Adjacency = ReadonlyMap<string, ReadonlySet<string>>;

/** Undirected neighbour map for a node/link set. */
export function buildAdjacency(
  nodes: readonly { id: string }[],
  links: readonly { from: string; to: string }[],
): Adjacency {
  const adj = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set()]));
  for (const { from, to } of links) {
    adj.get(from)?.add(to);
    adj.get(to)?.add(from);
  }
  return adj;
}
