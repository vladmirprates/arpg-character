import type { L } from "../../i18n/types";
import type { Region } from "./data";

/**
 * The tree's content, independent of geometry. Every notable is a specific skill, tool or
 * specialty — something a QA either has or doesn't — so a build says something about the person.
 * Masteries sit at the heart of each cluster and name its discipline; soft skills ring the start;
 * keystones are the big region capstones and PoE-style trade-offs.
 */

export type Def = { icon: string; name: L; desc: L };
export const d = (icon: string, name: L, desc: L): Def => ({ icon, name, desc });

/** A region's content. Layouts add the geometry. */
export interface RegionContent<D> {
  region: Exclude<Region, "core">;
  /** Direction from the centre, in degrees (0 = east, 90 = south). */
  angle: number;
  label: L;
  minorIcon: string;
  /** Named stat lines for small nodes. */
  minorStats: Record<string, L>;
  /** Notables, in the order layouts place them. */
  notables: [string, D][];
  /** Masteries — one per cluster centre, in the order layouts place them. */
  masteries: [string, D][];
  /** Keystones with their trade-off lines, in the order layouts place them. */
  keystones: [string, D, L[]][];
}

export const NORTH: RegionContent<Def> = {
  region: "north",
  angle: -90,
  label: { en: "Game Testing", pt: "Testes de Jogos" },
  minorIcon: "cog",
  minorStats: {
    spine: { en: "+10 to Game Sense (Wis)", pt: "+10 em Senso de Jogo (Sab)" },
    spur: { en: "+4% Usability Awareness", pt: "+4% de Percepção de Usabilidade" },
    fortress: { en: "6% increased Boundary Coverage", pt: "6% de Cobertura de Limites aumentada" },
    wheel: { en: "+5% Gameplay Coverage", pt: "+5% de Cobertura de Gameplay" },
    star: { en: "8% increased System Insight", pt: "8% de Visão Sistêmica aumentada" },
    path: { en: "+12 to Game Sense (Wis)", pt: "+12 em Senso de Jogo (Sab)" },
    climb: { en: "+3% Simulation Fidelity", pt: "+3% de Fidelidade de Simulação" },
  },
  notables: [
    [
      "gm_mechanics",
      d(
        "gears",
        { en: "Gameplay & Systems Testing", pt: "Testes de Gameplay e Sistemas" },
        {
          en: "Combat, abilities and the way game systems interact.",
          pt: "Combate, habilidades e a interação entre os sistemas do jogo.",
        },
      ),
    ],
    [
      "gm_ui",
      d(
        "arrow-cursor",
        { en: "UX / UI Testing", pt: "Testes de UX / UI" },
        {
          en: "HUD, menus and usability, checked against the design in Figma.",
          pt: "HUD, menus e usabilidade, comparados com o design no Figma.",
        },
      ),
    ],
    [
      "gm_audio",
      d(
        "sound-waves",
        { en: "Audio & Subtitle Testing", pt: "Testes de Áudio e Legendas" },
        { en: "SFX, music, voice-over and subtitle sync.", pt: "Efeitos, música, dublagem e sincronia de legendas." },
      ),
    ],
    [
      "gm_collision",
      d(
        "stone-wall",
        { en: "Level & Collision Testing", pt: "Testes de Fase e Colisão" },
        {
          en: "Stuck spots, clipping, holes in the map and out-of-bounds exploits.",
          pt: "Pontos de travamento, clipping, buracos no mapa e saídas dos limites.",
        },
      ),
    ],
    [
      "gm_save",
      d(
        "save",
        { en: "Save & Progression Testing", pt: "Testes de Save e Progressão" },
        {
          en: "Save/load, character progress and data that must survive every session.",
          pt: "Salvar/carregar, progresso do personagem e dados que precisam sobreviver a cada sessão.",
        },
      ),
    ],
    [
      "gm_economy",
      d(
        "two-coins",
        { en: "Economy & Itemization Testing", pt: "Testes de Economia e Itens" },
        {
          en: "Loot tables, crafting, vendors and trade — where exploits become duplication bugs.",
          pt: "Tabelas de loot, crafting, vendedores e trocas — onde exploits viram bugs de duplicação.",
        },
      ),
    ],
    [
      "gm_physics",
      d(
        "shiny-apple",
        { en: "Physics & Animation Testing", pt: "Testes de Física e Animação" },
        {
          en: "Ragdolls, projectiles, animation blending and hit detection.",
          pt: "Ragdolls, projéteis, transições de animação e detecção de acertos.",
        },
      ),
    ],
    [
      "gm_balance",
      d(
        "life-in-the-balance",
        { en: "Game Balance Testing", pt: "Testes de Balanceamento" },
        {
          en: "Difficulty curves, builds that break the game, and progression pacing.",
          pt: "Curvas de dificuldade, builds que quebram o jogo e ritmo de progressão.",
        },
      ),
    ],
    [
      "gm_tuto",
      d(
        "baby-face",
        { en: "FTUE & Onboarding", pt: "FTUE e Onboarding" },
        {
          en: "Tutorials and the first hour, seen through a new player's eyes.",
          pt: "Tutoriais e a primeira hora, pelos olhos de um jogador novo.",
        },
      ),
    ],
    [
      "gm_loc",
      d(
        "flying-flag",
        { en: "Localization QA (PT-BR)", pt: "QA de Localização (PT-BR)" },
        {
          en: "Translation, context, truncated text and culture checks in Brazilian Portuguese.",
          pt: "Tradução, contexto, texto cortado e adequação cultural em português do Brasil.",
        },
      ),
    ],
    [
      "gm_engine",
      d(
        "cube",
        { en: "Unity / Unreal Testing", pt: "Testes em Unity / Unreal" },
        {
          en: "Testing in-engine with the editor, debug views and console commands.",
          pt: "Testes dentro da engine com o editor, visões de debug e comandos de console.",
        },
      ),
    ],
    [
      "gm_pc",
      d(
        "computer-fan",
        { en: "PC Compatibility", pt: "Compatibilidade de PC" },
        {
          en: "GPU, CPU, driver, resolution and OS combinations.",
          pt: "Combinações de GPU, CPU, driver, resolução e sistema operacional.",
        },
      ),
    ],
  ],
  masteries: [
    [
      "gm_m_gameplay",
      d(
        "gamepad",
        { en: "Gameplay Mastery", pt: "Maestria em Gameplay" },
        {
          en: "Breaks the core loop on purpose: combat, physics and every system in between.",
          pt: "Quebra o loop principal de propósito: combate, física e todo sistema no meio.",
        },
      ),
    ],
    [
      "gm_m_experience",
      d(
        "joystick",
        { en: "Player Experience Mastery", pt: "Maestria em Experiência do Jogador" },
        {
          en: "Judges the game the way a player feels it: UI, onboarding, audio and flow.",
          pt: "Avalia o jogo como o jogador sente: UI, onboarding, áudio e fluidez.",
        },
      ),
    ],
  ],
  keystones: [
    [
      "gm_master",
      d(
        "game-console",
        { en: "Game Testing Mastery", pt: "Maestria em Testes de Jogos" },
        {
          en: "Finds the bugs players would find — before launch.",
          pt: "Acha os bugs que os jogadores achariam — antes do lançamento.",
        },
      ),
      [
        { en: "+40 to Game Sense (Wis)", pt: "+40 em Senso de Jogo (Sab)" },
        {
          en: "Every system is tested against every other system",
          pt: "Todo sistema é testado contra todos os outros",
        },
        { en: "You can no longer play a game just for fun", pt: "Você não consegue mais jogar só por diversão" },
      ],
    ],
    [
      "ks_cert",
      d(
        "laurel-crown",
        { en: "Certification Specialist", pt: "Especialista em Certificação" },
        {
          en: "Console submission requirements: Sony TRC, Xbox XR and Nintendo Lotcheck.",
          pt: "Requisitos de submissão para consoles: Sony TRC, Xbox XR e Nintendo Lotcheck.",
        },
      ),
      [
        { en: "Builds pass certification on the first try", pt: "Builds passam na certificação de primeira" },
        {
          en: "You quote requirement numbers in casual talk",
          pt: "Você cita números de requisitos em conversas casuais",
        },
      ],
    ],
    [
      "ks_deterministic",
      d(
        "dice-target",
        { en: "Deterministic Mind", pt: "Mente Determinística" },
        { en: "Every bug has a seed, and you will find it.", pt: "Todo bug tem uma semente, e você vai encontrá-la." },
      ),
      [
        { en: "Every failure is reproducible", pt: "Toda falha é reproduzível" },
        { en: "Cannot accept “it just happens sometimes”", pt: "Não aceita “às vezes simplesmente acontece”" },
      ],
    ],
  ],
};

export const SOUTH: RegionContent<Def> = {
  region: "south",
  angle: 90,
  label: { en: "Manual Testing", pt: "Testes Manuais" },
  minorIcon: "spotted-bug",
  minorStats: {
    spine: { en: "+10 to Manual (Str)", pt: "+10 em Manual (For)" },
    spur: { en: "+4% Ticket Velocity", pt: "+4% de Velocidade de Tickets" },
    root: { en: "+5% Duplicate Detection", pt: "+5% de Detecção de Duplicados" },
    wheel: { en: "+10% Evidence Quality", pt: "+10% de Qualidade de Evidências" },
    star: { en: "6% increased Edge-Case Discovery", pt: "6% de Descoberta de Casos Extremos aumentada" },
    loop: { en: "+6% Severity Accuracy", pt: "+6% de Precisão de Severidade" },
    path: { en: "+12 to Manual (Str)", pt: "+12 em Manual (For)" },
  },
  notables: [
    [
      "man_bugs",
      d(
        "quill-ink",
        { en: "Bug Reporting", pt: "Relato de Bugs" },
        {
          en: "Clear titles, exact repro steps, expected vs. actual, and video evidence.",
          pt: "Títulos claros, passos exatos, esperado vs. obtido e evidência em vídeo.",
        },
      ),
    ],
    [
      "man_testcase",
      d(
        "checklist",
        { en: "Test Case Design", pt: "Design de Casos de Teste" },
        {
          en: "Boundary values, equivalence partitions, decision tables and state transitions.",
          pt: "Valores-limite, partições de equivalência, tabelas de decisão e transições de estado.",
        },
      ),
    ],
    [
      "man_explore",
      d(
        "compass",
        { en: "Exploratory Testing", pt: "Testes Exploratórios" },
        {
          en: "Session-based exploration with charters, notes and debriefs.",
          pt: "Exploração baseada em sessões, com charters, anotações e debriefs.",
        },
      ),
    ],
    [
      "man_regression",
      d(
        "recycle",
        { en: "Regression Testing", pt: "Testes de Regressão" },
        {
          en: "Choosing and running the suites that prove old features still work.",
          pt: "Escolher e rodar as suítes que provam que o que funcionava continua funcionando.",
        },
      ),
    ],
    [
      "man_smoke",
      d(
        "smoke-bomb",
        { en: "Smoke & Sanity Testing", pt: "Smoke e Sanity Tests" },
        {
          en: "Fast go/no-go checks on every new build.",
          pt: "Verificações rápidas de vai/não-vai em cada build nova.",
        },
      ),
    ],
    [
      "man_compat",
      d(
        "pc",
        { en: "Cross-Browser & Device Testing", pt: "Testes Cross-Browser e de Dispositivos" },
        {
          en: "Browsers, screen sizes and devices, including BrowserStack.",
          pt: "Navegadores, tamanhos de tela e dispositivos, incluindo BrowserStack.",
        },
      ),
    ],
    [
      "man_uat",
      d(
        "thumb-up",
        { en: "Acceptance Testing (UAT)", pt: "Testes de Aceitação (UAT)" },
        {
          en: "Validating features against acceptance criteria with the product owner.",
          pt: "Validação das funcionalidades contra os critérios de aceite com o PO.",
        },
      ),
    ],
    [
      "man_triage",
      d(
        "hazard-sign",
        { en: "Bug Triage", pt: "Triagem de Bugs" },
        {
          en: "Severity, priority, duplicates and routing to the right team.",
          pt: "Severidade, prioridade, duplicados e encaminhamento ao time certo.",
        },
      ),
    ],
    [
      "man_logs",
      d(
        "scroll-unfurled",
        { en: "Log & Crash Analysis", pt: "Análise de Logs e Crashes" },
        {
          en: "Reading logs, stack traces and crash dumps to pinpoint the failure.",
          pt: "Leitura de logs, stack traces e crash dumps para localizar a falha.",
        },
      ),
    ],
  ],
  masteries: [
    [
      "man_m_advocacy",
      d(
        "sword-clash",
        { en: "Bug Advocacy Mastery", pt: "Maestria em Defesa de Bugs" },
        {
          en: "Gets the right bugs fixed: evidence, impact and a convincing case.",
          pt: "Faz os bugs certos serem corrigidos: evidência, impacto e um bom argumento.",
        },
      ),
    ],
    [
      "man_m_execution",
      d(
        "podium",
        { en: "Test Execution Mastery", pt: "Maestria em Execução de Testes" },
        {
          en: "Runs test passes that are fast, thorough and trusted at sign-off.",
          pt: "Conduz rodadas de teste rápidas, completas e confiáveis na aprovação.",
        },
      ),
    ],
  ],
  keystones: [
    [
      "man_master",
      d(
        "spyglass",
        { en: "Manual Testing Mastery", pt: "Maestria em Testes Manuais" },
        {
          en: "Expert hands-on testing: design, exploration and reporting.",
          pt: "Testes práticos de alto nível: design, exploração e relato.",
        },
      ),
      [
        { en: "+40 to Manual (Str)", pt: "+40 em Manual (For)" },
        {
          en: "Developers can no longer reply “cannot reproduce”",
          pt: "Devs não podem mais responder “não consigo reproduzir”",
        },
        { en: "Each ticket takes 20% longer to write", pt: "Cada ticket leva 20% mais tempo para escrever" },
      ],
    ],
    [
      "ks_zero_bug",
      d(
        "trophy",
        { en: "Zero Bug Bounce", pt: "Zero Bug Bounce" },
        { en: "The backlog hits zero once per release.", pt: "O backlog chega a zero uma vez por release." },
      ),
      [
        { en: "Release readiness is never in doubt", pt: "A prontidão da release nunca está em dúvida" },
        { en: "It never stays at zero", pt: "Ele nunca fica em zero" },
      ],
    ],
    [
      "ks_pixel",
      d(
        "eye-target",
        { en: "Pixel Perfectionist", pt: "Perfeccionista de Pixels" },
        {
          en: "Notices a 1px misalignment from across the room.",
          pt: "Percebe um desalinhamento de 1px do outro lado da sala.",
        },
      ),
      [
        { en: "UI defects cannot hide from you", pt: "Defeitos de UI não se escondem de você" },
        {
          en: "Every ticket has a screenshot covered in red arrows",
          pt: "Todo ticket tem um screenshot cheio de setas vermelhas",
        },
      ],
    ],
  ],
};

export const EAST: RegionContent<Def> = {
  region: "east",
  angle: 0,
  label: { en: "Test Automation", pt: "Automação de Testes" },
  minorIcon: "circuitry",
  minorStats: {
    spine: { en: "+10 to Automation (Int)", pt: "+10 em Automação (Int)" },
    spur: { en: "+4% Platform Coverage", pt: "+4% de Cobertura de Plataformas" },
    grid: { en: "6% increased Suite Speed", pt: "6% de Velocidade da Suíte aumentada" },
    bus: { en: "+5% API Coverage", pt: "+5% de Cobertura de API" },
    trace: { en: "+12 to Automation (Int)", pt: "+12 em Automação (Int)" },
  },
  notables: [
    [
      "tech_cicd",
      d(
        "pipes",
        { en: "CI/CD Integration", pt: "Integração com CI/CD" },
        {
          en: "Suites that run on every commit in GitHub Actions, Jenkins or GitLab CI.",
          pt: "Suítes que rodam a cada commit no GitHub Actions, Jenkins ou GitLab CI.",
        },
      ),
    ],
    [
      "tech_git",
      d(
        "branch-arrow",
        { en: "Git & Code Review", pt: "Git e Code Review" },
        {
          en: "Branches, pull requests and reviewing test code.",
          pt: "Branches, pull requests e revisão de código de teste.",
        },
      ),
    ],
    [
      "tech_framework",
      d(
        "stone-tower",
        { en: "Test Framework Design", pt: "Design de Frameworks de Teste" },
        {
          en: "Page objects, fixtures and test data that keep a suite maintainable.",
          pt: "Page objects, fixtures e dados de teste que mantêm uma suíte sustentável.",
        },
      ),
    ],
    [
      "tech_js",
      d(
        "scroll-quill",
        { en: "JavaScript / TypeScript", pt: "JavaScript / TypeScript" },
        {
          en: "Writing test automation in JavaScript and TypeScript.",
          pt: "Automação de testes em JavaScript e TypeScript.",
        },
      ),
    ],
    [
      "tech_unit",
      d(
        "microscope",
        { en: "Unit & Component Tests", pt: "Testes de Unidade e Componente" },
        {
          en: "Fast, isolated tests with JUnit, pytest or Vitest.",
          pt: "Testes rápidos e isolados com JUnit, pytest ou Vitest.",
        },
      ),
    ],
    [
      "tech_bdd",
      d(
        "open-book",
        { en: "BDD / Cucumber", pt: "BDD / Cucumber" },
        {
          en: "Given/When/Then scenarios in Gherkin, wired to automation.",
          pt: "Cenários Dado/Quando/Então em Gherkin, ligados à automação.",
        },
      ),
    ],
    [
      "tech_visual",
      d(
        "photo-camera",
        { en: "Visual Regression Testing", pt: "Testes de Regressão Visual" },
        {
          en: "Screenshot comparison that catches unintended UI changes.",
          pt: "Comparação de screenshots que pega mudanças de UI não intencionais.",
        },
      ),
    ],
    [
      "tech_docker",
      d(
        "cargo-crate",
        { en: "Docker & Test Environments", pt: "Docker e Ambientes de Teste" },
        {
          en: "Disposable, reproducible environments for every test run.",
          pt: "Ambientes descartáveis e reproduzíveis para cada execução.",
        },
      ),
    ],
    [
      "tech_sql",
      d(
        "database",
        { en: "SQL & Databases", pt: "SQL e Bancos de Dados" },
        {
          en: "Querying databases to set up and verify test data.",
          pt: "Consultas a bancos de dados para preparar e verificar dados de teste.",
        },
      ),
    ],
    [
      "tech_playwright",
      d(
        "drama-masks",
        { en: "Playwright Automation", pt: "Automação com Playwright" },
        {
          en: "End-to-end browser tests with Playwright.",
          pt: "Testes end-to-end de navegador com Playwright.",
        },
      ),
    ],
    [
      "tech_selenium",
      d(
        "chemical-drop",
        { en: "Selenium WebDriver", pt: "Selenium WebDriver" },
        {
          en: "Browser automation with Selenium WebDriver.",
          pt: "Automação de navegador com Selenium WebDriver.",
        },
      ),
    ],
    [
      "tech_cypress",
      d(
        "pine-tree",
        { en: "Cypress Automation", pt: "Automação com Cypress" },
        {
          en: "Front-end end-to-end and component tests with Cypress.",
          pt: "Testes end-to-end e de componentes de front-end com Cypress.",
        },
      ),
    ],
    [
      "tech_appium",
      d(
        "phone",
        { en: "Appium Automation", pt: "Automação com Appium" },
        {
          en: "Mobile app automation on Android and iOS with Appium.",
          pt: "Automação de apps mobile em Android e iOS com Appium.",
        },
      ),
    ],
    [
      "tech_python",
      d(
        "snake",
        { en: "Python", pt: "Python" },
        {
          en: "Writing test automation and tooling in Python.",
          pt: "Automação de testes e ferramentas em Python.",
        },
      ),
    ],
    [
      "tech_java",
      d(
        "coffee-beans",
        { en: "Java", pt: "Java" },
        {
          en: "Writing test automation in Java.",
          pt: "Automação de testes em Java.",
        },
      ),
    ],
    [
      "tech_api_tools",
      d(
        "envelope",
        { en: "API Testing: Postman & REST Assured", pt: "Testes de API: Postman e REST Assured" },
        {
          en: "Testing REST endpoints with Postman collections and REST Assured.",
          pt: "Testes de endpoints REST com coleções do Postman e REST Assured.",
        },
      ),
    ],
  ],
  masteries: [
    [
      "tech_m_code",
      d(
        "spiral-shell",
        { en: "Programming Mastery", pt: "Maestria em Programação" },
        {
          en: "Writes test code to the same standard as production code.",
          pt: "Escreve código de teste no mesmo padrão do código de produção.",
        },
      ),
    ],
    [
      "tech_m_web",
      d(
        "world",
        { en: "Web Automation Mastery", pt: "Maestria em Automação Web" },
        {
          en: "Stable, fast browser suites that don't need babysitting.",
          pt: "Suítes de navegador estáveis e rápidas que não precisam de babá.",
        },
      ),
    ],
    [
      "tech_m_mobile",
      d(
        "console-controller",
        { en: "Mobile Automation Mastery", pt: "Maestria em Automação Mobile" },
        {
          en: "Automates real devices and emulators without flaky waits.",
          pt: "Automatiza dispositivos reais e emuladores sem esperas instáveis.",
        },
      ),
    ],
    [
      "tech_m_api",
      d(
        "key",
        { en: "API Testing Mastery", pt: "Maestria em Testes de API" },
        {
          en: "Tests the backend directly: contracts, payloads, auth and data.",
          pt: "Testa o backend direto: contratos, payloads, autenticação e dados.",
        },
      ),
    ],
  ],
  keystones: [
    [
      "ks_shift_left",
      d(
        "fast-backward-button",
        { en: "Shift Left", pt: "Shift Left" },
        {
          en: "Quality starts at the requirements, not at the build.",
          pt: "A qualidade começa nos requisitos, não na build.",
        },
      ),
      [
        { en: "Bugs are found before the code is written", pt: "Bugs são encontrados antes do código ser escrito" },
        { en: "Refinement meetings take 40% longer", pt: "Reuniões de refinamento levam 40% mais tempo" },
      ],
    ],
    [
      "tech_master",
      d(
        "toolbox",
        { en: "Automated Testing Mastery", pt: "Maestria em Testes Automatizados" },
        {
          en: "Builds and maintains automation the whole team trusts.",
          pt: "Cria e mantém automação em que o time inteiro confia.",
        },
      ),
      [
        { en: "+40 to Automation (Int)", pt: "+40 em Automação (Int)" },
        { en: "Regression suites run themselves", pt: "Suítes de regressão rodam sozinhas" },
        { en: "You maintain 2 more frameworks than necessary", pt: "Você mantém 2 frameworks a mais que o necessário" },
      ],
    ],
    [
      "ks_flaky",
      d(
        "ghost",
        { en: "Flaky Test Exorcist", pt: "Exorcista de Testes Instáveis" },
        { en: "Flaky tests are quarantined on sight.", pt: "Testes instáveis vão para quarentena na hora." },
      ),
      [
        { en: "The pipeline is always green for a reason", pt: "A pipeline está sempre verde por um motivo" },
        { en: "You hear retries in your sleep", pt: "Você ouve retries enquanto dorme" },
      ],
    ],
  ],
};

export const WEST: RegionContent<Def> = {
  region: "west",
  angle: 180,
  label: { en: "Strategy & Leadership", pt: "Estratégia e Liderança" },
  minorIcon: "sprout",
  minorStats: {
    spine: { en: "+10 to Process (Dex)", pt: "+10 em Processo (Des)" },
    spur: { en: "+4% Team Morale", pt: "+4% de Moral do Time" },
    cycle: { en: "6% increased Sprint Predictability", pt: "6% de Previsibilidade da Sprint aumentada" },
    sprint: { en: "+5% Documentation Quality", pt: "+5% de Qualidade da Documentação" },
    spoke: { en: "8% increased Risk Awareness", pt: "8% de Percepção de Risco aumentada" },
    path: { en: "+12 to Process (Dex)", pt: "+12 em Processo (Des)" },
  },
  notables: [
    [
      "proc_testplan",
      d(
        "treasure-map",
        { en: "Test Planning & Strategy", pt: "Planejamento e Estratégia de Testes" },
        {
          en: "Scope, approach, environments and exit criteria for a whole release.",
          pt: "Escopo, abordagem, ambientes e critérios de saída para uma release inteira.",
        },
      ),
    ],
    [
      "proc_risk",
      d(
        "falling-bomb",
        { en: "Risk-Based Testing", pt: "Testes Baseados em Risco" },
        {
          en: "Spending test time where failure is most likely and most costly.",
          pt: "Investir o tempo de teste onde a falha é mais provável e mais cara.",
        },
      ),
    ],
    [
      "proc_agile",
      d(
        "cycle",
        { en: "Agile & Scrum", pt: "Ágil e Scrum" },
        {
          en: "QA inside the sprint: refinement, estimates and the definition of done.",
          pt: "QA dentro da sprint: refinamento, estimativas e definição de pronto.",
        },
      ),
    ],
    [
      "proc_jira",
      d(
        "ticket",
        { en: "Jira & Azure DevOps", pt: "Jira e Azure DevOps" },
        {
          en: "Workflows, boards, filters and dashboards.",
          pt: "Fluxos, quadros, filtros e dashboards.",
        },
      ),
    ],
    [
      "proc_tms",
      d(
        "files",
        { en: "Test Management Tools", pt: "Ferramentas de Gestão de Testes" },
        {
          en: "Organizing suites and runs in TestRail, Zephyr or Xray.",
          pt: "Organização de suítes e execuções no TestRail, Zephyr ou Xray.",
        },
      ),
    ],
    [
      "proc_metrics",
      d(
        "histogram",
        { en: "QA Metrics & Reporting", pt: "Métricas e Relatórios de QA" },
        {
          en: "Coverage, escaped defects and release-readiness reports.",
          pt: "Cobertura, defeitos escapados e relatórios de prontidão da release.",
        },
      ),
    ],
    [
      "proc_mentor",
      d(
        "teacher",
        { en: "Mentoring & Onboarding", pt: "Mentoria e Onboarding" },
        {
          en: "Training new testers and spreading testing know-how.",
          pt: "Treinamento de novos testers e disseminação do conhecimento de testes.",
        },
      ),
    ],
    [
      "proc_docs",
      d(
        "bookshelf",
        { en: "QA Documentation", pt: "Documentação de QA" },
        {
          en: "Test plans, guides and a knowledge base people actually read.",
          pt: "Planos de teste, guias e uma base de conhecimento que as pessoas leem de verdade.",
        },
      ),
    ],
    [
      "proc_istqb",
      d(
        "diploma",
        { en: "ISTQB Foundations", pt: "Fundamentos ISTQB" },
        {
          en: "Standard testing vocabulary, techniques and process (ISTQB syllabus).",
          pt: "Vocabulário, técnicas e processo de testes padrão (programa ISTQB).",
        },
      ),
    ],
  ],
  masteries: [
    [
      "proc_m_management",
      d(
        "chess-queen",
        { en: "Test Management Mastery", pt: "Maestria em Gestão de Testes" },
        {
          en: "Keeps a release's testing planned, tracked and on schedule.",
          pt: "Mantém os testes da release planejados, acompanhados e no prazo.",
        },
      ),
    ],
  ],
  keystones: [
    [
      "ks_dod",
      d(
        "stamper",
        { en: "Definition of Done", pt: "Definição de Pronto" },
        { en: "Nothing ships without acceptance criteria.", pt: "Nada é entregue sem critérios de aceite." },
      ),
      [
        { en: "Every story is truly finished", pt: "Toda história está realmente pronta" },
        { en: "Everything needs one more refinement", pt: "Tudo precisa de mais um refinamento" },
      ],
    ],
    [
      "proc_master",
      d(
        "brain",
        { en: "QA Leadership Mastery", pt: "Maestria em Liderança de QA" },
        {
          en: "Leads the quality strategy, the people and the process.",
          pt: "Lidera a estratégia de qualidade, as pessoas e o processo.",
        },
      ),
      [
        { en: "+40 to Process (Dex)", pt: "+40 em Processo (Des)" },
        { en: "Sprint goals are always met", pt: "Metas da sprint são sempre cumpridas" },
        { en: "You attend 30% more meetings", pt: "Você participa de 30% mais reuniões" },
      ],
    ],
    [
      "ks_servant",
      d(
        "team-upgrade",
        { en: "Servant Leader", pt: "Líder Servidor" },
        { en: "The team's success is your success.", pt: "O sucesso do time é o seu sucesso." },
      ),
      [
        { en: "Team velocity counts as your own", pt: "A velocidade do time conta como a sua" },
        { en: "Your own tickets wait until last", pt: "Seus próprios tickets ficam para o fim" },
      ],
    ],
  ],
};

export type BridgeContent = {
  region: "northeast" | "southeast" | "southwest" | "northwest";
  angle: number;
  /** Neighbouring regions: counter-clockwise (−v side) then clockwise (+v side). */
  neighbours: [Region, Region];
  label: L;
  stat: L;
  notables: [string, Def][];
  mastery: [string, Def];
  keystone: [string, Def, L[]];
};

export const BRIDGES: BridgeContent[] = [
  {
    region: "northeast",
    angle: -45,
    neighbours: ["north", "east"],
    label: { en: "Performance", pt: "Performance" },
    stat: { en: "+6 to Game Sense and Automation", pt: "+6 em Senso de Jogo e Automação" },
    notables: [
      [
        "br_load",
        d(
          "weight-lifting-up",
          { en: "Load & Stress Testing", pt: "Testes de Carga e Estresse" },
          {
            en: "Simulating thousands of users with JMeter, k6 or Gatling.",
            pt: "Simulação de milhares de usuários com JMeter, k6 ou Gatling.",
          },
        ),
      ],
      [
        "br_profiling",
        d(
          "speedometer",
          { en: "Profiling & Frame Rate", pt: "Profiling e Taxa de Quadros" },
          {
            en: "FPS, frame times, CPU/GPU and memory — finding where it slows down.",
            pt: "FPS, tempo de quadro, CPU/GPU e memória — achar onde fica lento.",
          },
        ),
      ],
    ],
    mastery: [
      "br_m_optimization",
      d(
        "stopwatch",
        { en: "Optimization Mastery", pt: "Maestria em Otimização" },
        {
          en: "Turns a vague “it feels slow” into a measured, fixable bottleneck.",
          pt: "Transforma um vago “está lento” num gargalo medido e corrigível.",
        },
      ),
    ],
    keystone: [
      "ks_perf",
      d(
        "lightning-frequency",
        { en: "Performance Testing Mastery", pt: "Maestria em Testes de Performance" },
        {
          en: "Finds the bottleneck before the players feel it.",
          pt: "Acha o gargalo antes de os jogadores sentirem.",
        },
      ),
      [
        { en: "+20 to Game Sense and Automation", pt: "+20 em Senso de Jogo e Automação" },
        { en: "Frame drops are caught in the pipeline", pt: "Quedas de FPS são pegas na pipeline" },
        { en: "You notice 1 ms of input lag everywhere", pt: "Você percebe 1 ms de input lag em todo lugar" },
      ],
    ],
  },
  {
    region: "southeast",
    angle: 45,
    neighbours: ["east", "south"],
    label: { en: "Mobile", pt: "Mobile" },
    stat: { en: "+6 to Automation and Manual", pt: "+6 em Automação e Manual" },
    notables: [
      [
        "br_android",
        d(
          "android-mask",
          { en: "Android Testing", pt: "Testes em Android" },
          {
            en: "Device testing with ADB, Logcat and Android Studio.",
            pt: "Testes em dispositivos com ADB, Logcat e Android Studio.",
          },
        ),
      ],
      [
        "br_ios",
        d(
          "smartphone",
          { en: "iOS Testing", pt: "Testes em iOS" },
          {
            en: "Device testing with Xcode, TestFlight and the iOS console.",
            pt: "Testes em dispositivos com Xcode, TestFlight e o console do iOS.",
          },
        ),
      ],
    ],
    mastery: [
      "br_m_devices",
      d(
        "crystal-growth",
        { en: "Device Lab Mastery", pt: "Maestria em Laboratório de Dispositivos" },
        {
          en: "Chooses the device matrix that covers the most players with the fewest phones.",
          pt: "Escolhe a matriz de dispositivos que cobre mais jogadores com menos celulares.",
        },
      ),
    ],
    keystone: [
      "ks_mobile",
      d(
        "tablet",
        { en: "Mobile Testing Mastery", pt: "Maestria em Testes Mobile" },
        {
          en: "Real devices, bad networks, interruptions and gestures.",
          pt: "Dispositivos reais, redes ruins, interrupções e gestos.",
        },
      ),
      [
        { en: "+20 to Automation and Manual", pt: "+20 em Automação e Manual" },
        { en: "No crash survives a phone call mid-level", pt: "Nenhum crash sobrevive a uma ligação no meio da fase" },
        { en: "Your desk drawer holds 14 phones", pt: "Sua gaveta guarda 14 celulares" },
      ],
    ],
  },
  {
    region: "southwest",
    angle: 135,
    neighbours: ["south", "west"],
    label: { en: "Security & Accessibility", pt: "Segurança e Acessibilidade" },
    stat: { en: "+6 to Manual and Process", pt: "+6 em Manual e Processo" },
    notables: [
      [
        "br_security",
        d(
          "padlock",
          { en: "Security Testing", pt: "Testes de Segurança" },
          {
            en: "OWASP Top 10, authentication, permissions and input validation.",
            pt: "OWASP Top 10, autenticação, permissões e validação de entradas.",
          },
        ),
      ],
      [
        "br_a11y",
        d(
          "eye-shield",
          { en: "Accessibility Testing", pt: "Testes de Acessibilidade" },
          {
            en: "WCAG audits with screen readers, keyboard-only play and axe.",
            pt: "Auditorias WCAG com leitores de tela, uso só com teclado e axe.",
          },
        ),
      ],
    ],
    mastery: [
      "br_m_compliance",
      d(
        "lighthouse",
        { en: "Compliance Mastery", pt: "Maestria em Conformidade" },
        {
          en: "WCAG, privacy rules and age ratings — checked before launch, not after.",
          pt: "WCAG, regras de privacidade e classificação etária — verificadas antes do lançamento.",
        },
      ),
    ],
    keystone: [
      "ks_security",
      d(
        "cowled",
        { en: "Security Testing Mastery", pt: "Maestria em Testes de Segurança" },
        {
          en: "Thinks like an attacker to protect the players.",
          pt: "Pensa como um atacante para proteger os jogadores.",
        },
      ),
      [
        { en: "+20 to Manual and Process", pt: "+20 em Manual e Processo" },
        { en: "Exploits are found in-house first", pt: "Exploits são encontrados internamente primeiro" },
        { en: "You no longer trust any input field", pt: "Você não confia mais em nenhum campo de texto" },
      ],
    ],
  },
  {
    region: "northwest",
    angle: 225,
    neighbours: ["west", "north"],
    label: { en: "Live Service", pt: "Live Service" },
    stat: { en: "+6 to Process and Game Sense", pt: "+6 em Processo e Senso de Jogo" },
    notables: [
      [
        "br_liveops",
        d(
          "network-bars",
          { en: "Live-Ops & Multiplayer", pt: "Live-Ops e Multiplayer" },
          {
            en: "Patches, servers, matchmaking, latency and live events.",
            pt: "Patches, servidores, matchmaking, latência e eventos ao vivo.",
          },
        ),
      ],
      [
        "br_community",
        d(
          "conversation",
          { en: "Player Feedback & Community", pt: "Feedback de Jogadores e Comunidade" },
          {
            en: "Turning forum posts and player reports into reproducible tickets.",
            pt: "Transformar posts de fórum e relatos de jogadores em tickets reproduzíveis.",
          },
        ),
      ],
    ],
    mastery: [
      "br_m_liveops",
      d(
        "sunrise",
        { en: "Live-Ops Mastery", pt: "Maestria em Live-Ops" },
        {
          en: "Patch days, hotfixes and events go out without taking the servers down.",
          pt: "Dias de patch, hotfixes e eventos saem sem derrubar os servidores.",
        },
      ),
    ],
    keystone: [
      "ks_player",
      d(
        "checked-shield",
        { en: "Player Advocate", pt: "Defensor do Jogador" },
        {
          en: "Every decision is checked against the player's experience.",
          pt: "Toda decisão é avaliada pela experiência do jogador.",
        },
      ),
      [
        { en: "Players feel heard", pt: "Os jogadores se sentem ouvidos" },
        { en: "You argue with designers about what is fun", pt: "Você discute com designers sobre o que é divertido" },
      ],
    ],
  },
];

/** Soft skills: notables on the inner ring, between the region entries — every build passes them. */
export const SOFT_SKILLS: [string, Def][] = [
  [
    "soft_comm",
    d(
      "talk",
      { en: "Clear Communication", pt: "Comunicação Clara" },
      {
        en: "Explains bugs and risks so devs, designers and producers all understand.",
        pt: "Explica bugs e riscos de um jeito que devs, designers e produtores entendem.",
      },
    ),
  ],
  [
    "soft_critical",
    d(
      "light-bulb",
      { en: "Critical Thinking", pt: "Pensamento Crítico" },
      {
        en: "Questions requirements and assumptions before trusting them.",
        pt: "Questiona requisitos e suposições antes de confiar neles.",
      },
    ),
  ],
  [
    "soft_detail",
    d(
      "eye-of-horus",
      { en: "Attention to Detail", pt: "Atenção aos Detalhes" },
      {
        en: "Notices the small things that turn into big bugs.",
        pt: "Percebe as pequenas coisas que viram grandes bugs.",
      },
    ),
  ],
  [
    "soft_curiosity",
    d(
      "owl",
      { en: "Curiosity", pt: "Curiosidade" },
      {
        en: "Keeps asking “what if…?” until the system gives up its secrets.",
        pt: "Continua perguntando “e se…?” até o sistema revelar seus segredos.",
      },
    ),
  ],
  [
    "soft_empathy",
    d(
      "hearts",
      { en: "Player Empathy", pt: "Empatia com o Jogador" },
      {
        en: "Tests the way different players play: new, hardcore, impatient.",
        pt: "Testa como diferentes jogadores jogam: novatos, hardcore, impacientes.",
      },
    ),
  ],
  [
    "soft_teamwork",
    d(
      "shaking-hands",
      { en: "Collaboration", pt: "Colaboração" },
      {
        en: "Works with developers as partners, not opponents.",
        pt: "Trabalha com os devs como parceiros, não como adversários.",
      },
    ),
  ],
  [
    "soft_adapt",
    d(
      "chameleon-glyph",
      { en: "Adaptability", pt: "Adaptabilidade" },
      {
        en: "Stays calm through shifting priorities, crunch weeks and late builds.",
        pt: "Mantém a calma com prioridades mudando, semanas de crunch e builds atrasadas.",
      },
    ),
  ],
  [
    "soft_problem",
    d(
      "jigsaw-piece",
      { en: "Problem Solving", pt: "Resolução de Problemas" },
      { en: "Narrows a vague failure down to its root cause.", pt: "Reduz uma falha vaga até a causa raiz." },
    ),
  ],
];

export const START: Def = d(
  "magnifying-glass",
  { en: "QA Skills", pt: "Habilidades de QA" },
  {
    en: "Software Quality and Complex System Validation Expertise.",
    pt: "Especialista em Qualidade de Software e Validação de Sistemas Complexos.",
  },
);

export const RING_STATS: L[] = [
  { en: "+8 to all Attributes", pt: "+8 em todos os Atributos" },
  { en: "+5% Coffee Regeneration", pt: "+5% de Regeneração de Café" },
];
