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

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode) — persistence is best-effort.
  }
}

/**
 * useState backed by localStorage. Stored data is untrusted: it is validated on read,
 * and anything invalid falls back to `initial`.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  validate: (v: unknown) => v is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStored(key, validate) ?? initial);

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
