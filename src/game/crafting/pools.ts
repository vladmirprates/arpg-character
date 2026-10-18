import type { L } from "../../i18n/types";
import type { BaseType } from "./types";

export interface AffixDef {
  id: string;
  /** Word used to build Magic item names ("Urgent Bug Report of Friday"). */
  name: L;
  effect: L;
}

export interface BasePool {
  baseName: L;
  prefixes: readonly AffixDef[];
  suffixes: readonly AffixDef[];
  implicits: readonly { id: string; text: L }[];
}

const a = (id: string, name: L, effect: L): AffixDef => ({ id, name, effect });

export const POOLS: Record<BaseType, BasePool> = {
  bug: {
    baseName: { en: "Bug Report", pt: "Relatório de Bug" },
    prefixes: [
      a(
        "bug_p_detailed",
        { en: "Detailed", pt: "Detalhado" },
        { en: "Adds 2 Reproduction Steps", pt: "Adiciona 2 Passos de Reprodução" },
      ),
      a(
        "bug_p_urgent",
        { en: "Urgent", pt: "Urgente" },
        { en: "Sets Priority to Critical", pt: "Define a Prioridade como Crítica" },
      ),
      a("bug_p_clean", { en: "Clean", pt: "Limpo" }, { en: "+10% Readability", pt: "+10% de Legibilidade" }),
      a(
        "bug_p_visual",
        { en: "Visual", pt: "Visual" },
        { en: "Includes Video Evidence", pt: "Inclui Evidência em Vídeo" },
      ),
      a(
        "bug_p_backend",
        { en: "Backend", pt: "de Backend" },
        { en: "Contains Server Logs", pt: "Contém Logs do Servidor" },
      ),
      a(
        "bug_p_blocking",
        { en: "Blocking", pt: "Bloqueante" },
        { en: "Prevents Release Deployment", pt: "Impede o Deploy da Release" },
      ),
      a(
        "bug_p_intermittent",
        { en: "Intermittent", pt: "Intermitente" },
        { en: "Reproduces 50% of the time", pt: "Reproduz 50% das vezes" },
      ),
      a(
        "bug_p_regression",
        { en: "Regression", pt: "de Regressão" },
        { en: "Was working in previous build", pt: "Funcionava na build anterior" },
      ),
      a(
        "bug_p_security",
        { en: "Security", pt: "de Segurança" },
        { en: "Exposes Vulnerability", pt: "Expõe uma Vulnerabilidade" },
      ),
      a(
        "bug_p_performance",
        { en: "Performance", pt: "de Performance" },
        { en: "Page Load > 5000ms", pt: "Carregamento da Página > 5000ms" },
      ),
    ],
    suffixes: [
      a(
        "bug_s_intern",
        { en: "of the Intern", pt: "do Estagiário" },
        { en: "10% chance to crash on open", pt: "10% de chance de crashar ao abrir" },
      ),
      a(
        "bug_s_friday",
        { en: "of Friday", pt: "de Sexta-feira" },
        { en: "Deploy time set to 17:00", pt: "Deploy marcado para as 17:00" },
      ),
      a(
        "bug_s_coffee",
        { en: "of Coffee", pt: "do Café" },
        { en: "Developers work 20% faster", pt: "Devs trabalham 20% mais rápido" },
      ),
      a(
        "bug_s_legacy",
        { en: "of the Legacy", pt: "do Legado" },
        { en: "References 2015 Codebase", pt: "Referencia o Código de 2015" },
      ),
      a(
        "bug_s_heisenbug",
        { en: "of the Heisenbug", pt: "do Heisenbug" },
        { en: "Disappears when Debugger is open", pt: "Some quando o Debugger está aberto" },
      ),
      a(
        "bug_s_cache",
        { en: "of the Cache", pt: "do Cache" },
        { en: "Fixed by Hard Refresh", pt: "Corrigido com Hard Refresh" },
      ),
      a(
        "bug_s_user",
        { en: "of the User", pt: "do Usuário" },
        { en: "Closed as PEBKAC / User Error", pt: "Fechado como Erro do Usuário" },
      ),
      a(
        "bug_s_typo",
        { en: "of the Typo", pt: "do Typo" },
        { en: "Fixed by changing one character", pt: "Corrigido mudando um caractere" },
      ),
      a(
        "bug_s_pingpong",
        { en: "of the Ping-Pong", pt: "do Ping-Pong" },
        { en: "Reassigned back to QA 3 times", pt: "Devolvido ao QA 3 vezes" },
      ),
      a(
        "bug_s_duplicate",
        { en: "of the Duplicate", pt: "da Duplicata" },
        { en: "Linked to a ticket from 2019", pt: "Vinculado a um ticket de 2019" },
      ),
    ],
    implicits: [
      {
        id: "bug_i_blame",
        text: { en: "Grants Level 10 'Blame the User' Skill", pt: "Concede a Habilidade 'Culpar o Usuário' Nível 10" },
      },
      {
        id: "bug_i_machine",
        text: {
          en: "Cannot be closed as 'Works on My Machine'",
          pt: "Não pode ser fechado como 'Funciona na Minha Máquina'",
        },
      },
      { id: "bug_i_feature", text: { en: "10% chance to become a Feature", pt: "10% de chance de virar uma Feature" } },
    ],
  },
  testcase: {
    baseName: { en: "Test Case", pt: "Caso de Teste" },
    prefixes: [
      a(
        "tc_p_reusable",
        { en: "Reusable", pt: "Reutilizável" },
        { en: "Can be used in Regression Suite", pt: "Pode ser usado na Suíte de Regressão" },
      ),
      a(
        "tc_p_datadriven",
        { en: "Data-Driven", pt: "Orientado a Dados" },
        { en: "Runs with 50 Dataset variations", pt: "Roda com 50 variações de Dataset" },
      ),
      a(
        "tc_p_atomic",
        { en: "Atomic", pt: "Atômico" },
        { en: "Tests only 1 feature independently", pt: "Testa só 1 funcionalidade de forma isolada" },
      ),
      a(
        "tc_p_declarative",
        { en: "Declarative", pt: "Declarativo" },
        { en: "+20% 'When/Then' clarity", pt: "+20% de clareza no 'Quando/Então'" },
      ),
      a(
        "tc_p_negative",
        { en: "Negative", pt: "Negativo" },
        { en: "Focuses on Error Handling", pt: "Foca no Tratamento de Erros" },
      ),
      a(
        "tc_p_e2e",
        { en: "End-to-End", pt: "Ponta a Ponta" },
        { en: "Validates full User Journey", pt: "Valida a Jornada completa do Usuário" },
      ),
      a(
        "tc_p_boundary",
        { en: "Boundary", pt: "de Limite" },
        { en: "Tests Min/Max input limits", pt: "Testa limites Mín/Máx de entrada" },
      ),
      a(
        "tc_p_a11y",
        { en: "Accessibility", pt: "de Acessibilidade" },
        { en: "WCAG 2.1 Compliant", pt: "Em conformidade com WCAG 2.1" },
      ),
      a(
        "tc_p_integrated",
        { en: "Integrated", pt: "Integrado" },
        { en: "Connects 3 Microservices", pt: "Conecta 3 Microsserviços" },
      ),
      a(
        "tc_p_smoke",
        { en: "Smoke", pt: "de Fumaça" },
        { en: "Fast Critical Path verification", pt: "Verificação rápida do Caminho Crítico" },
      ),
    ],
    suffixes: [
      a(
        "tc_s_ambiguity",
        { en: "of Ambiguity", pt: "da Ambiguidade" },
        { en: "Devs misinterpret the 'Given' step", pt: "Devs interpretam errado o passo 'Dado'" },
      ),
      a(
        "tc_s_spaghetti",
        { en: "of the Spaghetti", pt: "do Espaguete" },
        { en: "Scenario has 40 steps", pt: "Cenário tem 40 passos" },
      ),
      a(
        "tc_s_coverage",
        { en: "of Coverage", pt: "da Cobertura" },
        { en: "Increases Code Coverage by 2%", pt: "Aumenta a Cobertura de Código em 2%" },
      ),
      a(
        "tc_s_manual",
        { en: "of the Manual", pt: "do Manual" },
        { en: "Cannot be automated", pt: "Não pode ser automatizado" },
      ),
      a(
        "tc_s_falsepositive",
        { en: "of the False Positive", pt: "do Falso Positivo" },
        { en: "Passes even when broken", pt: "Passa mesmo quando quebrado" },
      ),
      a(
        "tc_s_hardcoding",
        { en: "of the Hardcoding", pt: "do Hardcode" },
        { en: "Breaks on Staging Environment", pt: "Quebra no Ambiente de Staging" },
      ),
      a(
        "tc_s_copypaste",
        { en: "of the Copy-Paste", pt: "do Copia-e-Cola" },
        { en: "Duplicate steps detected", pt: "Passos duplicados detectados" },
      ),
      a(
        "tc_s_precondition",
        { en: "of the Missing Precondition", pt: "da Pré-condição Ausente" },
        { en: "Assumes user is logged in", pt: "Assume que o usuário está logado" },
      ),
      a(
        "tc_s_outdated",
        { en: "of the Outdated", pt: "do Desatualizado" },
        { en: "References removed button ID", pt: "Referencia o ID de um botão removido" },
      ),
      a(
        "tc_s_bloat",
        { en: "of the Bloat", pt: "do Inchaço" },
        { en: "Scenario file exceeds 500 lines", pt: "Arquivo de cenário passa de 500 linhas" },
      ),
    ],
    implicits: [
      { id: "tc_i_fast", text: { en: "Steps are read 20% faster", pt: "Passos são lidos 20% mais rápido" } },
      { id: "tc_i_sugar", text: { en: "Syntactic Sugar: +10% Coolness", pt: "Açúcar Sintático: +10% de Estilo" } },
      { id: "tc_i_cucumber", text: { en: "Grants 'Cucumber' Aura", pt: "Concede a Aura 'Cucumber'" } },
    ],
  },
  script: {
    baseName: { en: "Auto Script", pt: "Script Automatizado" },
    prefixes: [
      a(
        "sc_p_headless",
        { en: "Headless", pt: "Headless" },
        { en: "+50% Execution Speed (No UI)", pt: "+50% de Velocidade de Execução (Sem UI)" },
      ),
      a(
        "sc_p_parallel",
        { en: "Parallel", pt: "Paralelo" },
        { en: "Can run on 4 nodes simultaneously", pt: "Roda em 4 nós simultaneamente" },
      ),
      a(
        "sc_p_retryable",
        { en: "Retryable", pt: "Re-executável" },
        { en: "Auto-retries on flake (Max 3)", pt: "Tenta de novo em flake (Máx 3)" },
      ),
      a(
        "sc_p_modular",
        { en: "Modular", pt: "Modular" },
        { en: "Uses Page Object Model", pt: "Usa Page Object Model" },
      ),
      a(
        "sc_p_apifirst",
        { en: "API-First", pt: "API-First" },
        { en: "Bypasses UI layer entirely", pt: "Ignora a camada de UI por completo" },
      ),
      a(
        "sc_p_crossbrowser",
        { en: "Cross-Browser", pt: "Cross-Browser" },
        { en: "Runs on Chrome, Firefox & Safari", pt: "Roda no Chrome, Firefox e Safari" },
      ),
      a(
        "sc_p_docker",
        { en: "Dockerized", pt: "Dockerizado" },
        { en: "Runs in isolated container", pt: "Roda em container isolado" },
      ),
      a(
        "sc_p_selfhealing",
        { en: "Self-Healing", pt: "Autorreparável" },
        { en: "Finds elements even if ID changes", pt: "Acha elementos mesmo se o ID mudar" },
      ),
      a(
        "sc_p_mocked",
        { en: "Mocked", pt: "Mockado" },
        { en: "Simulates external dependencies", pt: "Simula dependências externas" },
      ),
      a(
        "sc_p_async",
        { en: "Async", pt: "Assíncrono" },
        { en: "Non-blocking execution flow", pt: "Fluxo de execução não bloqueante" },
      ),
    ],
    suffixes: [
      a(
        "sc_s_flaky",
        { en: "of Flakiness", pt: "da Instabilidade" },
        { en: "Fails randomly 15% of the time", pt: "Falha aleatoriamente 15% das vezes" },
      ),
      a(
        "sc_s_timeout",
        { en: "of Timeout", pt: "do Timeout" },
        { en: "Waits 30s for elements", pt: "Espera 30s pelos elementos" },
      ),
      a(
        "sc_s_hardcoding",
        { en: "of Hardcoding", pt: "do Hardcode" },
        { en: "Contains 'sleep(5000)'", pt: "Contém 'sleep(5000)'" },
      ),
      a(
        "sc_s_selector",
        { en: "of the Selector", pt: "do Seletor" },
        { en: "Uses absolute XPath", pt: "Usa XPath absoluto" },
      ),
      a(
        "sc_s_race",
        { en: "of the Race Condition", pt: "da Condição de Corrida" },
        { en: "Fails on faster machines", pt: "Falha em máquinas mais rápidas" },
      ),
      a(
        "sc_s_leak",
        { en: "of the Memory Leak", pt: "do Vazamento de Memória" },
        { en: "Crashes after 100 runs", pt: "Crasha após 100 execuções" },
      ),
      a(
        "sc_s_spaghetti",
        { en: "of the Spaghetti Code", pt: "do Código Espaguete" },
        { en: "-20% Maintainability", pt: "-20% de Manutenibilidade" },
      ),
      a(
        "sc_s_deps",
        { en: "of the Dependency Hell", pt: "do Inferno de Dependências" },
        { en: "node_modules is 2GB", pt: "node_modules tem 2GB" },
      ),
      a(
        "sc_s_update",
        { en: "of the Update", pt: "da Atualização" },
        { en: "Breaks with Chrome v130 update", pt: "Quebra com a atualização do Chrome v130" },
      ),
      a(
        "sc_s_localhost",
        { en: "of the Localhost", pt: "do Localhost" },
        { en: "Works locally, fails on CI/CD", pt: "Funciona local, falha no CI/CD" },
      ),
    ],
    implicits: [
      { id: "sc_i_captcha", text: { en: "Bypasses Captcha Verification", pt: "Ignora a Verificação de Captcha" } },
      { id: "sc_i_ie11", text: { en: "Runs successfully on IE11", pt: "Roda com sucesso no IE11" } },
      { id: "sc_i_memory", text: { en: "Consumes 50% less Memory", pt: "Consome 50% menos Memória" } },
    ],
  },
};

/** Result of a Deployment Orb "brick": the item becomes this unique. */
export const BRICKED = {
  name: { en: "Undocumented Feature", pt: "Feature Não Documentada" } satisfies L,
  implicit: { en: "Cannot be Fixed", pt: "Não Pode Ser Corrigido" } satisfies L,
  mods: [
    { en: "Closed as 'Won't Fix'", pt: "Fechado como 'Não Será Corrigido'" },
    { en: "Grants Level 20 'Denial' Aura", pt: "Concede a Aura 'Negação' Nível 20" },
    { en: "100% Increased Confusion", pt: "100% de Confusão Aumentada" },
    { en: "Developers take 0 Damage from Logic", pt: "Devs recebem 0 de Dano da Lógica" },
  ] satisfies L[],
};

/** Rare names are code jargon, so they stay in English in both locales. */
export const RARE_NAME_PARTS = {
  adjectives: ["Null", "Recursive", "Fatal", "Async", "Zombie", "Broken", "Legacy"],
  nouns: ["Exception", "Overflow", "Promise", "Handler", "Cluster", "Kernel", "Build"],
} as const;

const affixIndex = new Map<string, AffixDef>(
  Object.values(POOLS).flatMap((p) => [...p.prefixes, ...p.suffixes].map((x) => [x.id, x] as const)),
);
const implicitIndex = new Map<string, L>(
  Object.values(POOLS).flatMap((p) => p.implicits.map((i) => [i.id, i.text] as const)),
);

export function getAffix(id: string): AffixDef {
  const def = affixIndex.get(id);
  if (!def) throw new Error(`Unknown affix "${id}"`);
  return def;
}

export function getImplicit(id: string): L {
  const text = implicitIndex.get(id);
  if (!text) throw new Error(`Unknown implicit "${id}"`);
  return text;
}
