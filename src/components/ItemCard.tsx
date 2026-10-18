import { Fragment, type ReactNode } from "react";
import { resistLines } from "../game/stats";
import type { DisplayItem, ItemRarity } from "../data/equipment";
import { requirementLine } from "../data/equipment";
import type { ItemView } from "../game/crafting/describe";
import { useI18n } from "../i18n/I18nProvider";
import { Markup, plainText } from "./Markup";
import "./ItemCard.css";

interface CardProps {
  rarity: ItemRarity;
  name: string;
  base: string;
  /** Blocks separated by ornamental dividers. Empty blocks are skipped. */
  blocks: ReactNode[];
  flavor?: string;
  corrupted?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function ItemCard({ rarity, name, base, blocks, flavor, corrupted, footer, className = "" }: CardProps) {
  const { t } = useI18n();
  const shown = blocks.filter(Boolean);
  return (
    <div className={`item-card rarity-${rarity} ${corrupted ? "is-corrupted" : ""} ${className}`}>
      <header className="item-card__header">
        <span className="item-card__name">{name}</span>
        {base !== name && <span className="item-card__base">{base}</span>}
      </header>
      <div className="item-card__body">
        {shown.map((block, i) => (
          <Fragment key={i}>
            {i > 0 && <div className="item-card__sep" role="presentation" />}
            {block}
          </Fragment>
        ))}
        {flavor && <p className="item-card__flavor">{flavor}</p>}
        {corrupted && <p className="item-card__corrupted">{t("item.corrupted")}</p>}
      </div>
      {footer && <footer className="item-card__footer">{footer}</footer>}
    </div>
  );
}

/** Card for a static, hand-written item (equipment, backpack). */
export function DisplayItemCard({ item }: { item: DisplayItem }) {
  const { l, t } = useI18n();
  const lines = (list?: DisplayItem["mods"], cls = "") =>
    list?.length ? (
      <div className={cls}>
        {list.map((line, i) => (
          <p key={i}>
            <Markup text={l(line)} />
          </p>
        ))}
      </div>
    ) : null;

  return (
    <ItemCard
      rarity={item.rarity}
      name={l(item.name)}
      base={l(item.base)}
      blocks={[
        lines(item.properties, "item-card__props"),
        lines(item.requiredLevel ? [requirementLine(item.requiredLevel)] : [], "item-card__reqs"),
        lines([...(item.mods ?? []), ...resistLines(item)], "item-card__mods"),
      ]}
      flavor={item.flavor && l(item.flavor)}
      footer={<span className="item-card__hint">{t("item.copyHint")}</span>}
    />
  );
}

/** Card for a crafted item (bench, stash). */
export function CraftedItemCard({
  view,
  footer,
  shine = [],
}: {
  view: ItemView;
  footer?: ReactNode;
  shine?: string[];
}) {
  const { t } = useI18n();
  const groups =
    view.groups.length || view.uniqueLines.length ? (
      <div className="item-card__mods item-card__mods--crafted">
        {view.uniqueLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {view.groups.map((g) => (
          <div key={g.kind} className="affix-group">
            <p className="affix-group__label">
              {t(g.kind === "prefix" ? "bench.prefixes" : "bench.suffixes")}{" "}
              <span>
                {g.count}/{g.limit}
              </span>
            </p>
            {g.lines.map((line) => (
              <p key={line.id} className={shine.includes(line.id) ? "mod-shine" : undefined}>
                {line.text}
              </p>
            ))}
          </div>
        ))}
      </div>
    ) : (
      <p className="item-card__empty">{t("bench.noProps")}</p>
    );

  return (
    <ItemCard
      rarity={view.rarity}
      name={view.name}
      base={view.baseName}
      blocks={[view.implicit ? <p className="item-card__implicit">{view.implicit}</p> : null, groups]}
      corrupted={view.corrupted}
      footer={footer}
    />
  );
}

/** Plain-text description of a display item (screen readers, clipboard). */
export function displayItemText(item: DisplayItem, l: (x: DisplayItem["name"]) => string): string {
  return [
    l(item.name),
    l(item.base),
    ...(item.properties ?? []).map((p) => plainText(l(p))),
    ...(item.requiredLevel ? [plainText(l(requirementLine(item.requiredLevel)))] : []),
    ...(item.mods ?? []).map((m) => plainText(l(m))),
    ...resistLines(item).map((m) => plainText(l(m))),
    item.flavor ? `“${l(item.flavor)}”` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

/** ARPG clipboard block for a display item (Ctrl+C). */
export function displayItemClipboard(item: DisplayItem, l: (x: DisplayItem["name"]) => string): string {
  const rarity = item.rarity[0]!.toUpperCase() + item.rarity.slice(1);
  const blocks = [
    [`Item Class: ${l(item.base)}`, `Rarity: ${rarity}`, l(item.name), l(item.base)],
    (item.properties ?? []).map((p) => plainText(l(p))),
    item.requiredLevel ? [plainText(l(requirementLine(item.requiredLevel)))] : [],
    [...(item.mods ?? []), ...resistLines(item)].map((m) => plainText(l(m))),
    item.flavor ? [l(item.flavor)] : [],
  ].filter((b) => b.length > 0);
  return blocks.map((b) => b.join("\n")).join("\n--------\n");
}
