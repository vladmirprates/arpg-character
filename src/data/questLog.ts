import type { L } from "../i18n/types";

/**
 * Career as a PoE quest log: each job is an Act (oldest = Act I), its achievements are completed
 * quests, and its tools are the skills the quests required. Projects are side quests; courses and
 * certificates are trials. Source: my résumé.
 */

/** Month as "YYYY-MM". */
type Month = `${number}-${number}`;

export interface Act {
  id: string;
  role: L;
  company: string;
  /** Client projects worked on, if any. */
  clients?: string[];
  place: L;
  from: Month;
  to: Month;
  quests: L[];
  gems: string[];
}

export interface SideQuest {
  id: string;
  title: L;
  links?: { label: string; href: string }[];
  quests: L[];
  gems: string[];
}

export interface Trial {
  name: string;
  issuer: string;
  href?: string;
}

const REMOTE: L = { en: "Remote", pt: "Remoto" };
const HYBRID: L = { en: "Remote / Hybrid", pt: "Remoto / Híbrido" };

/** Chronological: Act I is the first job. */
export const ACTS: Act[] = [
  {
    id: "novigi-assistant",
    role: { en: "Software QA Assistant", pt: "Assistente de QA de Software" },
    company: "Novigi Solution",
    clients: ["Riachuelo", "J&C"],
    place: REMOTE,
    from: "2021-09",
    to: "2022-03",
    quests: [
      {
        en: "Wrote and ran comprehensive test plans, and produced detailed quality reports",
        pt: "Criei e executei planos de teste completos e produzi relatórios de qualidade detalhados",
      },
      {
        en: "Drove the software quality culture on the J&C project",
        pt: "Impulsionei a cultura de qualidade de software no projeto J&C",
      },
      {
        en: "Contributed to UX/UI design and the first product designs",
        pt: "Contribuí com o design de UX/UI e os primeiros designs do produto",
      },
      {
        en: "Turned client needs into product requirements with the architecture team",
        pt: "Transformei necessidades do cliente em requisitos de produto com o time de arquitetura",
      },
    ],
    gems: ["Test Plans", "Quality Reports", "Figma", "UX/UI"],
  },
  {
    id: "novigi-analyst",
    role: { en: "Junior Software QA Analyst", pt: "Analista de QA de Software Júnior" },
    company: "Novigi Solution",
    clients: ["Riachuelo", "Crefisa"],
    place: HYBRID,
    from: "2022-03",
    to: "2022-12",
    quests: [
      {
        en: "Led quality initiatives across four agile and traditional squads",
        pt: "Liderei iniciativas de qualidade em quatro squads ágeis e tradicionais",
      },
      {
        en: "Took part in strategic decisions, with a user-oriented testing focus",
        pt: "Participei de decisões estratégicas, com foco em testes orientados ao usuário",
      },
      {
        en: "Coordinated onboarding and training for new team members",
        pt: "Coordenei o onboarding e o treinamento de novos membros do time",
      },
      {
        en: "Led web and API test automation with Robot Framework in Python",
        pt: "Liderei a automação de testes web e de API com Robot Framework em Python",
      },
      {
        en: "Reported quality to management on a regular basis",
        pt: "Reportei a qualidade para a gestão regularmente",
      },
    ],
    gems: ["Robot Framework", "Python", "API Testing", "Agile"],
  },
  {
    id: "warmup",
    role: { en: "Test Automation Developer", pt: "Desenvolvedor de Automação de Testes" },
    company: "WarmUP Consulting",
    clients: ["Rabobank"],
    place: HYBRID,
    from: "2023-03",
    to: "2024-05",
    quests: [
      {
        en: "Owned the full lifecycle of automated workflow testing in IBM BAW for Rabobank",
        pt: "Fui responsável pelo ciclo completo dos testes automatizados de workflows no IBM BAW para o Rabobank",
      },
      {
        en: "Built the suites with Java, Selenium, Cucumber and a custom framework",
        pt: "Construí as suítes com Java, Selenium, Cucumber e um framework próprio",
      },
      {
        en: "Took part in agile ceremonies, pipeline management and documentation",
        pt: "Participei das cerimônias ágeis, da gestão de pipelines e da documentação",
      },
      {
        en: "Worked with the global team in English to resolve issues",
        pt: "Trabalhei com o time global em inglês para resolver problemas",
      },
    ],
    gems: ["Java", "Selenium", "Cucumber", "IBM BAW", "CI/CD"],
  },
  {
    id: "gft",
    role: { en: "Mid-level Software QA", pt: "QA de Software Pleno" },
    company: "GFT Technologies",
    place: REMOTE,
    from: "2024-09",
    to: "2026-07",
    quests: [
      {
        en: "Planned and ran end-to-end testing for web and mobile apps across Salesforce and banking-correspondent (Corban) integrations",
        pt: "Planejei e executei testes end-to-end de apps web e mobile em integrações com Salesforce e correspondentes bancários (Corban)",
      },
      {
        en: "Kept deliveries compliant with strict business requirements",
        pt: "Garanti entregas em conformidade com requisitos de negócio rigorosos",
      },
      {
        en: "Built and maintained automated suites with Selenium, Playwright and Java, raising efficiency and coverage",
        pt: "Criei e mantive suítes automatizadas com Selenium, Playwright e Java, aumentando eficiência e cobertura",
      },
    ],
    gems: ["Playwright", "Selenium", "Java", "Salesforce", "Mobile"],
  },
];

export const SIDE_QUESTS: SideQuest[] = [
  {
    id: "api-challenge",
    title: { en: "API Automation Technical Challenge", pt: "Desafio Técnico de Automação de API" },
    links: [{ label: "GitLab", href: "https://gitlab.com/vladmirprates/desafio-automacao-api" }],
    quests: [
      {
        en: "Built a REST API suite with Playwright Test (Node.js / ESM) covering full CRUD scenarios",
        pt: "Construí uma suíte de API REST com Playwright Test (Node.js / ESM) cobrindo cenários CRUD completos",
      },
      {
        en: "Isolated test data with Faker.js and handled JWT authentication, with zero hardcoded credentials",
        pt: "Isolei dados de teste com Faker.js e tratei autenticação JWT, sem credenciais fixas no código",
      },
      {
        en: "Shifted left with GitLab CI/CD, plus Postman collections for exploratory testing",
        pt: "Shift-left com GitLab CI/CD, além de coleções do Postman para testes exploratórios",
      },
    ],
    gems: ["Playwright", "Node.js", "Faker.js", "JWT", "GitLab CI", "Postman"],
  },
  {
    id: "mobile-challenge",
    title: { en: "Mobile Automation Technical Challenge", pt: "Desafio Técnico de Automação Mobile" },
    links: [{ label: "GitLab", href: "https://gitlab.com/vladmirprates/desafio-automacao-mobile" }],
    quests: [
      {
        en: "Built a cross-platform-ready suite with WebdriverIO, Appium and Mocha using the Page Object Model",
        pt: "Construí uma suíte pronta para multiplataforma com WebdriverIO, Appium e Mocha usando Page Object Model",
      },
      {
        en: "Ran E2E scenarios on Android emulators and BrowserStack cloud devices, including gestures",
        pt: "Executei cenários E2E em emuladores Android e dispositivos na nuvem do BrowserStack, incluindo gestos",
      },
      {
        en: "Ran the suite continuously in GitLab CI/CD with Allure reports",
        pt: "Executei a suíte continuamente no GitLab CI/CD com relatórios Allure",
      },
    ],
    gems: ["WebdriverIO", "Appium", "Mocha", "BrowserStack", "Allure"],
  },
  {
    id: "portfolio",
    title: { en: "This Portfolio: QA Character Sheet", pt: "Este Portfólio: Ficha de Personagem de QA" },
    links: [{ label: "GitHub", href: "https://github.com/vladmirprates/arpg-character" }],
    quests: [
      {
        en: "Built an ARPG-style portfolio in React and TypeScript: passive tree, crafting bench and a bug hunt",
        pt: "Construí um portfólio estilo ARPG em React e TypeScript: árvore passiva, bancada de criação e uma caça aos bugs",
      },
      {
        en: "Tested it like a product: unit, property-based, end-to-end, visual regression and accessibility tests",
        pt: "Testei como um produto: testes de unidade, baseados em propriedades, end-to-end, regressão visual e acessibilidade",
      },
      {
        en: "Gated every change in CI with Lighthouse budgets and WCAG checks (axe)",
        pt: "Cada mudança passa por CI com metas do Lighthouse e verificações WCAG (axe)",
      },
    ],
    gems: ["React", "TypeScript", "Vitest", "Playwright", "axe", "Lighthouse"],
  },
  {
    id: "community",
    title: {
      en: "Community Game Tools: Hell Clock Wiki & Last Epoch Tools",
      pt: "Ferramentas da Comunidade: Wiki do Hell Clock e Last Epoch Tools",
    },
    quests: [
      {
        en: "Founded the official Hell Clock community wiki on wiki.gg, designing its structure, layout and documentation",
        pt: "Fundei a wiki oficial da comunidade de Hell Clock no wiki.gg, criando estrutura, layout e documentação",
      },
      {
        en: "Translated and reviewed Last Epoch Tools' UI strings into Brazilian Portuguese",
        pt: "Traduzi e revisei os textos de interface do Last Epoch Tools para português do Brasil",
      },
    ],
    gems: ["Localization", "PT-BR", "Documentation", "wiki.gg"],
  },
  {
    id: "discord",
    title: {
      en: "Community Moderation: Last Epoch Brasil & Hell Clock Discords",
      pt: "Moderação de Comunidades: Discords do Last Epoch Brasil e do Hell Clock",
    },
    quests: [
      {
        en: "Admin of the Last Epoch Brasil Discord server",
        pt: "Administrador do servidor de Discord do Last Epoch Brasil",
      },
      {
        en: "Moderator of the Hell Clock Discord server",
        pt: "Moderador do servidor de Discord do Hell Clock",
      },
      {
        en: "Keep the communities welcoming and on-topic: moderation, rules and helping players",
        pt: "Mantenho as comunidades acolhedoras e organizadas: moderação, regras e ajuda aos jogadores",
      },
    ],
    gems: ["Discord", "Moderation", "Community Management", "Player Support"],
  },
];

export const TRIALS: Trial[] = [
  { name: "EFSET English Certificate — C2 Proficient", issuer: "EF SET", href: "https://cert.efset.org/1mXv42" },
  { name: "Scrum Fundamentals Certified (SFC)", issuer: "SCRUMstudy" },
  { name: "Test Automation with Selenium WebDriver and Java", issuer: "Julio de Lima" },
  { name: "RoboCamp 6 — Full Stack Automation in Robot Framework", issuer: "QA Ninja" },
  { name: "Web Accessibility Training Program", issuer: "Alura" },
  { name: "Data Privacy and Protection (LGPD)", issuer: "Senai" },
  { name: "DevOps Foundation", issuer: "Estabilis" },
];

/** Whole months between two "YYYY-MM" months, counting both ends. */
export function monthsBetween(from: Month, to: Month): number {
  const [fy, fm] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  return (ty - fy) * 12 + (tm - fm) + 1;
}
