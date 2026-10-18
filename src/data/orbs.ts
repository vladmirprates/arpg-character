import type { OrbId } from "../game/crafting/types";
import type { L } from "../i18n/types";

export type OrbTier = "magic" | "rare" | "neutral" | "corrupt";

export interface OrbDef {
  id: OrbId;
  tier: OrbTier;
  icon: string;
  name: L;
  desc: L;
}

export const ORBS: OrbDef[] = [
  {
    id: "transmute",
    tier: "magic",
    icon: "icons/crystal-ball.svg",
    name: { en: "Orb of Triage", pt: "Orbe da Triagem" },
    desc: { en: "Upgrades a Normal item to Magic", pt: "Transforma um item Normal em Mágico" },
  },
  {
    id: "augmentation",
    tier: "magic",
    icon: "icons/orb-direction.svg",
    name: { en: "Orb of Scope", pt: "Orbe do Escopo" },
    desc: { en: "Adds 1 modifier to a Magic item", pt: "Adiciona 1 modificador a um item Mágico" },
  },
  {
    id: "alteration",
    tier: "magic",
    icon: "icons/orbit.svg",
    name: { en: "Orb of Revision", pt: "Orbe da Revisão" },
    desc: { en: "Rerolls 1 Magic modifier", pt: "Rerrola 1 modificador Mágico" },
  },
  {
    id: "regal",
    tier: "rare",
    icon: "icons/orbital-rays.svg",
    name: { en: "Promotion Orb", pt: "Orbe da Promoção" },
    desc: { en: "Upgrades a Magic item to Rare", pt: "Transforma um item Mágico em Raro" },
  },
  {
    id: "chaos",
    tier: "rare",
    icon: "icons/orbital.svg",
    name: { en: "Entropy Orb", pt: "Orbe da Entropia" },
    desc: { en: "Rerolls 1 Rare modifier", pt: "Rerrola 1 modificador Raro" },
  },
  {
    id: "exalted",
    tier: "rare",
    icon: "icons/gold-shell.svg",
    name: { en: "Insight Orb", pt: "Orbe do Insight" },
    desc: { en: "Adds 1 modifier to a Rare item", pt: "Adiciona 1 modificador a um item Raro" },
  },
  {
    id: "annulment",
    tier: "neutral",
    icon: "icons/star-satellites.svg",
    name: { en: "Orb of Omission", pt: "Orbe da Omissão" },
    desc: { en: "Removes 1 modifier", pt: "Remove 1 modificador" },
  },
  {
    id: "scouring",
    tier: "neutral",
    icon: "icons/ubisoft-sun.svg",
    name: { en: "Revert Orb", pt: "Orbe da Reversão" },
    desc: { en: "Resets the item to its base", pt: "Restaura o item à sua base" },
  },
  {
    id: "vaal",
    tier: "corrupt",
    icon: "icons/double-ringed-orb.svg",
    name: { en: "Deployment Orb", pt: "Orbe do Deploy" },
    desc: { en: "Corrupts the item — unpredictable", pt: "Corrompe o item — imprevisível" },
  },
];

export const ORB_BY_ID = Object.fromEntries(ORBS.map((o) => [o.id, o])) as Record<OrbId, OrbDef>;
