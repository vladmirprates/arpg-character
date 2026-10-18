import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "arpg:";

/** Reads a JSON value from localStorage; any error or failed validation yields `null`. */
export function readStored<T>(key: string, validate: (v: unknown) => v is T): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Keys whose saved value existed but couldn't be read (then reset to defaults). */
const corrupted = new Set<string>();

/** Returns, and clears, the keys found corrupted so far: the app tells the player once. */
export function takeCorrupted(): string[] {
  const keys = [...corrupted];
  corrupted.clear();
  return keys;
}

/** If an unreadable value is stored under `key`, drops it (the default is in use) and records it. */
function discardCorrupted(key: string): void {
  try {
    if (localStorage.getItem(PREFIX + key) === null) return;
    localStorage.removeItem(PREFIX + key);
    corrupted.add(key);
  } catch {
    // Storage blocked: nothing was read, so nothing is corrupted.
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode) — persistence is best-effort.
  }
}

/**
 * useState backed by localStorage. Stored data is untrusted: it is validated on read,
 * and anything invalid falls back to `initial` (and is reported through takeCorrupted()).
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  validate: (v: unknown) => v is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = readStored(key, validate);
    if (stored === null) discardCorrupted(key);
    return stored ?? initial;
  });

  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      setValue((prev) => {
        const next = typeof action === "function" ? (action as (p: T) => T)(prev) : action;
        writeStored(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
