import type { Locale } from "../../i18n/types";
import { affixLimit } from "./engine";
import { BRICKED, POOLS, RARE_NAME_PARTS, getAffix, getImplicit } from "./pools";
import type { AffixKind, CraftItem } from "./types";

export interface AffixGroup {
  kind: AffixKind;
  count: number;
  limit: number;
  lines: { id: string; text: string }[];
}

/** Everything a view needs to render an item, already resolved to one locale. */
export interface ItemView {
  name: string;
  baseName: string;
  rarity: CraftItem["rarity"];
  implicit: string | null;
  /** Unique (bricked) items have fixed lines instead of affix groups. */
  uniqueLines: string[];
  groups: AffixGroup[];
  corrupted: boolean;
}

export function describeItem(item: CraftItem, locale: Locale): ItemView {
  const baseName = item.bricked ? BRICKED.name[locale] : POOLS[item.base].baseName[locale];
  const groups: AffixGroup[] = [];

  if (!item.bricked) {
    for (const kind of ["prefix", "suffix"] as const) {
      const list = item.affixes.filter((x) => x.kind === kind);
      if (list.length === 0) continue;
      groups.push({
        kind,
        count: list.length,
        limit: affixLimit(item.rarity),
        lines: list.map((x) => ({ id: x.id, text: getAffix(x.id).effect[locale] })),
      });
    }
  }

  return {
    name: itemName(item, locale),
    baseName,
    rarity: item.rarity,
    implicit: item.bricked ? BRICKED.implicit[locale] : item.implicitId ? getImplicit(item.implicitId)[locale] : null,
    uniqueLines: item.bricked ? BRICKED.mods.map((m) => m[locale]) : [],
    groups,
    corrupted: item.corrupted,
  };
}

export function itemName(item: CraftItem, locale: Locale): string {
  const base = POOLS[item.base].baseName[locale];
  if (item.bricked) return BRICKED.name[locale];

  switch (item.rarity) {
    case "normal":
      return locale === "pt" ? `${base} em Branco` : `Blank ${base}`;
    case "rare": {
      const [adj, noun] = item.rareName ?? [0, 0];
      return `${RARE_NAME_PARTS.adjectives[adj]} ${RARE_NAME_PARTS.nouns[noun]}`;
    }
    case "magic":
    case "unique": {
      const prefix = item.affixes.find((x) => x.kind === "prefix");
      const suffix = item.affixes.find((x) => x.kind === "suffix");
      const p = prefix ? getAffix(prefix.id).name[locale] : "";
      const s = suffix ? getAffix(suffix.id).name[locale] : "";
      // Portuguese adjectives follow the noun: "Relatório de Bug Urgente de Sexta-feira".
      const parts = locale === "pt" ? [base, p, s] : [p, base, s];
      return parts.filter(Boolean).join(" ");
    }
  }
}

const RARITY_LABEL: Record<Locale, Record<CraftItem["rarity"], string>> = {
  en: { normal: "Normal", magic: "Magic", rare: "Rare", unique: "Unique" },
  pt: { normal: "Normal", magic: "Mágico", rare: "Raro", unique: "Único" },
};

export function rarityLabel(rarity: CraftItem["rarity"], locale: Locale): string {
  return RARITY_LABEL[locale][rarity];
}

/** Screen-reader summary of the full item state. */
export function itemSummary(view: ItemView, locale: Locale): string {
  const lines = [
    `${view.name}, ${view.baseName}`,
    rarityLabel(view.rarity, locale),
    view.implicit,
    ...view.uniqueLines,
    ...view.groups.flatMap((g) => g.lines.map((l) => l.text)),
    view.corrupted ? (locale === "pt" ? "Corrompido" : "Corrupted") : null,
  ];
  return lines.filter(Boolean).join(". ") + ".";
}

/** Plain-text item block in the ARPG clipboard format (Ctrl+C on an item). */
export function itemToText(view: ItemView, itemClass: string, locale: Locale): string {
  const sep = "--------";
  const blocks: string[][] = [
    [`Item Class: ${itemClass}`, `Rarity: ${rarityLabel(view.rarity, locale)}`, view.name, view.baseName],
  ];
  if (view.implicit) blocks.push([view.implicit]);
  const mods = [...view.uniqueLines, ...view.groups.flatMap((g) => g.lines.map((l) => l.text))];
  if (mods.length) blocks.push(mods);
  if (view.corrupted) blocks.push([locale === "pt" ? "Corrompido" : "Corrupted"]);
  return blocks.map((b) => b.join("\n")).join(`\n${sep}\n`);
}
