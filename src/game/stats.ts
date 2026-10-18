import {
  ATTRIBUTES,
  BASE_ATTRIBUTE,
  RESISTANCES,
  RESIST_CAP,
  type AttributeId,
  type ResistId,
} from "../data/character";
import type { DisplayItem } from "../data/equipment";
import type { L } from "../i18n/types";
import type { TreeNode } from "./tree/data";

/**
 * The character sheet's numbers, derived the way an ARPG does it:
 *   attributes  = base + every attribute line on the allocated passive nodes
 *   resistances = sum of the equipped items' resistance mods, capped at 75%
 */

export type Attributes = Record<AttributeId, number>;

/** English attribute names as they appear in stat lines → attribute ids. */
const ATTRIBUTE_NAMES: Record<string, AttributeId> = Object.fromEntries(
  ATTRIBUTES.map((a) => [a.label.en.toLowerCase(), a.id]),
);
const zero = (): Attributes => ({ manual: 0, automation: 0, process: 0, gamesense: 0 });

/**
 * Reads the attributes a stat line grants. Understands the three shapes the tree uses:
 * "+10 to Manual (Str)", "+6 to Manual and Process", "+8 to all Attributes".
 */
export function parseAttributes(line: string): Partial<Attributes> {
  const all = /^\+(\d+) to all Attributes$/i.exec(line);
  if (all) return Object.fromEntries(ATTRIBUTES.map((a) => [a.id, Number(all[1])]));
  const m = /^\+(\d+) to (.+?)(?: \((?:Str|Int|Dex|Wis)\))?$/i.exec(line);
  if (!m) return {};
  const ids = m[2]!.split(/ and /i).map((name) => ATTRIBUTE_NAMES[name.trim().toLowerCase()]);
  if (ids.some((id) => !id)) return {};
  return Object.fromEntries(ids.map((id) => [id!, Number(m[1])]));
}

/** Attributes granted by the allocated nodes of a build. */
export function treeAttributes(allocated: ReadonlySet<string>, nodes: readonly TreeNode[]): Attributes {
  const total = zero();
  for (const node of nodes) {
    if (!allocated.has(node.id)) continue;
    for (const stat of node.stats) {
      for (const [id, value] of Object.entries(parseAttributes(stat.en)) as [AttributeId, number][]) total[id] += value;
    }
  }
  return total;
}

/** The sheet's attributes: base plus the passive tree, with the breakdown kept for tooltips. */
export function characterAttributes(allocated: ReadonlySet<string>, nodes: readonly TreeNode[]) {
  const tree = treeAttributes(allocated, nodes);
  return ATTRIBUTES.map((a) => ({ ...a, base: BASE_ATTRIBUTE, tree: tree[a.id], total: BASE_ATTRIBUTE + tree[a.id] }));
}

/** Resistances from equipped items: the raw sum, and the value after the 75% cap. */
export function equipmentResistances(items: readonly DisplayItem[]) {
  const sum: Record<ResistId, number> = { spaghetti: 0, fires: 0, deadlines: 0, scope: 0, flaky: 0 };
  for (const item of items) {
    for (const [id, value] of Object.entries(item.resists ?? {}) as [ResistId, number][]) sum[id] += value;
  }
  return RESISTANCES.map((r) => ({
    ...r,
    total: sum[r.id],
    value: Math.min(sum[r.id], RESIST_CAP),
    capped: sum[r.id] >= RESIST_CAP,
  }));
}

/** An item's resistance mods as tooltip lines, PoE-style: "+20% to Production Fires Resistance". */
export function resistLines(item: DisplayItem): L[] {
  return RESISTANCES.filter((r) => item.resists?.[r.id]).map((r) => {
    const v = item.resists![r.id]!;
    return { en: `[+${v}%] to ${r.label.en} Resistance`, pt: `[+${v}%] de Resistência a ${r.label.pt}` };
  });
}
