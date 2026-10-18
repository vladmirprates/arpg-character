import type { L } from "../../i18n/types";

/**
 * "Find the Bugs": five harmless bugs the visitor can plant. Two are visible states you have to
 * reason about; three are functional bugs that only show up when you use a feature — the kind
 * real QA work is about. While a hunt runs, every spot a bug has affected carries
 * data-planted-bug="<id>"; finding it with Inspect Element (Q) fixes the bug and files its report.
 */
export type Severity = "low" | "medium" | "high" | "critical";

export interface PlantedBug {
  id: string;
  title: L;
  severity: Severity;
  area: L;
  /** How to reproduce it — part of the report once found. */
  steps: L[];
  actual: L;
  expected: L;
  hint: L;
}

/** While the requirement bug is planted, the equipped helmet requires this many levels above the character. */
export const REQUIREMENT_GAP = 4;
/** What the Ticket Whetstone's tooltip claims while the stack bug is planted. */
export const BUGGY_STACK = 12;

export const PLANTED_BUGS: PlantedBug[] = [
  {
    id: "requirement",
    title: {
      en: "An item is equipped without meeting its level requirement",
      pt: "Item equipado sem cumprir o requisito de nível",
    },
    severity: "medium",
    area: { en: "Inventory → helmet", pt: "Inventário → elmo" },
    steps: [
      { en: "Note your level in the header", pt: "Observe seu nível no cabeçalho" },
      {
        en: "Hover the equipped helmet and read its requirements",
        pt: "Passe o mouse no elmo equipado e leia os requisitos",
      },
    ],
    actual: {
      en: "Crown of the Automator requires a higher level than the character has, yet it's equipped",
      pt: "A Coroa do Automatizador exige um nível maior que o do personagem, mas está equipada",
    },
    expected: {
      en: "Equipping is blocked until the character reaches the required level",
      pt: "Equipar fica bloqueado até o personagem atingir o nível exigido",
    },
    hint: {
      en: "Something is being worn that shouldn't be. Compare each item's requirements with your level.",
      pt: "Algo está sendo usado sem poder. Compare os requisitos de cada item com o seu nível.",
    },
  },
  {
    id: "stack",
    title: { en: "Stack size doesn't match its tooltip", pt: "Tamanho da pilha não bate com o tooltip" },
    severity: "medium",
    area: { en: "Inventory → bag → Ticket Whetstone", pt: "Inventário → mochila → Pedra de Afiar Tickets" },
    steps: [
      {
        en: "Find the Ticket Whetstone in the bag (stack of 20)",
        pt: "Ache a Pedra de Afiar Tickets na mochila (pilha de 20)",
      },
      { en: "Hover it and read “Stack Size”", pt: "Passe o mouse e leia “Tamanho da Pilha”" },
    ],
    actual: {
      en: "The slot shows a stack of 20, but the tooltip says “Stack Size: 12/20”",
      pt: "A célula mostra uma pilha de 20, mas o tooltip diz “Tamanho da Pilha: 12/20”",
    },
    expected: { en: "Both show the same amount", pt: "Os dois mostram a mesma quantidade" },
    hint: {
      en: "The numbers on the bag's currency don't all agree. Hover them and compare.",
      pt: "Os números das moedas na mochila não batem. Passe o mouse e compare.",
    },
  },
  {
    id: "overdraft",
    title: { en: "Skills can be cast without enough Coffee", pt: "Habilidades podem ser usadas sem Café suficiente" },
    severity: "high",
    area: { en: "Skill bar → Coffee", pt: "Barra de habilidades → Café" },
    steps: [
      {
        en: "Cast skills until Coffee runs low (e.g. R, then E)",
        pt: "Use habilidades até o Café acabar (ex.: R, depois E)",
      },
      {
        en: "Cast one more skill that costs more than you have left",
        pt: "Use mais uma habilidade que custe mais do que resta",
      },
    ],
    actual: {
      en: "The skill is cast anyway and Coffee drops below zero",
      pt: "A habilidade é usada mesmo assim e o Café fica negativo",
    },
    expected: {
      en: "The cast is refused with “Not enough Coffee”",
      pt: "O uso é recusado com “Café insuficiente”",
    },
    hint: {
      en: "Spend more Coffee than you have. Then inspect what went wrong on the skill bar.",
      pt: "Gaste mais Café do que você tem. Depois inspecione o que deu errado na barra de habilidades.",
    },
  },
  {
    id: "stale-save",
    title: { en: "Keeping an item stashes the previous version", pt: "Guardar um item salva a versão anterior" },
    severity: "high",
    area: { en: "Crafting Bench → Keep item → Stash", pt: "Bancada de Criação → Guardar item → Baú" },
    steps: [
      { en: "Open the Crafting Bench and apply a few orbs", pt: "Abra a Bancada de Criação e aplique alguns orbes" },
      { en: "Press “Keep item”", pt: "Clique em “Guardar item”" },
      {
        en: "Hover the new stash item and compare it with what you crafted",
        pt: "Passe o mouse no novo item do baú e compare com o que você criou",
      },
    ],
    actual: {
      en: "The stashed item is missing the last orb you applied",
      pt: "O item guardado não tem o efeito do último orbe aplicado",
    },
    expected: {
      en: "The stash holds exactly the item that was on the bench",
      pt: "O baú guarda exatamente o item que estava na bancada",
    },
    hint: {
      en: "Craft something and keep it. Is what you saved really what you made?",
      pt: "Crie algo e guarde. O que foi salvo é mesmo o que você fez?",
    },
  },
  {
    id: "dupe",
    title: {
      en: "Ctrl+click duplicates items instead of moving them",
      pt: "Ctrl+clique duplica itens em vez de movê-los",
    },
    severity: "critical",
    area: { en: "Bag ↔ Stash", pt: "Mochila ↔ Baú" },
    steps: [
      {
        en: "Ctrl+click an item in the bag to send it to the stash",
        pt: "Ctrl+clique num item da mochila para enviá-lo ao baú",
      },
      { en: "Look at both containers", pt: "Olhe os dois recipientes" },
    ],
    actual: {
      en: "The item is in the stash and still in the bag: it now exists twice",
      pt: "O item está no baú e continua na mochila: agora existe em dobro",
    },
    expected: { en: "The item moves; only one copy exists", pt: "O item se move; só existe uma cópia" },
    hint: {
      en: "Move items between the bag and the stash with the quick shortcut, then count them.",
      pt: "Mova itens entre a mochila e o baú com o atalho rápido, e depois conte.",
    },
  },
];

export const PLANTED_IDS = new Set(PLANTED_BUGS.map((b) => b.id));

/** What the visible planted bugs show while a hunt is running. */
export const BUGGY = {
  stack: { en: `Stack Size: {${BUGGY_STACK}/20}`, pt: `Tamanho da Pilha: {${BUGGY_STACK}/20}` } satisfies L,
};
