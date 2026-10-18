import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import "./Toasts.css";

export type ToastTone = "info" | "success" | "error" | "corrupt" | "achievement";

interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

type Notify = (text: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify | null>(null);

/** Long enough to read: ~60 ms per character, at least 3.5 s, at most 10 s. */
export const readingTime = (text: string) => Math.min(10_000, Math.max(3_500, 1_500 + text.length * 60));
/** After the pointer leaves the toasts, how long the paused ones stay. */
const RESUME_MS = 2_500;
/** Announcements closer together than this are read as one. */
const TOGETHER_MS = 1_000;

/**
 * Visual toasts plus a visually-hidden live region, so every message —
 * including crafting errors — is announced to screen readers.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [announcement, setAnnouncement] = useState({ text: "", assertive: false });
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());
  const hovered = useRef(false);
  const lastAnnounced = useRef(0);

  const remove = useCallback((id: number) => {
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);
  const schedule = useCallback(
    (id: number, ms: number) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        window.setTimeout(() => remove(id), ms),
      );
    },
    [remove],
  );

  const notify = useCallback<Notify>(
    (text, tone = "info") => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, text, tone }]);
      // Messages that arrive together (an action and the achievement it unlocked) are announced
      // together; replacing the first would cut it off before a screen reader has read it.
      const assertive = tone === "error";
      const now = Date.now();
      const together = now - lastAnnounced.current < TOGETHER_MS;
      lastAnnounced.current = now;
      setAnnouncement((prev) => ({
        text:
          together && prev.assertive === assertive && prev.text && !prev.text.includes(text)
            ? `${prev.text} ${text}`
            : // Re-announce identical consecutive messages by toggling a zero-width suffix.
              prev.text === text
              ? `${text}​`
              : text,
        assertive,
      }));
      // While the pointer rests on the toasts, new ones wait too (they're scheduled on leave).
      if (hovered.current) timers.current.set(id, 0);
      else schedule(id, readingTime(text));
    },
    [schedule],
  );

  // Hovering pauses every toast (WCAG 2.2.1: timing adjustable); leaving gives a little more time.
  const pause = useCallback(() => {
    hovered.current = true;
    for (const timer of timers.current.values()) window.clearTimeout(timer);
  }, []);
  const resume = useCallback(() => {
    hovered.current = false;
    for (const id of [...timers.current.keys()]) schedule(id, RESUME_MS);
  }, [schedule]);

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-hidden="true" onPointerEnter={pause} onPointerLeave={resume}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
      <div className="visually-hidden" role="status" aria-live="polite">
        {announcement.assertive ? "" : announcement.text}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive">
        {announcement.assertive ? announcement.text : ""}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Notify {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
