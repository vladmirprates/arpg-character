import type { L } from "../i18n/types";

export type CertArea = "save" | "suspend" | "errors" | "input" | "a11y" | "loc" | "perf";

export interface CertCheck {
  /** Also the tag in the test title, e.g. test("[CERT-SAVE-01] …"), which links the result. */
  id: string;
  area: CertArea;
  /** The kind of console requirement, paraphrased (real TRC / XR / Lotcheck text is under NDA). */
  console: L;
  /** What the same requirement means for a web game. */
  web: L;
  /** How this site meets it. */
  how: L;
  /** Where the evidence comes from: an end-to-end test, or the Lighthouse budget in CI. */
  evidence: "e2e" | "lighthouse";
}

export const CERT_AREAS: { id: CertArea; title: L }[] = [
  { id: "save", title: { en: "Save data", pt: "Dados salvos" } },
  { id: "suspend", title: { en: "Suspend & resume", pt: "Suspender e retomar" } },
  { id: "errors", title: { en: "Errors & network", pt: "Erros e rede" } },
  { id: "input", title: { en: "Input devices", pt: "Dispositivos de entrada" } },
  { id: "a11y", title: { en: "Accessibility & UI", pt: "Acessibilidade e interface" } },
  { id: "loc", title: { en: "Localization", pt: "Localização" } },
  { id: "perf", title: { en: "Performance", pt: "Performance" } },
];

export const CERT_CHECKS: readonly CertCheck[] = [
  {
    id: "CERT-SAVE-01",
    area: "save",
    console: {
      en: "Corrupted save data must not crash the title; the player is told and can carry on.",
      pt: "Dados salvos corrompidos não podem travar o jogo; o jogador é avisado e pode continuar.",
    },
    web: { en: "Garbage or tampered localStorage values.", pt: "Valores inválidos ou adulterados no localStorage." },
    how: {
      en: "Every stored value is validated on read; anything invalid falls back to defaults.",
      pt: "Todo valor salvo é validado na leitura; qualquer coisa inválida volta ao padrão.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-SAVE-02",
    area: "save",
    console: {
      en: "Progress that the game says is saved must survive quitting and relaunching.",
      pt: "O progresso que o jogo diz ter salvo precisa sobreviver a fechar e abrir de novo.",
    },
    web: { en: "Survive a reload or a closed tab.", pt: "Sobreviver a um recarregamento ou aba fechada." },
    how: {
      en: "Settings, the stash, the bug hunt and achievements are kept across reloads.",
      pt: "Configurações, baú, caçada de bugs e conquistas são mantidos entre recarregamentos.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-SAVE-03",
    area: "save",
    console: {
      en: "Full or unavailable storage must be handled without blocking play.",
      pt: "Armazenamento cheio ou indisponível precisa ser tratado sem bloquear o jogo.",
    },
    web: {
      en: "localStorage throws (private mode, quota exceeded).",
      pt: "O localStorage lança erro (modo privado, cota excedida).",
    },
    how: {
      en: "Writes are best-effort: the page keeps working, it just doesn't remember.",
      pt: "As gravações são de melhor esforço: a página continua funcionando, só não lembra.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-SUSP-01",
    area: "suspend",
    console: {
      en: "On suspend, audio and simulation pause; on resume the game is exactly where it was.",
      pt: "Ao suspender, áudio e simulação pausam; ao retomar o jogo está exatamente onde estava.",
    },
    web: { en: "The tab is hidden, then shown again.", pt: "A aba é ocultada e depois mostrada de novo." },
    how: {
      en: "Hiding the tab pauses animations and audio; open dialogs and state are untouched on return.",
      pt: "Ocultar a aba pausa animações e áudio; diálogos abertos e o estado ficam intactos na volta.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-ERR-01",
    area: "errors",
    console: {
      en: "Losing the network connection shows a clear message instead of hanging.",
      pt: "Perder a conexão mostra uma mensagem clara em vez de travar.",
    },
    web: { en: "A request fails or the user goes offline.", pt: "Uma requisição falha ou o usuário fica offline." },
    how: {
      en: "The QA Report and this checklist say so plainly when their data can't load.",
      pt: "O Relatório de QA e este checklist avisam claramente quando os dados não carregam.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-ERR-02",
    area: "errors",
    console: {
      en: "Error messages use plain, localized language, not codes.",
      pt: "Mensagens de erro usam linguagem simples e localizada, não códigos.",
    },
    web: { en: "Every failure path shows readable text.", pt: "Todo caminho de falha mostra um texto legível." },
    how: {
      en: "Crafting errors are full sentences in both languages, announced to screen readers.",
      pt: "Erros de criação são frases completas nos dois idiomas, anunciadas a leitores de tela.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-INP-01",
    area: "input",
    console: {
      en: "Disconnecting the controller is detected and the player is told.",
      pt: "Desconectar o controle é detectado e o jogador é avisado.",
    },
    web: { en: "The gamepaddisconnected event.", pt: "O evento gamepaddisconnected." },
    how: {
      en: "Connect and disconnect are announced; navigation falls back to mouse and keyboard.",
      pt: "Conectar e desconectar são anunciados; a navegação volta para mouse e teclado.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-INP-02",
    area: "input",
    console: {
      en: "Every function can be reached with each supported input device.",
      pt: "Toda função pode ser acessada com cada dispositivo de entrada suportado.",
    },
    web: { en: "Mouse, touch, keyboard and gamepad.", pt: "Mouse, toque, teclado e controle." },
    how: {
      en: "D-pad spatial navigation with A / B; keyboard-only flows are tested end to end.",
      pt: "Navegação espacial pelo direcional com A / B; fluxos só com teclado são testados de ponta a ponta.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-INP-03",
    area: "input",
    console: {
      en: "Button prompts match the device the player is using.",
      pt: "Os ícones de botão correspondem ao dispositivo que o jogador está usando.",
    },
    web: { en: "Show controller prompts when a pad is used.", pt: "Mostrar ícones do controle quando um é usado." },
    how: {
      en: "A controller legend appears while a pad is connected, with its name.",
      pt: "Uma legenda do controle aparece enquanto ele está conectado, com o nome dele.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-A11Y-01",
    area: "a11y",
    console: {
      en: "Text and UI meet legibility and contrast guidelines.",
      pt: "Texto e interface atendem às diretrizes de legibilidade e contraste.",
    },
    web: { en: "WCAG 2.2 A/AA.", pt: "WCAG 2.2 A/AA." },
    how: {
      en: "axe-core scans every screen and dialog; zero violations are allowed.",
      pt: "O axe-core verifica todas as telas e diálogos; nenhuma violação é permitida.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-A11Y-02",
    area: "a11y",
    console: {
      en: "System accessibility settings are respected.",
      pt: "As configurações de acessibilidade do sistema são respeitadas.",
    },
    web: { en: "prefers-reduced-motion.", pt: "prefers-reduced-motion." },
    how: {
      en: "With reduced motion on, ambient particles and screen shake are switched off.",
      pt: "Com movimento reduzido, partículas e tremores de tela são desligados.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-LOC-01",
    area: "loc",
    console: {
      en: "Every player-facing string is localized and none is truncated.",
      pt: "Todo texto visível ao jogador é localizado e nenhum é cortado.",
    },
    web: {
      en: "No hardcoded strings; layouts survive longer text.",
      pt: "Nenhum texto fixo no código; layouts aguentam textos maiores.",
    },
    how: {
      en: "A pseudo-localization scan fails on any text that skipped the i18n layer.",
      pt: "Uma varredura com pseudolocalização falha em qualquer texto que não passou pela camada de i18n.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-LOC-02",
    area: "loc",
    console: {
      en: "The first boot follows the system language.",
      pt: "A primeira execução segue o idioma do sistema.",
    },
    web: { en: "navigator.language.", pt: "navigator.language." },
    how: {
      en: "A Brazilian Portuguese browser gets PT-BR on the first visit; the choice is remembered.",
      pt: "Um navegador em português do Brasil recebe PT-BR na primeira visita; a escolha é lembrada.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-PERF-01",
    area: "perf",
    console: {
      en: "The frame rate stays above the target floor during normal play.",
      pt: "A taxa de quadros fica acima do mínimo durante o jogo normal.",
    },
    web: {
      en: "Main-thread time and requestAnimationFrame timing while playing.",
      pt: "Tempo da thread principal e de requestAnimationFrame durante o uso.",
    },
    how: {
      en: "A scripted play session (tree, bench, skills) must keep the main thread under 40% busy (about 5 ms of each 16.7 ms frame today), with frame-rate floors and at most 8 long tasks.",
      pt: "Uma sessão roteirizada (árvore, bancada, habilidades) precisa manter a thread principal abaixo de 40% ocupada (cerca de 5 ms de cada quadro de 16,7 ms hoje), com mínimos de FPS e no máximo 8 tarefas longas.",
    },
    evidence: "e2e",
  },
  {
    id: "CERT-PERF-02",
    area: "perf",
    console: {
      en: "Boot to interactive within the platform's time limit.",
      pt: "Do boot até ficar interativo dentro do limite de tempo da plataforma.",
    },
    web: { en: "Page-load performance.", pt: "Performance de carregamento da página." },
    how: {
      en: "Lighthouse performance must score 90+ before every deploy, and is measured again live.",
      pt: "A performance no Lighthouse precisa ser 90+ antes de cada deploy, e é medida de novo no ar.",
    },
    evidence: "lighthouse",
  },
];
