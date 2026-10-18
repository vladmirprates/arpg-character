import { Fragment, type ReactNode } from "react";

const TOKEN = /\[([^\]]+)\]|\{([^}]+)\}|\(\(([^)]+)\)\)/g;

/**
 * Renders the item-text mini markup — [augmented] {highlight} ((warning)) — as React nodes.
 * Content is never injected as HTML, so data can't smuggle markup into the page.
 */
export function Markup({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, aug, hi, warn] = m;
    const cls = aug ? "tone-aug" : hi ? "tone-hi" : "tone-warn";
    out.push(
      <span key={m.index} className={cls}>
        {aug ?? hi ?? warn}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

/** Same text with the markup stripped — for aria-labels and the clipboard. */
export function plainText(text: string): string {
  return text.replace(
    TOKEN,
    (_, a: string | undefined, b: string | undefined, c: string | undefined) => a ?? b ?? c ?? "",
  );
}
