import type { AchievementRule } from "../game/achievements";
import type { L } from "../i18n/types";
import { PLANTED_BUGS } from "../features/bounty/plantedBugs";
import { RECOMMENDATIONS } from "./recommendations";

export interface Achievement extends AchievementRule {
  title: L;
  description: L;
  /** game-icons.net name (bundled by scripts/extract-tree-icons.mjs). */
  icon: string;
}

/** Challenges, PoE-league style. Each one is a rule over the gameplay event stream (game/events.ts). */
export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-blood",
    icon: "bug-net",
    title: { en: "First Blood", pt: "Primeiro Sangue" },
    description: { en: "Report your first planted bug", pt: "Reporte o seu primeiro bug plantado" },
    match: (e) => e.type === "bug.found",
  },
  {
    id: "exterminator",
    icon: "spider-web",
    title: { en: "Exterminator", pt: "Exterminador" },
    description: {
      en: `Find all ${PLANTED_BUGS.length} planted bugs in one hunt`,
      pt: `Encontre os ${PLANTED_BUGS.length} bugs plantados em uma caçada`,
    },
    match: (e) => e.type === "bounty.complete",
  },
  {
    id: "rare-find",
    icon: "cut-diamond",
    title: { en: "Rare Find", pt: "Achado Raro" },
    description: { en: "Craft a Rare item at the bench", pt: "Crie um item Raro na bancada" },
    match: (e) => e.type === "craft" && e.rarity === "rare" && !e.corruption,
  },
  {
    id: "vaal-it",
    icon: "cracked-mask",
    title: { en: "Vaal It", pt: "Vaal Nele" },
    description: { en: "Corrupt an item", pt: "Corrompa um item" },
    match: (e) => e.type === "craft" && e.corruption !== undefined,
  },
  {
    id: "undocumented",
    icon: "broken-skull",
    title: { en: "Undocumented Feature", pt: "Funcionalidade Não Documentada" },
    description: { en: "Brick an item with a corruption", pt: "Destrua um item com uma corrupção" },
    match: (e) => e.type === "craft" && e.corruption === "brick",
  },
  {
    id: "full-set",
    icon: "card-pickup",
    title: { en: "Full Set", pt: "Coleção Completa" },
    description: { en: "Read every divination card", pt: "Leia todas as cartas de adivinhação" },
    // Distinct card ids: rereading a card doesn't count twice.
    match: (e) => e.type === "card.read" && e.id,
    target: RECOMMENDATIONS.length,
  },
  {
    id: "price-check",
    icon: "price-tag",
    title: { en: "Price Check", pt: "Price Check" },
    description: { en: "Copy an item with Ctrl+C", pt: "Copie um item com Ctrl+C" },
    match: (e) => e.type === "item.copied",
  },
  {
    id: "polyglot",
    icon: "conversation",
    title: { en: "Polyglot", pt: "Poliglota" },
    description: { en: "Switch the language", pt: "Troque o idioma" },
    match: (e) => e.type === "locale.changed",
  },
  {
    id: "stretched",
    icon: "quill-ink",
    title: { en: "Ŝţŕéţçĥéð", pt: "Éšţîçåðö" },
    description: { en: "Turn on pseudo-localization", pt: "Ative a pseudolocalização" },
    match: (e) => e.type === "pseudo.enabled",
  },
  {
    id: "frame-counter",
    icon: "speedometer",
    title: { en: "Frame Counter", pt: "Contador de Quadros" },
    description: { en: "Open the performance overlay", pt: "Abra o overlay de performance" },
    match: (e) => e.type === "perf.opened",
  },
  {
    id: "couch-qa",
    icon: "gamepad",
    title: { en: "Couch QA", pt: "QA de Sofá" },
    description: { en: "Connect a controller", pt: "Conecte um controle" },
    match: (e) => e.type === "gamepad.connected",
  },
  {
    id: "gold-master",
    icon: "wax-seal",
    title: { en: "Gold Master", pt: "Gold Master" },
    description: { en: "Review the certification checklist", pt: "Revise o checklist de certificação" },
    match: (e) => e.type === "cert.opened",
  },
  {
    id: "completionist",
    icon: "laurel-crown",
    title: { en: "Completionist", pt: "Completista" },
    description: { en: "Unlock every other achievement", pt: "Desbloqueie todas as outras conquistas" },
    requiresAll: true,
  },
];
