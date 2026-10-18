import type { L } from "../i18n/types";

export const CHARACTER = {
  name: "Vladmir Prates",
  className: { en: "QA Engineer", pt: "Engenheiro de QA" } satisfies L,
  /** Level and experience come from my age: see game/age.ts. */
  birthday: { year: 2000, month: 5, day: 23 },
  levelTitle: { en: "Mid-Level", pt: "Pleno" } satisfies L,
};

/**
 * Attributes: one per main region of the passive tree (Manual Testing → Str, Test Automation → Int,
 * Strategy & Leadership → Dex, Game Testing → Wis). Values are computed in game/stats.ts:
 * BASE_ATTRIBUTE plus whatever the published "My Build" allocates.
 */
export type AttributeId = "automation" | "manual" | "process" | "gamesense";
export type AttributeTone = "int" | "str" | "dex" | "wis";
export const BASE_ATTRIBUTE = 20;

export const ATTRIBUTES: { id: AttributeId; tone: AttributeTone; label: L; short: L }[] = [
  { id: "automation", tone: "int", label: { en: "Automation", pt: "Automação" }, short: { en: "Int", pt: "Int" } },
  { id: "manual", tone: "str", label: { en: "Manual", pt: "Manual" }, short: { en: "Str", pt: "For" } },
  { id: "process", tone: "dex", label: { en: "Process", pt: "Processo" }, short: { en: "Dex", pt: "Des" } },
  {
    id: "gamesense",
    tone: "wis",
    label: { en: "Game Sense", pt: "Senso de Jogo" },
    short: { en: "Wis", pt: "Sab" },
  },
];

/** Resistances: summed from the equipped items' mods (game/stats.ts), capped like PoE's. */
export type ResistId = "spaghetti" | "fires" | "deadlines" | "scope" | "flaky";
export type ResistTone = "chaos" | "fire" | "lightning" | "cold" | "physical";
export const RESIST_CAP = 75;

export const RESISTANCES: { id: ResistId; tone: ResistTone; label: L; desc: L }[] = [
  {
    id: "spaghetti",
    tone: "chaos",
    label: { en: "Spaghetti Code", pt: "Código Espaguete" },
    desc: {
      en: "Staying effective in tangled, undocumented legacy code: still finding what broke, and why.",
      pt: "Manter a eficácia em código legado confuso e sem documentação: achar o que quebrou, e por quê.",
    },
  },
  {
    id: "fires",
    tone: "fire",
    label: { en: "Production Fires", pt: "Incêndios em Produção" },
    desc: {
      en: "Staying calm and methodical when production breaks: reproduce, isolate, verify the hotfix.",
      pt: "Manter a calma e o método quando a produção quebra: reproduzir, isolar, validar o hotfix.",
    },
  },
  {
    id: "deadlines",
    tone: "lightning",
    label: { en: "Tight Deadlines", pt: "Prazos Apertados" },
    desc: {
      en: "Keeping quality high when the release date won't move, by testing what matters most first.",
      pt: "Manter a qualidade quando a data da release não muda, testando primeiro o que mais importa.",
    },
  },
  {
    id: "scope",
    tone: "cold",
    label: { en: "Scope Creep", pt: "Aumento de Escopo" },
    desc: {
      en: "Keeping the test plan intact when requirements keep growing, and flagging the new risk early.",
      pt: "Manter o plano de testes de pé quando os requisitos não param de crescer, e sinalizar o risco cedo.",
    },
  },
  {
    id: "flaky",
    tone: "physical",
    label: { en: "Flaky Tests", pt: "Testes Instáveis" },
    desc: {
      en: "Telling real failures from noise, and getting flaky tests fixed instead of re-run.",
      pt: "Separar falhas reais de ruído, e fazer testes instáveis serem corrigidos em vez de reexecutados.",
    },
  },
];

export const SOCIALS = [
  { id: "github", label: "GitHub", href: "https://github.com/vladmirprates/arpg-character" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/vladmirprates/" },
] as const;

/** Life / mana globes on the action bar. */
export const RESOURCES = {
  sanity: { max: 100, current: 72 },
  coffee: { max: 100, regenPerSecond: 4 },
};
