import type { L } from "../../i18n/types";
import { BRIDGES, EAST, NORTH, SOUTH, WEST } from "./content";
import type { Region, TreeNode } from "./data";

/** Region order for the summary: the four disciplines, then the bridge specialties. Soft skills go first. */
const REGION_ORDER: Region[] = [
  "core",
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "southeast",
  "southwest",
  "northwest",
];

export const REGION_NAMES: Record<Exclude<Region, "core">, L> = Object.fromEntries(
  [NORTH, SOUTH, EAST, WEST, ...BRIDGES].map((r) => [r.region, r.label]),
) as Record<Exclude<Region, "core">, L>;

export interface BuildSummary {
  keystones: TreeNode[];
  masteries: TreeNode[];
  /** Allocated notables grouped by region, in REGION_ORDER; empty groups are left out. */
  skills: { region: Region; nodes: TreeNode[] }[];
  /** Stat lines of the allocated small nodes. */
  minorStats: L[];
}

export function summarize(allocated: ReadonlySet<string>, nodes: readonly TreeNode[]): BuildSummary {
  const on = nodes.filter((n) => allocated.has(n.id));
  const byRegion = (kind: TreeNode["kind"]) =>
    on.filter((n) => n.kind === kind).sort((a, b) => REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
  const notables = byRegion("notable");
  return {
    keystones: byRegion("keystone"),
    masteries: byRegion("mastery"),
    skills: REGION_ORDER.map((region) => ({ region, nodes: notables.filter((n) => n.region === region) })).filter(
      (g) => g.nodes.length > 0,
    ),
    minorStats: on.filter((n) => n.kind === "minor").flatMap((n) => n.stats),
  };
}

const NUMBER = /([+-]?)(\d+(?:\.\d+)?)/;

/**
 * Adds up stat lines that differ only in their number, PoE-style:
 * "+10 to Manual (Str)" + "+12 to Manual (Str)" → "+22 to Manual (Str)". Biggest totals first.
 */
export function sumStats(lines: string[]): string[] {
  const totals = new Map<string, { sign: string; value: number; order: number }>();
  for (const line of lines) {
    const m = NUMBER.exec(line);
    const key = m ? line.replace(NUMBER, "#") : line;
    const entry = totals.get(key) ?? { sign: m?.[1] ?? "", value: 0, order: totals.size };
    entry.value += m ? Number(m[1] === "-" ? -Number(m[2]) : m[2]) : 1;
    totals.set(key, entry);
  }
  return [...totals.entries()]
    .sort(([, a], [, b]) => Math.abs(b.value) - Math.abs(a.value) || a.order - b.order)
    .map(([key, { sign, value }]) =>
      key.includes("#")
        ? key.replace("#", `${sign === "+" && value >= 0 ? "+" : ""}${Math.round(value * 10) / 10}`)
        : key,
    );
}

type Mastery = "north" | "south" | "east" | "west";
const MASTERIES: readonly Mastery[] = ["north", "south", "east", "west"];

/** The specialization two disciplines make, keyed by their regions in MASTERIES order. */
const SPECIALIZATIONS: Record<string, L> = {
  "north+south": { en: "Playtester", pt: "Playtester" },
  "north+east": { en: "Bot Wrangler", pt: "Domador de Bots" },
  "north+west": { en: "Release Warden", pt: "Guardião do Lançamento" },
  "south+east": { en: "Test Alchemist", pt: "Alquimista de Testes" },
  "south+west": { en: "Bug Oracle", pt: "Oráculo de Bugs" },
  "east+west": { en: "Pipeline Architect", pt: "Arquiteto de Pipeline" },
};

/**
 * Two masteries make a specialization: the build's two most-invested disciplines name it. It sits
 * under the class, it doesn't replace it. Ties go to the discipline listed first. Null until the
 * build reaches two of them.
 */
export function specialization(allocated: ReadonlySet<string>, nodes: readonly TreeNode[]) {
  const count = (region: Mastery) => nodes.filter((n) => n.region === region && allocated.has(n.id)).length;
  const ranked = MASTERIES.map((region, order) => ({ region, order, total: count(region) }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total || a.order - b.order)
    .slice(0, 2);
  if (ranked.length < 2) return null;
  const [first, second] = [...ranked].sort((a, b) => a.order - b.order) as [(typeof ranked)[0], (typeof ranked)[0]];
  return {
    name: SPECIALIZATIONS[`${first.region}+${second.region}`]!,
    a: REGION_NAMES[first.region],
    b: REGION_NAMES[second.region],
  };
}
