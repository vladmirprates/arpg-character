import type { L } from "../i18n/types";

export interface Skill {
  id: string;
  hotkey: "Q" | "W" | "E" | "R" | "T";
  icon: string;
  /** Icon tint, matching the colour of the skill's on-page effect. */
  color: string;
  name: L;
  type: L;
  /** Coffee (mana) spent per cast. */
  cost: number;
  cooldownMs: number;
  /** Uses the same markup as equipment: [blue] {white} ((red)). */
  properties: L[];
  /** What the skill actually does on the page — kept short and literal. */
  lines: L[];
  flavor: L;
  /** Fallback line for the combat log when the skill reports nothing itself. */
  castLine: L;
  /** Extra screen effect on cast. */
  effect?: "shake" | "flash";
}

export const SKILLS: Skill[] = [
  {
    id: "inspect",
    hotkey: "Q",
    icon: "icons/skill1.svg",
    color: "#6cc8ff",
    name: { en: "Inspect Element", pt: "Inspecionar Elemento" },
    type: { en: "Intelligence Skill", pt: "Habilidade de Inteligência" },
    cost: 5,
    cooldownMs: 600,
    properties: [{ en: "[Cost: 5 Coffee] · Instant", pt: "[Custo: 5 Cafés] · Instantâneo" }],
    lines: [
      { en: "Opens an [element picker] over the page", pt: "Abre um [seletor de elementos] sobre a página" },
      { en: "Click the {glitch} to reveal it", pt: "Clique na {falha} para revelá-la" },
      { en: "Enter targets it · Esc cancels", pt: "Enter mira nela · Esc cancela" },
    ],
    flavor: {
      en: "It's not a bug, it's a feature... until I delete the div.",
      pt: "Não é bug, é feature... até eu apagar a div.",
    },
    castLine: { en: "You inspect the DOM.", pt: "Você inspeciona o DOM." },
  },
  {
    id: "capture",
    hotkey: "W",
    icon: "icons/skill2.svg",
    color: "#ffc94a",
    name: { en: "Capture Bug", pt: "Capturar Bug" },
    type: { en: "Dexterity Skill", pt: "Habilidade de Destreza" },
    cost: 10,
    cooldownMs: 2000,
    properties: [{ en: "[Cost: 10 Coffee] · Cooldown: 2s", pt: "[Custo: 10 Cafés] · Recarga: 2s" }],
    lines: [
      { en: "Nets a [revealed bug]", pt: "Captura um [bug revelado]" },
      { en: "Files a {ticket} with steps to reproduce", pt: "Abre um {ticket} com passos para reproduzir" },
      { en: "No revealed bug: ((fails, no Coffee spent))", pt: "Sem bug revelado: ((falha, sem gastar Café))" },
    ],
    flavor: { en: "Gotta catch 'em all.", pt: "Temos que pegar todos." },
    castLine: { en: "Bug captured.", pt: "Bug capturado." },
  },
  {
    id: "regression",
    hotkey: "E",
    icon: "icons/skill3.svg",
    color: "#5effa8",
    name: { en: "Automated Regression", pt: "Regressão Automatizada" },
    type: { en: "Spell Totem", pt: "Totem de Feitiço" },
    cost: 30,
    cooldownMs: 4000,
    properties: [{ en: "[Cost: 30 Coffee] · Cooldown: 4s", pt: "[Custo: 30 Cafés] · Recarga: 4s" }],
    lines: [
      { en: "Sweeps the page with a [scan beam]", pt: "Varre a página com um [feixe de scan]" },
      { en: "Reveals {every hidden bug}", pt: "Revela {todos os bugs escondidos}" },
      { en: "((1 test is always flaky))", pt: "((1 teste é sempre instável))" },
    ],
    flavor: {
      en: "If it happens once, it's an accident. If it happens twice, write a script.",
      pt: "Se acontece uma vez, é acidente. Se acontece duas, escreva um script.",
    },
    castLine: { en: "Regression suite started.", pt: "Suíte de regressão iniciada." },
    effect: "flash",
  },
  {
    id: "break-prod",
    hotkey: "R",
    icon: "icons/skill4.svg",
    color: "#ff4a3d",
    name: { en: "Break Production", pt: "Derrubar Produção" },
    type: { en: "Vaal Ultimate", pt: "Suprema Corrompida" },
    cost: 60,
    cooldownMs: 8000,
    properties: [
      { en: "[Cost: 60 Coffee] · Cooldown: 8s", pt: "[Custo: 60 Cafés] · Recarga: 8s" },
      { en: "((Souls per use: 1 Career))", pt: "((Almas por uso: 1 Carreira))" },
    ],
    lines: [
      {
        en: "Sounds the ((production alarm)) and shakes the screen",
        pt: "Dispara o ((alarme de produção)) e treme a tela",
      },
      { en: "[Up to 2 new bugs] escape into the page", pt: "[Até 2 novos bugs] escapam para a página" },
    ],
    flavor: { en: "I just wanted to see what this button does...", pt: "Eu só queria ver o que esse botão faz..." },
    castLine: { en: "PRODUCTION IS DOWN.", pt: "PRODUÇÃO CAIU." },
    effect: "shake",
  },
  {
    id: "teleport",
    hotkey: "T",
    icon: "icons/skill5.svg",
    color: "#6a7bff",
    name: { en: "Teleport to Meeting", pt: "Teleporte para Reunião" },
    type: { en: "Utility Spell", pt: "Feitiço Utilitário" },
    cost: 15,
    cooldownMs: 3000,
    properties: [{ en: "[Cost: 15 Coffee] · Duration: Too Long", pt: "[Custo: 15 Cafés] · Duração: Longa Demais" }],
    lines: [
      { en: "Pulls you into a {video call}", pt: "Puxa você para uma {chamada de vídeo}" },
      { en: "Lasts until you [leave the meeting]", pt: "Dura até você [sair da reunião]" },
      { en: 'Grants debuff: {"You\'re on mute"}', pt: 'Concede o debuff: {"Você está no mudo"}' },
    ],
    flavor: { en: "Could this have been an email?", pt: "Isso não podia ter sido um e-mail?" },
    castLine: { en: "You teleport into a meeting.", pt: "Você se teleporta para uma reunião." },
  },
];
