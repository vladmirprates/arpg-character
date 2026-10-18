import type { L } from "../i18n/types";
import type { ResistId } from "./character";

export type ItemRarity = "normal" | "magic" | "rare" | "unique" | "corrupted";

/**
 * Display item. Text uses a tiny safe markup (rendered as React nodes, never as HTML):
 *   [text]   → augmented value (blue)
 *   {text}   → highlighted value (white)
 *   ((text)) → warning (red)
 */
export interface DisplayItem {
  id: string;
  name: L;
  base: L;
  rarity: ItemRarity;
  /** Image file (flasks). */
  icon?: string;
  /** game-icons.net art, drawn inline and tinted by rarity (bundled via scripts/extract-tree-icons.mjs). */
  gameIcon?: string;
  /** Header properties (Armour, Stack Size…), shown above the separator. */
  properties?: L[];
  mods?: L[];
  flavor?: L;
  /** Stack count shown on currency, PoE-style. */
  stack?: number;
  /** Level needed to equip it, shown PoE-style as "Requires Level N" (currency has none). */
  requiredLevel?: number;
  /** Resistance mods (percent). The character sheet's resistances are their sum. */
  resists?: Partial<Record<ResistId, number>>;
}

export type EquipSlot =
  | "weapon1"
  | "helmet"
  | "amulet"
  | "weapon2"
  | "ring1"
  | "chest"
  | "ring2"
  | "gloves"
  | "belt"
  | "boots"
  | "pet"
  | "charm"
  | "aura"
  | "flask1"
  | "flask2"
  | "flask3"
  | "flask4"
  | "flask5";

const icon = (name: string) => `icons/${name}`;

export const EQUIPMENT: Record<EquipSlot, DisplayItem> = {
  weapon1: {
    id: "null-pointer",
    requiredLevel: 24,
    name: { en: "The Null Pointer", pt: "O Ponteiro Nulo" },
    base: { en: "Automation Blade", pt: "Lâmina de Automação" },
    rarity: "unique",
    gameIcon: "pointy-sword",
    properties: [{ en: "Attacks per Second: {1.85}", pt: "Ataques por Segundo: {1,85}" }],
    mods: [
      { en: "Adds [10 to 20] Scripts per Commit", pt: "Adiciona [10 a 20] Scripts por Commit" },
      {
        en: "[100%] chance to catch [Null Reference Exceptions]",
        pt: "[100%] de chance de capturar [Null Reference Exceptions]",
      },
      { en: "Socketed Gems are supported by [Typescript]", pt: "Gemas Encaixadas são suportadas por [Typescript]" },
    ],
    flavor: { en: "Undefined is not a function.", pt: "Undefined is not a function." },
  },
  helmet: {
    id: "crown-automator",
    requiredLevel: 22,
    resists: { fires: 26, flaky: 18 },
    name: { en: "Crown of the Automator", pt: "Coroa do Automatizador" },
    base: { en: "QA Engineer Helmet", pt: "Elmo de Engenheiro de QA" },
    rarity: "unique",
    gameIcon: "crown",
    properties: [
      { en: "Experience Level: {Mid-Level}", pt: "Nível de Experiência: {Pleno}" },
      { en: "Quality: {+20%}", pt: "Qualidade: {+20%}" },
    ],
    mods: [
      {
        en: "Grants Level 20 [Playwright Automation] Skill",
        pt: "Concede a Habilidade [Automação com Playwright] Nível 20",
      },
      { en: "[100%] Increased Bug Detection Rate", pt: "[100%] de Taxa de Detecção de Bugs Aumentada" },
      { en: "Can execute [Functional Tests] autonomously", pt: "Executa [Testes Funcionais] de forma autônoma" },
      {
        en: "Reflects [Critical Issues] to Developers instantly",
        pt: "Reflete [Problemas Críticos] aos Devs instantaneamente",
      },
      { en: "Has [1 Abyssal Socket]", pt: "Possui [1 Engaste Abissal]" },
    ],
    flavor: {
      en: "Those who watch the code see what the creators chose to ignore.",
      pt: "Quem observa o código vê o que os criadores escolheram ignorar.",
    },
  },
  amulet: {
    id: "stackoverflow-star",
    requiredLevel: 18,
    resists: { fires: 20, flaky: 18 },
    name: { en: "StackOverflow Star", pt: "Estrela do StackOverflow" },
    base: { en: "Onyx Amulet", pt: "Amuleto de Ônix" },
    rarity: "unique",
    gameIcon: "gem-pendant",
    properties: [{ en: "{+30} to All Attributes", pt: "{+30} em Todos os Atributos" }],
    mods: [
      { en: "Grants [Copy/Paste Mastery]", pt: "Concede [Maestria em Copiar/Colar]" },
      { en: "Cannot be [Stunned] by Syntax Errors", pt: "Não pode ser [Atordoado] por Erros de Sintaxe" },
    ],
    flavor: { en: "Why reinvent the wheel?", pt: "Por que reinventar a roda?" },
  },
  weapon2: {
    id: "jira-board",
    requiredLevel: 20,
    resists: { deadlines: 25, scope: 22 },
    name: { en: "Jira Ticket Board", pt: "Quadro de Tickets do Jira" },
    base: { en: "Kanban Shield", pt: "Escudo Kanban" },
    rarity: "rare",
    gameIcon: "round-shield",
    properties: [{ en: "Chance to Block: {35%}", pt: "Chance de Bloqueio: {35%}" }],
    mods: [
      { en: "[+80] to Maximum Life (Work-Life Balance)", pt: "[+80] de Vida Máxima (Equilíbrio Vida-Trabalho)" },
      {
        en: "Reflects ['Works on My Machine'] excuses back to sender",
        pt: "Reflete desculpas de ['Funciona na Minha Máquina'] de volta ao remetente",
      },
      { en: "[20%] Reduced Meeting Duration", pt: "[20%] de Duração de Reuniões Reduzida" },
    ],
  },
  ring1: {
    id: "git-commit",
    requiredLevel: 12,
    resists: { spaghetti: 16, flaky: 18 },
    name: { en: "Git Commit", pt: "Git Commit" },
    base: { en: "Iron Ring", pt: "Anel de Ferro" },
    rarity: "magic",
    gameIcon: "ring",
    mods: [
      { en: "Adds {1-4} lines of clean code", pt: "Adiciona {1-4} linhas de código limpo" },
      { en: "{+20%} Rarity of bugs found", pt: "{+20%} de Raridade dos bugs encontrados" },
    ],
  },
  chest: {
    id: "jenkins-firewall",
    requiredLevel: 25,
    resists: { spaghetti: 30, deadlines: 30 },
    name: { en: "Jenkins Firewall", pt: "Firewall do Jenkins" },
    base: { en: "Astral Plate", pt: "Placa Astral" },
    rarity: "rare",
    gameIcon: "breastplate",
    properties: [{ en: "Armour: {1205}", pt: "Armadura: {1205}" }],
    mods: [
      { en: "[+100] to CI/CD Reliability", pt: "[+100] de Confiabilidade de CI/CD" },
      {
        en: "[15%] Physical Damage Reduction from Scope Creep",
        pt: "[15%] de Redução de Dano Físico de Aumento de Escopo",
      },
      { en: "Has 6 Linked Sockets (Pipeline Integration)", pt: "Possui 6 Engastes Ligados (Integração de Pipeline)" },
    ],
  },
  ring2: {
    id: "git-push",
    requiredLevel: 16,
    resists: { spaghetti: 16, deadlines: 23 },
    name: { en: "Git Push", pt: "Git Push" },
    base: { en: "Diamond Ring", pt: "Anel de Diamante" },
    rarity: "magic",
    gameIcon: "big-diamond-ring",
    mods: [
      { en: "{20%} increased Quantity of Features", pt: "{20%} de Quantidade de Features aumentada" },
      { en: "Curse Enemies with {Merge Conflict} on hit", pt: "Amaldiçoa Inimigos com {Conflito de Merge} ao acertar" },
    ],
  },
  gloves: {
    id: "manual-testers",
    requiredLevel: 14,
    resists: { scope: 24, flaky: 18 },
    name: { en: "Manual Testers", pt: "Testadores Manuais" },
    base: { en: "Silk Gloves", pt: "Luvas de Seda" },
    rarity: "magic",
    gameIcon: "gauntlet",
    properties: [{ en: "Energy Shield: {45}", pt: "Escudo de Energia: {45}" }],
    mods: [
      { en: "{+50} to Accuracy Rating", pt: "{+50} de Precisão" },
      { en: "Can spot {UI Misalignment} instantly", pt: "Detecta {Desalinhamento de UI} instantaneamente" },
    ],
  },
  belt: {
    id: "scrum-sash",
    requiredLevel: 19,
    resists: { scope: 15 },
    name: { en: "The Scrum Master's Sash", pt: "A Faixa do Scrum Master" },
    base: { en: "Leather Belt", pt: "Cinto de Couro" },
    rarity: "unique",
    gameIcon: "belt",
    properties: [{ en: "{+40} to maximum Life", pt: "{+40} de Vida máxima" }],
    mods: [
      { en: "[20%] increased Stand-up Speed", pt: "[20%] de Velocidade de Daily aumentada" },
      { en: "Immune to [Blockers] during Sprints", pt: "Imune a [Impedimentos] durante Sprints" },
      { en: "Steals [Time Estimates] from developers", pt: "Rouba [Estimativas de Tempo] dos devs" },
    ],
    flavor: { en: "Yesterday I did... Today I will do...", pt: "Ontem eu fiz... Hoje eu vou fazer..." },
  },
  boots: {
    id: "hotfix-striders",
    requiredLevel: 21,
    resists: { fires: 22, spaghetti: 20 },
    name: { en: "Hotfix Striders", pt: "Passadas do Hotfix" },
    base: { en: "Titan Greaves", pt: "Grevas de Titã" },
    rarity: "rare",
    gameIcon: "boots",
    properties: [{ en: "Armour: {220}", pt: "Armadura: {220}" }],
    mods: [
      { en: "[30%] Increased Movement Speed", pt: "[30%] de Velocidade de Movimento Aumentada" },
      { en: "Cannot be Slowed by [Legacy Code]", pt: "Não pode ser Desacelerado por [Código Legado]" },
    ],
  },
  pet: {
    id: "rubber-duck",
    requiredLevel: 8,
    name: { en: "Junior Rubber Duck", pt: "Patinho de Borracha Júnior" },
    base: { en: "Legendary Companion", pt: "Companheiro Lendário" },
    rarity: "unique",
    gameIcon: "duck",
    properties: [{ en: "Item Level: {100}", pt: "Nível do Item: {100}" }],
    mods: [
      { en: "Absorbs [50%] of Mental Stress", pt: "Absorve [50%] do Estresse Mental" },
      { en: "Listens to your logic problems without judgment", pt: "Ouve seus problemas de lógica sem julgar" },
      { en: "['Quack.']", pt: "['Quack.']" },
    ],
    flavor: { en: "A lonely QA's best friend.", pt: "O melhor amigo de um QA solitário." },
  },
  charm: {
    id: "self-taught-stone",
    requiredLevel: 10,
    name: { en: "Stone of the Self-Taught", pt: "Pedra do Autodidata" },
    base: { en: "Small Charm", pt: "Amuleto Pequeno" },
    rarity: "magic",
    gameIcon: "stone-tablet",
    mods: [
      { en: "{+20} to Critical Thinking", pt: "{+20} de Pensamento Crítico" },
      {
        en: "{50%} increased effectiveness of {Exploratory Testing}",
        pt: "{50%} de eficácia aumentada em {Testes Exploratórios}",
      },
      { en: "Immune to {'By the Book'} constraints", pt: "Imune a restrições {'Segundo o Manual'}" },
    ],
    flavor: {
      en: "I don't need a certificate to know it's broken.",
      pt: "Não preciso de certificado para saber que está quebrado.",
    },
  },
  aura: {
    id: "collab-aura",
    requiredLevel: 23,
    name: { en: "Collaboration Aura", pt: "Aura de Colaboração" },
    base: { en: "Passive Skill", pt: "Habilidade Passiva" },
    rarity: "rare",
    gameIcon: "magic-swirl",
    mods: [
      { en: "Grants [Empathy] to nearby allies", pt: "Concede [Empatia] a aliados próximos" },
      { en: "Reduces Developer hostility by [20%]", pt: "Reduz a hostilidade dos Devs em [20%]" },
      { en: "[Always Active]", pt: "[Sempre Ativa]" },
    ],
  },
  flask1: {
    id: "emergency-coffee",
    requiredLevel: 6,
    name: { en: "Emergency Coffee", pt: "Café de Emergência" },
    base: { en: "Unique Flask", pt: "Frasco Único" },
    rarity: "unique",
    icon: icon("flask1.svg"),
    properties: [{ en: "((Consumes 100% Sanity))", pt: "((Consome 100% da Sanidade))" }],
    mods: [
      {
        en: "Consumes [1] Charge on [Critical Bug] discovery.",
        pt: "Consome [1] Carga ao descobrir um [Bug Crítico].",
      },
      { en: "Grants [Immunity to Sleep] for 4 hours.", pt: "Concede [Imunidade ao Sono] por 4 horas." },
    ],
    flavor: {
      en: "Do not shake before use. Or do. I'm not a cop.",
      pt: "Não agite antes de usar. Ou agite. Não sou policial.",
    },
  },
  flask2: {
    id: "focus-flask",
    requiredLevel: 3,
    name: { en: "Flask of Focus", pt: "Frasco do Foco" },
    base: { en: "Utility Flask", pt: "Frasco Utilitário" },
    rarity: "magic",
    icon: icon("flask2.svg"),
    properties: [{ en: "Immune to [Slack Notifications]", pt: "Imune a [Notificações do Slack]" }],
    mods: [{ en: "{40%} Increased Coding Speed", pt: "{40%} de Velocidade de Código Aumentada" }],
  },
  flask3: {
    id: "dev-tears",
    requiredLevel: 12,
    name: { en: "Tears of the Devs", pt: "Lágrimas dos Devs" },
    base: { en: "Unique Flask", pt: "Frasco Único" },
    rarity: "unique",
    icon: icon("flask3.svg"),
    mods: [{ en: "Restores [Sanity] on use", pt: "Restaura a [Sanidade] ao usar" }],
  },
  flask4: {
    id: "diamond-flask",
    requiredLevel: 9,
    name: { en: "Diamond Flask", pt: "Frasco de Diamante" },
    base: { en: "Utility Flask", pt: "Frasco Utilitário" },
    rarity: "magic",
    icon: icon("flask4.svg"),
    properties: [{ en: "Immune to [Flaky Tests]", pt: "Imune a [Testes Instáveis]" }],
    mods: [{ en: "Your tests become {Lucky}", pt: "Seus testes ficam {Sortudos}" }],
  },
  flask5: {
    id: "quicksilver-flask",
    requiredLevel: 5,
    name: { en: "Quicksilver Flask", pt: "Frasco de Mercúrio" },
    base: { en: "Utility Flask", pt: "Frasco Utilitário" },
    rarity: "magic",
    icon: icon("flask5.svg"),
    properties: [{ en: "Immune to [Freeze]", pt: "Imune a [Congelamento]" }],
    mods: [
      { en: "{50%} Increased Test Execution Speed", pt: "{50%} de Velocidade de Execução de Testes Aumentada" },
      {
        en: "{40%} Increased Movement Speed towards the Exit on Fridays",
        pt: "{40%} de Velocidade de Movimento em direção à Saída às Sextas",
      },
    ],
  },
};

/** Items in the 12 × 5 inventory grid, filled left to right like freshly picked-up currency. */
export const BACKPACK: DisplayItem[] = [
  {
    id: "doc-scroll",
    name: { en: "Scroll of Documentation", pt: "Pergaminho da Documentação" },
    base: { en: "Currency", pt: "Moeda" },
    stack: 1,
    rarity: "magic",
    gameIcon: "tied-scroll",
    properties: [{ en: "Stack Size: {1/40}", pt: "Tamanho da Pilha: {1/40}" }],
    mods: [
      { en: "Identifies {Unwritten Rules} of the project.", pt: "Identifica as {Regras Não Escritas} do projeto." },
      {
        en: "Right click to learn {'How this feature actually works'}.",
        pt: "Clique direito para aprender {'Como essa feature realmente funciona'}.",
      },
    ],
    flavor: { en: "RTFM (Read The Fine Manual).", pt: "RTFM (Leia o Bendito Manual)." },
  },
  {
    id: "env-orb",
    name: { en: "Orb of Environment", pt: "Orbe do Ambiente" },
    base: { en: "Currency", pt: "Moeda" },
    stack: 10,
    rarity: "rare",
    gameIcon: "crystal-ball",
    properties: [{ en: "Stack Size: {10/10}", pt: "Tamanho da Pilha: {10/10}" }],
    mods: [
      {
        en: "Reforges a [Staging Environment] with new random data.",
        pt: "Reforja um [Ambiente de Staging] com novos dados aleatórios.",
      },
      {
        en: "Right click to wipe the database and [Restart the Docker Containers].",
        pt: "Clique direito para limpar o banco e [Reiniciar os Containers Docker].",
      },
    ],
    flavor: { en: "Have you tried turning it off and on again?", pt: "Já tentou desligar e ligar de novo?" },
  },
  {
    id: "hotfix-orb",
    name: { en: "Orb of Hotfix", pt: "Orbe do Hotfix" },
    base: { en: "Currency", pt: "Moeda" },
    stack: 1,
    rarity: "corrupted",
    gameIcon: "crystal-shine",
    properties: [{ en: "Stack Size: {1/10}", pt: "Tamanho da Pilha: {1/10}" }],
    mods: [
      {
        en: "Corrupts a [Pull Request], deploying it instantly.",
        pt: "Corrompe um [Pull Request], fazendo deploy na hora.",
      },
      {
        en: "[Unpredictable Outcome:] May fix the bug or bring down the Server.",
        pt: "[Resultado Imprevisível:] Pode corrigir o bug ou derrubar o Servidor.",
      },
    ],
    flavor: { en: "We'll test it in Production.", pt: "A gente testa em Produção." },
  },
  {
    id: "replication-mirror",
    name: { en: "Mirror of Replication", pt: "Espelho da Replicação" },
    base: { en: "Currency", pt: "Moeda" },
    stack: 1,
    rarity: "unique",
    gameIcon: "mirror-mirror",
    properties: [{ en: "Stack Size: {1/1}", pt: "Tamanho da Pilha: {1/1}" }],
    mods: [
      { en: "Creates a duplicated copy of a [Complex Bug].", pt: "Cria uma cópia duplicada de um [Bug Complexo]." },
      {
        en: "Allows the Developer to see the issue on [Localhost].",
        pt: "Permite que o Dev veja o problema no [Localhost].",
      },
    ],
    flavor: {
      en: "It works on my machine... and now on yours too.",
      pt: "Funciona na minha máquina... e agora na sua também.",
    },
  },
  {
    id: "ticket-whetstone",
    name: { en: "Ticket Whetstone", pt: "Pedra de Afiar Tickets" },
    base: { en: "Currency", pt: "Moeda" },
    stack: 20,
    rarity: "magic",
    gameIcon: "stone-block",
    properties: [{ en: "Stack Size: {20/20}", pt: "Tamanho da Pilha: {20/20}" }],
    mods: [
      { en: "Improves the {Quality} of a Bug Report.", pt: "Melhora a {Qualidade} de um Relatório de Bug." },
      {
        en: "Adds {+20% Clarity} by attaching Logs and Screenshots.",
        pt: "Adiciona {+20% de Clareza} anexando Logs e Screenshots.",
      },
    ],
    flavor: {
      en: "Sharp details cut through developer excuses.",
      pt: "Detalhes afiados cortam as desculpas dos devs.",
    },
  },
];

/** The requirement line for an item's tooltip. */
export const requirementLine = (level: number): L => ({
  en: `Requires Level {${level}}`,
  pt: `Requer Nível {${level}}`,
});
