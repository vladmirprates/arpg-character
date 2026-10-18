export type Rarity = "normal" | "magic" | "rare" | "unique";
export type BaseType = "bug" | "testcase" | "script";
export const BASE_TYPES: readonly BaseType[] = ["bug", "testcase", "script"];

export type OrbId =
  "transmute" | "augmentation" | "alteration" | "regal" | "chaos" | "exalted" | "annulment" | "scouring" | "vaal";

export const ORB_IDS: readonly OrbId[] = [
  "transmute",
  "augmentation",
  "alteration",
  "regal",
  "chaos",
  "exalted",
  "annulment",
  "scouring",
  "vaal",
];

export type AffixKind = "prefix" | "suffix";

export interface Affix {
  kind: AffixKind;
  /** Key into the base's affix pool. */
  id: string;
}

/**
 * Crafted item state. Stores ids only (never display text) so it is
 * serialisable, locale-independent and cheap to compare in tests.
 */
export interface CraftItem {
  base: BaseType;
  rarity: Rarity;
  affixes: Affix[];
  implicitId: string | null;
  /** Indices into RARE_NAME_PARTS (adjective, noun) when Rare. */
  rareName: [number, number] | null;
  corrupted: boolean;
  /** Turned into the "Undocumented Feature" unique by a Deployment Orb. */
  bricked: boolean;
}

export type CraftError =
  | "corrupted"
  | "mustBeNormal"
  | "mustBeMagic"
  | "mustBeRare"
  | "magicMaxMods"
  | "maxMods"
  | "noMods"
  | "cannotCorrupt"
  | "alreadyNormal";

export type CorruptionOutcome = "implicit" | "reroll" | "brick";

export type CraftResult =
  | {
      ok: true;
      item: CraftItem;
      /** Affix ids that were added by this craft (for the "shine" effect). */
      added: string[];
      corruption?: CorruptionOutcome;
    }
  | { ok: false; error: CraftError };
