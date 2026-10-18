import type { L } from "../../i18n/types";

export type Priority = "Highest" | "High" | "Medium" | "Low";

export interface Species {
  id: string;
  /** game-icons.net icon (bundled by scripts/extract-tree-icons.mjs). */
  icon: string;
  /** CSS-ish selector shown by Inspect Element, e.g. div.heisenbug */
  selector: string;
  name: L;
  /** Ticket title; {panel} is replaced by where it was caught. */
  title: L;
  priority: Priority;
  severity: L;
  actual: L;
  /** Crawl speed in px/s. */
  speed: number;
}

export const SPECIES: Species[] = [
  {
    id: "heisenbug",
    icon: "alien-bug",
    selector: "div.heisenbug",
    name: { en: "Heisenbug", pt: "Heisenbug" },
    title: { en: "Heisenbug lurking behind the {panel} panel", pt: "Heisenbug escondido atrás do painel {panel}" },
    priority: "High",
    severity: { en: "Major", pt: "Grave" },
    actual: {
      en: "Moves faster whenever nobody is looking at it",
      pt: "Anda mais rápido sempre que ninguém está olhando",
    },
    speed: 70,
  },
  {
    id: "race",
    icon: "long-antennae-bug",
    selector: "span.race-condition",
    name: { en: "Race Condition", pt: "Condição de Corrida" },
    title: {
      en: "Race condition crawling near the {panel} panel",
      pt: "Condição de corrida rastejando perto do painel {panel}",
    },
    priority: "Highest",
    severity: { en: "Critical", pt: "Crítica" },
    actual: {
      en: "Arrives before it was spawned, about 1 time in 3",
      pt: "Chega antes de ter sido criado, cerca de 1 em cada 3 vezes",
    },
    speed: 95,
  },
  {
    id: "leak",
    icon: "beetle-shell",
    selector: "div.memory-leak",
    name: { en: "Memory Leak", pt: "Vazamento de Memória" },
    title: {
      en: "Memory leak growing beside the {panel} panel",
      pt: "Vazamento de memória crescendo ao lado do painel {panel}",
    },
    priority: "Medium",
    severity: { en: "Major", pt: "Grave" },
    actual: {
      en: "Gets slightly bigger every time you look away",
      pt: "Fica um pouco maior toda vez que você desvia o olhar",
    },
    speed: 35,
  },
  {
    id: "off-by-one",
    icon: "ladybug",
    selector: "li.off-by-one",
    name: { en: "Off-by-One Error", pt: "Erro de Off-by-One" },
    title: {
      en: "Off-by-one error one pixel away from the {panel} panel",
      pt: "Erro off-by-one a um pixel do painel {panel}",
    },
    priority: "Low",
    severity: { en: "Minor", pt: "Menor" },
    actual: {
      en: "Always one slot to the left of where it should be",
      pt: "Sempre um espaço à esquerda de onde deveria estar",
    },
    speed: 55,
  },
  {
    id: "null",
    icon: "scarab-beetle",
    selector: "null.pointer",
    name: { en: "Null Pointer", pt: "Ponteiro Nulo" },
    title: {
      en: "Null pointer dereferenced under the {panel} panel",
      pt: "Ponteiro nulo desreferenciado sob o painel {panel}",
    },
    priority: "High",
    severity: { en: "Critical", pt: "Crítica" },
    actual: {
      en: "Cannot read properties of undefined (reading 'bug')",
      pt: "Cannot read properties of undefined (reading 'bug')",
    },
    speed: 60,
  },
];

/** Bundled UI icons for the hunt (net, muted mic). Kept here so the icon extractor picks them up. */
export const HUNT_ICONS = { netIcon: "bug-net", muteIcon: "mute" } as const;
