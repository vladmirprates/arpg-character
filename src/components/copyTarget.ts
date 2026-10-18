/**
 * Ctrl+C on a hovered or focused item copies its text, as in ARPG trade workflows.
 * Items register themselves here on hover/focus; one global key handler does the copy.
 */
let current: (() => string) | null = null;

export function setCopyTarget(getText: (() => string) | null) {
  current = getText;
}

export function clearCopyTarget(getText: () => string) {
  if (current === getText) current = null;
}

export function getCopyText(): string | null {
  return current ? current() : null;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
