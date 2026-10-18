import type { CSSProperties } from "react";
import { EQUIPMENT, type EquipSlot } from "../../data/equipment";
import { DisplayItemCard, displayItemClipboard, displayItemText } from "../../components/ItemCard";
import { ItemSlot } from "../../components/ItemSlot";
import { useI18n } from "../../i18n/I18nProvider";
import { usePlanted } from "../bounty/BountyProvider";
import { REQUIREMENT_GAP } from "../bounty/plantedBugs";
import { CHARACTER } from "../../data/character";
import { levelAt } from "../../game/age";
import { RuneSigil } from "./RuneSigil";
import "./EquipmentPanel.css";

/**
 * Path of Exile 1 equipment layout on an 8 × 6 grid of equipment units, with PoE's real slot
 * sizes (weapon 2×4, helmet 2×2, body 2×3, gloves/boots 2×2, belt 2×1, rings/amulet 1×1).
 * The aura, charm and companion aren't PoE slots, so they sit symmetrically in the free cells:
 * aura mirrors the amulet, charm and companion flank the belt.
 *
 *     W W  a  H H  A  O O
 *     W W  .  H H  A  O O      (a = aura, A = amulet)
 *     W W  .  B B  .  O O
 *     W W  r  B B  r  O O      (r = rings)
 *     G G  .  B B  .  X X      (G = gloves, X = boots)
 *     G G  c  L L  p  X X      (L = belt, c = charm, p = companion)
 */
const LAYOUT: { slot: EquipSlot; x: number; y: number; w: number; h: number }[] = [
  { slot: "weapon1", x: 0, y: 0, w: 2, h: 4 },
  { slot: "helmet", x: 3, y: 0, w: 2, h: 2 },
  { slot: "amulet", x: 5, y: 1, w: 1, h: 1 },
  { slot: "aura", x: 2, y: 1, w: 1, h: 1 },
  { slot: "weapon2", x: 6, y: 0, w: 2, h: 4 },
  { slot: "chest", x: 3, y: 2, w: 2, h: 3 },
  { slot: "ring1", x: 2, y: 3, w: 1, h: 1 },
  { slot: "ring2", x: 5, y: 3, w: 1, h: 1 },
  { slot: "gloves", x: 0, y: 4, w: 2, h: 2 },
  { slot: "belt", x: 3, y: 5, w: 2, h: 1 },
  { slot: "charm", x: 2, y: 5, w: 1, h: 1 },
  { slot: "pet", x: 5, y: 5, w: 1, h: 1 },
  { slot: "boots", x: 6, y: 4, w: 2, h: 2 },
];

const FLASKS: EquipSlot[] = ["flask1", "flask2", "flask3", "flask4", "flask5"];

export function Equipment() {
  const { l } = useI18n();

  // Find the Bugs: while planted, the equipped helmet requires a higher level than the
  // character has (an impossible state).
  const requirement = usePlanted("requirement");
  const { level } = levelAt(CHARACTER.birthday, new Date());

  const slot = (id: EquipSlot, style?: CSSProperties) => {
    const base = EQUIPMENT[id];
    const item = id === "helmet" && requirement.planted ? { ...base, requiredLevel: level + REQUIREMENT_GAP } : base;
    const planted = id === "helmet" && requirement.planted ? "requirement" : undefined;
    return (
      <ItemSlot
        key={id}
        testId={`equip-${id}`}
        className={`equip__${id}`}
        planted={planted}
        shape="fill"
        style={style}
        icon={item.icon}
        glyph={item.gameIcon}
        rarity={item.rarity}
        label={l(item.name)}
        description={displayItemText(item, l)}
        tooltip={<DisplayItemCard item={item} />}
        placement="left"
        copyText={() => displayItemClipboard(item, l)}
      />
    );
  };

  return (
    <div className="equip">
      <RuneSigil className="equip__sigil" />
      <div className="equip__grid">
        {LAYOUT.map(({ slot: id, x, y, w, h }) =>
          slot(id, { gridColumn: `${x + 1} / span ${w}`, gridRow: `${y + 1} / span ${h}` }),
        )}
      </div>
      <div className="equip__flasks">{FLASKS.map((f) => slot(f))}</div>
    </div>
  );
}
