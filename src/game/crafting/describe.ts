import { localizer, type L, type Lang } from "../../i18n/types";
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

export function describeItem(item: CraftItem, lang: Lang): ItemView {
  const { l } = localizer(lang);
  const baseName = item.bricked ? l(BRICKED.name) : l(POOLS[item.base].baseName);
  const groups: AffixGroup[] = [];

  if (!item.bricked) {
    for (const kind of ["prefix", "suffix"] as const) {
      const list = item.affixes.filter((x) => x.kind === kind);
      if (list.length === 0) continue;
      groups.push({
        kind,
        count: list.length,
        limit: affixLimit(item.rarity),
        lines: list.map((x) => ({ id: x.id, text: l(getAffix(x.id).effect) })),
      });
    }
  }

  return {
    name: itemName(item, lang),
    baseName,
    rarity: item.rarity,
    implicit: item.bricked ? l(BRICKED.implicit) : item.implicitId ? l(getImplicit(item.implicitId)) : null,
    uniqueLines: item.bricked ? BRICKED.mods.map(l) : [],
    groups,
    corrupted: item.corrupted,
  };
}

const BLANK: L = { en: "Blank", pt: "em Branco" };

export function itemName(item: CraftItem, lang: Lang): string {
  const { locale, l } = localizer(lang);
  const base = l(POOLS[item.base].baseName);
  if (item.bricked) return l(BRICKED.name);

  switch (item.rarity) {
    case "normal":
      return locale === "pt" ? `${base} ${l(BLANK)}` : `${l(BLANK)} ${base}`;
    case "rare": {
      // Rare names stay in English in both languages: it's programmer jargon ("Null Exception"),
      // and Portuguese would need gendered forms of every adjective for every noun.
      const [adj, noun] = item.rareName ?? [0, 0];
      const name = `${RARE_NAME_PARTS.adjectives[adj]} ${RARE_NAME_PARTS.nouns[noun]}`;
      return l({ en: name, pt: name });
    }
    case "magic":
    case "unique": {
      const prefix = item.affixes.find((x) => x.kind === "prefix");
      const suffix = item.affixes.find((x) => x.kind === "suffix");
      const p = prefix ? l(getAffix(prefix.id).name) : "";
      const s = suffix ? l(getAffix(suffix.id).name) : "";
      // Portuguese adjectives follow the noun: "Relatório de Bug Urgente de Sexta-feira".
      const parts = locale === "pt" ? [base, p, s] : [p, base, s];
      return parts.filter(Boolean).join(" ");
    }
  }
}

const RARITY_LABEL: Record<CraftItem["rarity"], L> = {
  normal: { en: "Normal", pt: "Normal" },
  magic: { en: "Magic", pt: "Mágico" },
  rare: { en: "Rare", pt: "Raro" },
  unique: { en: "Unique", pt: "Único" },
};
const CORRUPTED: L = { en: "Corrupted", pt: "Corrompido" };

export function rarityLabel(rarity: CraftItem["rarity"], lang: Lang): string {
  return localizer(lang).l(RARITY_LABEL[rarity]);
}

/** Screen-reader summary of the full item state. */
export function itemSummary(view: ItemView, lang: Lang): string {
  const lines = [
    `${view.name}, ${view.baseName}`,
    rarityLabel(view.rarity, lang),
    view.implicit,
    ...view.uniqueLines,
    ...view.groups.flatMap((g) => g.lines.map((x) => x.text)),
    view.corrupted ? localizer(lang).l(CORRUPTED) : null,
  ];
  return lines.filter(Boolean).join(". ") + ".";
}

/** Plain-text item block in the ARPG clipboard format (Ctrl+C on an item). */
export function itemToText(view: ItemView, itemClass: string, lang: Lang): string {
  const sep = "--------";
  const blocks: string[][] = [
    [`Item Class: ${itemClass}`, `Rarity: ${rarityLabel(view.rarity, lang)}`, view.name, view.baseName],
  ];
  if (view.implicit) blocks.push([view.implicit]);
  const mods = [...view.uniqueLines, ...view.groups.flatMap((g) => g.lines.map((l) => l.text))];
  if (mods.length) blocks.push(mods);
  if (view.corrupted) blocks.push([localizer(lang).l(CORRUPTED)]);
  return blocks.map((b) => b.join("\n")).join(`\n${sep}\n`);
}
