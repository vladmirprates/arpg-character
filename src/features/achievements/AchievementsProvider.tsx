import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { playSfx } from "../../audio/sfx";
import { useToast } from "../../components/Toasts";
import { ACHIEVEMENTS } from "../../data/achievements";
import { applyEvent, EMPTY_ACHIEVEMENTS, isAchievementState, type AchievementState } from "../../game/achievements";
import { subscribe } from "../../game/events";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useI18n } from "../../i18n/I18nProvider";

interface Achievements {
  state: AchievementState;
  unlockedCount: number;
  reset: () => void;
}

const AchievementsContext = createContext<Achievements | null>(null);

/**
 * Listens to the gameplay event stream and unlocks achievements as their rules are met.
 * Progress is kept across reloads; each unlock gets its own toast and sound.
 */
export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { t, l } = useI18n();
  const notify = useToast();
  const [state, setState] = usePersistentState("achievements", EMPTY_ACHIEVEMENTS, isAchievementState);
  // Events can arrive several per render (e.g. a find that also completes the hunt), so each one
  // builds on the latest state rather than on the value this render saw.
  const latest = useRef(state);
  latest.current = state;

  useEffect(
    () =>
      subscribe((event) => {
        const result = applyEvent(latest.current, event, ACHIEVEMENTS, Date.now());
        if (result.state === latest.current) return;
        latest.current = result.state;
        setState(result.state);
        for (const id of result.unlocked) {
          const a = ACHIEVEMENTS.find((x) => x.id === id)!;
          notify(t("ach.unlocked", { title: l(a.title) }), "achievement");
        }
        if (result.unlocked.length) playSfx("orbRare");
      }),
    [setState, notify, t, l],
  );

  const reset = useCallback(() => setState(EMPTY_ACHIEVEMENTS), [setState]);
  const unlockedCount = ACHIEVEMENTS.filter((a) => state.unlocked[a.id] !== undefined).length;

  const value = useMemo(() => ({ state, unlockedCount, reset }), [state, unlockedCount, reset]);
  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

export function useAchievements(): Achievements {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used inside <AchievementsProvider>");
  return ctx;
}
