import type { Locale } from "../../i18n/types";
import type { Priority, Species } from "./species";

export interface Ticket {
  key: string;
  speciesId: string;
  icon: string;
  title: string;
  priority: Priority;
  severity: string;
  environment: string;
  steps: string[];
  expected: string;
  actual: string;
}

export interface CaptureContext {
  species: Species;
  /** Sequential ticket number; keys start at QA-1001. */
  number: number;
  /** Name of the panel the bug was nearest to. */
  panel: string;
  x: number;
  y: number;
  browser: string;
  viewport: { w: number; h: number };
  locale: Locale;
}

const TEXT: Record<Locale, { steps: (c: CaptureContext) => string[]; expected: string }> = {
  en: {
    steps: (c) => [
      "Open the character sheet",
      `Cast Inspect Element (Q) and click the anomaly at (${Math.round(c.x)}, ${Math.round(c.y)})`,
      "Cast Capture Bug (W)",
    ],
    expected: "No bugs on the character sheet",
  },
  pt: {
    steps: (c) => [
      "Abrir a ficha de personagem",
      `Usar Inspecionar Elemento (Q) e clicar na anomalia em (${Math.round(c.x)}, ${Math.round(c.y)})`,
      "Usar Capturar Bug (W)",
    ],
    expected: "Nenhum bug na ficha de personagem",
  },
};

export function buildTicket(c: CaptureContext): Ticket {
  const { species, locale } = c;
  return {
    key: `QA-${1000 + c.number}`,
    speciesId: species.id,
    icon: species.icon,
    title: species.title[locale].replace("{panel}", c.panel),
    priority: species.priority,
    severity: species.severity[locale],
    environment: `${c.browser} · ${c.viewport.w}×${c.viewport.h} · ${locale === "pt" ? "pt-BR" : "en"}`,
    steps: TEXT[locale].steps(c),
    expected: TEXT[locale].expected,
    actual: `${species.selector} — ${species.actual[locale]}`,
  };
}

const LABELS: Record<
  Locale,
  Record<"priority" | "severity" | "environment" | "steps" | "expected" | "actual", string>
> = {
  en: {
    priority: "Priority",
    severity: "Severity",
    environment: "Environment",
    steps: "Steps to reproduce",
    expected: "Expected result",
    actual: "Actual result",
  },
  pt: {
    priority: "Prioridade",
    severity: "Severidade",
    environment: "Ambiente",
    steps: "Passos para reproduzir",
    expected: "Resultado esperado",
    actual: "Resultado obtido",
  },
};

export function ticketLabels(locale: Locale) {
  return LABELS[locale];
}

/** Plain-text ticket for the clipboard. */
export function ticketText(t: Ticket, locale: Locale): string {
  const l = LABELS[locale];
  return [
    `[${t.key}] ${t.title}`,
    `${l.priority}: ${t.priority} · ${l.severity}: ${t.severity}`,
    `${l.environment}: ${t.environment}`,
    "",
    `${l.steps}:`,
    ...t.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `${l.expected}: ${t.expected}`,
    `${l.actual}: ${t.actual}`,
  ].join("\n");
}

/** Short browser name from a user-agent string, for the ticket's environment line. */
export function browserName(ua: string): string {
  const match =
    /Edg\/(\d+)/.exec(ua) ?? /Firefox\/(\d+)/.exec(ua) ?? /Chrome\/(\d+)/.exec(ua) ?? /Version\/(\d+).*Safari/.exec(ua);
  if (!match) return "Unknown browser";
  const name = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Firefox/")
      ? "Firefox"
      : ua.includes("Chrome/")
        ? "Chrome"
        : "Safari";
  return `${name} ${match[1]}`;
}
