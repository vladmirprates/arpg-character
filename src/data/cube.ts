import { openPlan } from "../game/idols/grid";
import type { DisplayItem } from "./equipment";
import type { Idol } from "./idols";

/**
 * The Triage Cube: a 2 × 2 item in the bag that opens into its own 4 × 4 grid, in the tradition of the
 * genre's great transmuting box. Drag items in and press Transmute: the right three currencies each
 * lose one from their stack and a new idol appears beside them. Each result can only be made once, so
 * the stacks below always cover every recipe and can't be run out.
 */
export const CUBE: DisplayItem = {
  id: "triage-cube",
  name: { en: "Triage Cube", pt: "Cubo de Triagem" },
  base: { en: "Cube · 2×2", pt: "Cubo · 2×2" },
  rarity: "unique",
  gameIcon: "cube",
  shape: { w: 2, h: 2 },
  mods: [
    {
      en: "Holds items in its own {4×4} grid",
      pt: "Guarda itens em sua própria grade {4×4}",
    },
    { en: "Its recipes are [undocumented]", pt: "Suas receitas [não têm documentação]" },
  ],
  flavor: { en: "Nobody remembers who filed it.", pt: "Ninguém lembra quem abriu o ticket." },
};

export const CUBE_PLAN = openPlan(4, 4);

export interface CubeRecipe {
  id: string;
  /** Three currency item ids, in any order. */
  inputs: readonly [string, string, string];
  /** The idol it makes: a 1 × 1 that goes on the board like any other. */
  result: Idol;
}

const BASE = { en: "Transmuted Idol · 1×1", pt: "Ídolo Transmutado · 1×1" };
const SHAPE = { w: 1, h: 1 };

export const CUBE_RECIPES: readonly CubeRecipe[] = [
  {
    id: "perfect-report",
    inputs: ["doc-scroll", "ticket-whetstone", "replication-mirror"],
    result: {
      id: "cube-perfect-report",
      name: { en: "The Perfect Bug Report", pt: "O Relatório de Bug Perfeito" },
      base: BASE,
      rarity: "unique",
      gameIcon: "stamper",
      shape: SHAPE,
      resists: { flaky: 2 },
      mods: [
        {
          en: "Clear steps, sharp evidence, reproduces {every time}",
          pt: "Passos claros, evidência afiada, reproduz {sempre}",
        },
      ],
      flavor: {
        en: "No developer has ever closed it as “works for me”.",
        pt: "Nenhum dev jamais fechou como “aqui funciona”.",
      },
    },
  },
  {
    id: "works-on-staging",
    inputs: ["env-orb", "hotfix-orb", "replication-mirror"],
    result: {
      id: "cube-works-on-staging",
      name: { en: "Works on Staging", pt: "Funciona em Staging" },
      base: BASE,
      rarity: "unique",
      gameIcon: "smoke-bomb",
      shape: SHAPE,
      resists: { fires: 2 },
      mods: [
        {
          en: "A fix copied everywhere except {the one environment that matters}",
          pt: "Uma correção copiada para todo lugar, menos {o único ambiente que importa}",
        },
      ],
    },
  },
  {
    id: "onboarding",
    inputs: ["doc-scroll", "env-orb", "ticket-whetstone"],
    result: {
      id: "cube-onboarding",
      name: { en: "Onboarding Guide", pt: "Guia de Onboarding" },
      base: BASE,
      rarity: "unique",
      gameIcon: "open-book",
      shape: SHAPE,
      resists: { scope: 2 },
      mods: [
        {
          en: "A working environment, written steps and a {first ticket}",
          pt: "Ambiente funcionando, passos escritos e um {primeiro ticket}",
        },
      ],
      flavor: { en: "New testers still don't believe it exists.", pt: "Testers novos ainda duvidam que exista." },
    },
  },
  {
    id: "postmortem",
    inputs: ["doc-scroll", "hotfix-orb", "ticket-whetstone"],
    result: {
      id: "cube-postmortem",
      name: { en: "Blameless Postmortem", pt: "Postmortem Sem Culpados" },
      base: BASE,
      rarity: "unique",
      gameIcon: "broken-skull",
      shape: SHAPE,
      resists: { fires: 2 },
      mods: [
        {
          en: "What broke, why, and what stops it {next time}",
          pt: "O que quebrou, por quê e o que impede da {próxima vez}",
        },
      ],
      flavor: { en: "Nobody gets cursed. Officially.", pt: "Ninguém é amaldiçoado. Oficialmente." },
    },
  },
];

export const CUBE_RESULTS: readonly Idol[] = CUBE_RECIPES.map((recipe) => recipe.result);

/** The recipe these items make, if any: order doesn't matter, and nothing extra may be in the cube. */
export function findRecipe(inputs: readonly string[]): CubeRecipe | null {
  if (inputs.length !== 3) return null;
  const key = [...inputs].sort().join("|");
  return CUBE_RECIPES.find((recipe) => [...recipe.inputs].sort().join("|") === key) ?? null;
}
