import { EMPOWERED_PERCENT, parsePlan, type GridPlan, type Shape } from "../game/idols/grid";
import type { L } from "../i18n/types";
import type { DisplayItem } from "./equipment";

/**
 * Idols: small specialties slotted into a 5 × 5 board. More of them exist than fit comfortably, so
 * arranging them is a real choice, and their resistances count on the character sheet.
 * Altars go in the socket above the board and change which of its cells are open or empowered.
 */
export interface Idol extends DisplayItem {
  shape: Shape;
}

export interface Altar extends DisplayItem {
  plan: GridPlan;
}

const sized = ({ w, h }: Shape): L => ({ en: `Idol · ${w}×${h}`, pt: `Ídolo · ${w}×${h}` });

const idol = (shape: Shape, item: Omit<Idol, "shape" | "base">): Idol => ({ ...item, shape, base: sized(shape) });

export const IDOLS: readonly Idol[] = [
  idol(
    { w: 1, h: 3 },
    {
      id: "idol-regression",
      requiredLevel: 18,
      name: { en: "Idol of Regression", pt: "Ídolo da Regressão" },
      rarity: "rare",
      gameIcon: "recycle",
      resists: { fires: 4 },
      mods: [{ en: "Old bugs stay {dead}", pt: "Bugs antigos continuam {mortos}" }],
      flavor: { en: "It worked last sprint.", pt: "Funcionava na sprint passada." },
    },
  ),
  idol(
    { w: 2, h: 2 },
    {
      id: "idol-exploration",
      requiredLevel: 20,
      name: { en: "Idol of Exploration", pt: "Ídolo da Exploração" },
      rarity: "rare",
      gameIcon: "compass",
      resists: { scope: 6 },
      mods: [{ en: "Finds what the {test plan} never asked", pt: "Acha o que o {plano de testes} nunca perguntou" }],
      flavor: { en: "What happens if I click this twice?", pt: "E se eu clicar nisso duas vezes?" },
    },
  ),
  idol(
    { w: 3, h: 1 },
    {
      id: "idol-localization",
      requiredLevel: 16,
      name: { en: "Idol of Localization", pt: "Ídolo da Localização" },
      rarity: "magic",
      gameIcon: "globe",
      resists: { scope: 5 },
      mods: [
        {
          en: "Strings no longer overflow in {Portuguese}",
          pt: "Textos não estouram mais em {português}",
        },
      ],
    },
  ),
  idol(
    { w: 1, h: 1 },
    {
      id: "idol-reproduction",
      requiredLevel: 8,
      name: { en: "Idol of Reproduction Steps", pt: "Ídolo dos Passos de Reprodução" },
      rarity: "magic",
      gameIcon: "notebook",
      resists: { flaky: 2 },
      mods: [{ en: "{+1} to Reproduction Rate", pt: "{+1} de Taxa de Reprodução" }],
    },
  ),
  idol(
    { w: 2, h: 1 },
    {
      id: "idol-hotfix",
      requiredLevel: 14,
      name: { en: "Idol of the Hotfix", pt: "Ídolo do Hotfix" },
      rarity: "magic",
      gameIcon: "flame",
      resists: { fires: 2 },
      mods: [{ en: "Calm under {Friday} deploys", pt: "Calma em deploys de {sexta-feira}" }],
    },
  ),
  idol(
    { w: 1, h: 2 },
    {
      id: "idol-telemetry",
      requiredLevel: 15,
      name: { en: "Idol of Telemetry", pt: "Ídolo da Telemetria" },
      rarity: "magic",
      gameIcon: "histogram",
      resists: { fires: 2 },
      mods: [{ en: "Sees the {frame drop} before the players do", pt: "Vê a {queda de FPS} antes dos jogadores" }],
    },
  ),
  idol(
    { w: 1, h: 4 },
    {
      id: "idol-playthrough",
      requiredLevel: 22,
      name: { en: "Idol of the Full Playthrough", pt: "Ídolo da Campanha Completa" },
      rarity: "rare",
      gameIcon: "treasure-map",
      resists: { flaky: 3 },
      mods: [{ en: "Tests the game the way {players} play it", pt: "Testa o jogo como os {jogadores} jogam" }],
      flavor: { en: "Act I to credits, again.", pt: "Do Ato I aos créditos, de novo." },
    },
  ),
  idol(
    { w: 4, h: 1 },
    {
      id: "idol-release",
      requiredLevel: 24,
      name: { en: "Idol of Release Day", pt: "Ídolo do Dia do Lançamento" },
      rarity: "rare",
      gameIcon: "rocket",
      resists: { fires: 2, scope: 4 },
      mods: [{ en: "Holds the {go / no-go} line", pt: "Segura a decisão de {go / no-go}" }],
      flavor: { en: "Ship it. But read the report first.", pt: "Pode lançar. Mas leia o relatório antes." },
    },
  ),
  idol(
    { w: 1, h: 2 },
    {
      id: "idol-cassandra",
      requiredLevel: 19,
      name: { en: "Cassandra's Warning", pt: "O Aviso de Cassandra" },
      rarity: "unique",
      gameIcon: "eye-shield",
      resists: { fires: 2 },
      mods: [{ en: "Predicts every outage. {Believed by no one.}", pt: "Prevê toda queda. {Ninguém acredita.}" }],
      flavor: { en: "I did file a ticket.", pt: "Eu abri um ticket." },
    },
  ),
  idol(
    { w: 2, h: 1 },
    {
      id: "idol-sisyphus",
      requiredLevel: 17,
      name: { en: "Sisyphus's Retry Loop", pt: "O Loop de Sísifo" },
      rarity: "unique",
      gameIcon: "cycle",
      resists: { flaky: 2 },
      mods: [{ en: "Reruns the flaky test. {Again.}", pt: "Roda o teste instável. {De novo.}" }],
      flavor: { en: "One must imagine the pipeline green.", pt: "É preciso imaginar a pipeline verde." },
    },
  ),
  idol(
    { w: 1, h: 1 },
    {
      id: "idol-patch-notes",
      requiredLevel: 6,
      name: { en: "Idol of the Patch Notes", pt: "Ídolo das Notas de Atualização" },
      rarity: "magic",
      gameIcon: "scroll-unfurled",
      resists: { scope: 3 },
      mods: [{ en: "Reads {every} line, including the small ones", pt: "Lê {todas} as linhas, até as pequenas" }],
    },
  ),
];

/** The board with no altar in the socket: a 5 × 5 grid with its corners and centre blocked, leaving 20 cells. */
export const BASE_PLAN = parsePlan(["#...#", ".....", "..#..", ".....", "#...#"]);

export const ALTARS: readonly Altar[] = [
  {
    id: "altar-hourglass",
    requiredLevel: 20,
    name: { en: "Altar of the Hourglass", pt: "Altar da Ampulheta" },
    base: { en: "Altar", pt: "Altar" },
    rarity: "unique",
    gameIcon: "hourglass",
    mods: [
      { en: "Narrows the board at its {waist}", pt: "Estreita o tabuleiro no {centro}" },
      {
        en: `{Empowered cells:} an idol on one gains [+${EMPOWERED_PERCENT}%] to its resistances`,
        pt: `{Células fortalecidas:} um ídolo nelas ganha [+${EMPOWERED_PERCENT}%] nas resistências`,
      },
    ],
    flavor: { en: "Less room, more pressure.", pt: "Menos espaço, mais pressão." },
    plan: parsePlan([".....", "#.*.#", "##*##", "#.*.#", "....."]),
  },
  {
    id: "altar-crossroads",
    requiredLevel: 20,
    name: { en: "Altar of the Crossroads", pt: "Altar da Encruzilhada" },
    base: { en: "Altar", pt: "Altar" },
    rarity: "unique",
    gameIcon: "stone-tower",
    mods: [
      { en: "Keeps the board {open}", pt: "Mantém o tabuleiro {aberto}" },
      {
        en: `{Empowered cells:} an idol on one gains [+${EMPOWERED_PERCENT}%] to its resistances`,
        pt: `{Células fortalecidas:} um ídolo nelas ganha [+${EMPOWERED_PERCENT}%] nas resistências`,
      },
    ],
    flavor: { en: "Every path gets tested eventually.", pt: "Todo caminho é testado um dia." },
    plan: parsePlan(["#.*.#", ".....", "*.#.*", ".....", "#.*.#"]),
  },
];

/** The socketed altar in the default arrangement. */
export const STARTING_ALTAR = "altar-crossroads";

/** The board's default arrangement (with that altar socketed). One cell stays free. */
export const STARTING_IDOLS: readonly { id: string; index: number }[] = [
  { id: "idol-playthrough", index: 1 },
  { id: "idol-exploration", index: 2 },
  { id: "idol-patch-notes", index: 5 },
  { id: "idol-regression", index: 9 },
  { id: "idol-cassandra", index: 10 },
  { id: "idol-reproduction", index: 17 },
  { id: "idol-telemetry", index: 18 },
  { id: "idol-sisyphus", index: 21 },
];

/** Where the rest start in the 12 × 5 bag; the currency fills its top row from the left. */
export const STARTING_BAG: readonly { id: string; index: number }[] = [
  { id: "altar-hourglass", index: 23 },
  { id: "idol-hotfix", index: 34 },
  { id: "triage-cube", index: 36 },
  { id: "idol-localization", index: 45 },
  { id: "idol-release", index: 56 },
];
