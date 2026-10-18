import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useToast } from "../../components/Toasts";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useI18n } from "../../i18n/I18nProvider";
import { PLANTED_BUGS, PLANTED_IDS } from "./plantedBugs";

interface Bounty {
  /** A hunt is running: the bugs not yet found are planted on the page. */
  active: boolean;
  found: ReadonlySet<string>;
  /** Is this bug on the page right now? (Hunt running and not found yet.) */
  isPlanted: (id: string) => boolean;
  /**
   * What a functional bug has left behind so far (e.g. the stash item it saved wrong, the cell it
   * duplicated into). Those spots are what Inspect Element can report.
   */
  evidence: (id: string) => readonly string[];
  addEvidence: (id: string, key: string) => void;
  clearEvidence: (id: string) => void;
  /** Plants all five bugs and starts a fresh hunt. */
  start: () => void;
  /** Gives up: every bug is fixed and progress is cleared. */
  stop: () => void;
  /** Records a find, which also fixes that bug; returns true when it was planted. */
  report: (id: string) => boolean;
}

interface Stored {
  active: boolean;
  found: string[];
  evidence: Record<string, string[]>;
}

const BountyContext = createContext<Bounty | null>(null);
const IDLE: Stored = { active: false, found: [], evidence: {} };
const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const isStored = (v: unknown): v is Stored =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Stored).active === "boolean" &&
  isStringList((v as Stored).found) &&
  typeof (v as Stored).evidence === "object" &&
  (v as Stored).evidence !== null &&
  Object.values((v as Stored).evidence).every(isStringList);

const NONE: readonly string[] = [];

/**
 * "Find the Bugs": the page is clean until the visitor starts a hunt. Starting plants five bugs —
 * some visible, some that only show up when you use a feature; each one found is fixed on the spot.
 * Kept across reloads, so a hunt survives a refresh.
 */
export function BountyProvider({ children }: { children: ReactNode }) {
  const { t, l } = useI18n();
  const notify = useToast();
  const [stored, setStored] = usePersistentState<Stored>("bounty", IDLE, isStored);
  const found = useMemo(() => new Set(stored.found.filter((id) => PLANTED_IDS.has(id))), [stored.found]);
  const { active } = stored;

  const isPlanted = useCallback((id: string) => active && !found.has(id), [active, found]);
  const evidence = useCallback((id: string) => stored.evidence[id] ?? NONE, [stored.evidence]);

  const addEvidence = useCallback(
    (id: string, key: string) =>
      setStored((s) =>
        s.evidence[id]?.includes(key)
          ? s
          : { ...s, evidence: { ...s.evidence, [id]: [...(s.evidence[id] ?? []), key] } },
      ),
    [setStored],
  );
  const clearEvidence = useCallback(
    (id: string) =>
      setStored((s) => {
        if (!s.evidence[id]) return s;
        const { [id]: _, ...rest } = s.evidence;
        return { ...s, evidence: rest };
      }),
    [setStored],
  );

  const start = useCallback(() => {
    setStored({ active: true, found: [], evidence: {} });
    notify(t("bounty.started"), "success");
  }, [setStored, notify, t]);

  // Giving up keeps the evidence just long enough for features to undo their bug's effects.
  const stop = useCallback(() => setStored((s) => ({ ...IDLE, evidence: s.evidence })), [setStored]);

  const report = useCallback(
    (id: string) => {
      const bug = PLANTED_BUGS.find((b) => b.id === id);
      if (!bug || !isPlanted(id)) return false;
      const next = [...found, id];
      const done = next.length === PLANTED_BUGS.length;
      // The last find ends the hunt; the page is clean again either way.
      setStored((s) => ({ ...s, active: !done, found: next }));
      notify(
        done
          ? t("bounty.allFound")
          : t("bounty.found", { title: l(bug.title), n: next.length, total: PLANTED_BUGS.length }),
        "success",
      );
      return true;
    },
    [found, isPlanted, notify, setStored, t, l],
  );

  const value = useMemo(
    () => ({ active, found, isPlanted, evidence, addEvidence, clearEvidence, start, stop, report }),
    [active, found, isPlanted, evidence, addEvidence, clearEvidence, start, stop, report],
  );
  return <BountyContext.Provider value={value}>{children}</BountyContext.Provider>;
}

export function useBounty(): Bounty {
  const ctx = useContext(BountyContext);
  if (!ctx) throw new Error("useBounty must be used inside <BountyProvider>");
  return ctx;
}

/** For a planted spot: whether its bug is on the page, and the marker Inspect Element looks for. */
export function usePlanted(id: string) {
  const planted = useBounty().isPlanted(id);
  return { planted, marker: planted ? { "data-planted-bug": id } : {} };
}
