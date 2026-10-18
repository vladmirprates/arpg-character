import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSfxEnabled } from "../audio/sfx";
import { usePersistentState } from "../hooks/usePersistentState";

interface Settings {
  sound: boolean;
  setSound: (on: boolean) => void;
  /** True when the OS asks for reduced motion OR the user toggled it on. */
  reducedMotion: boolean;
  motionOverride: boolean;
  setMotionOverride: (on: boolean) => void;
}

const SettingsContext = createContext<Settings | null>(null);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = usePersistentState("sound", true, isBool);
  const [motionOverride, setMotionOverride] = usePersistentState("reduceMotion", false, isBool);
  const system = useSystemReducedMotion();
  const reducedMotion = system || motionOverride;

  useEffect(() => setSfxEnabled(sound), [sound]);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-reduced-motion", reducedMotion);
  }, [reducedMotion]);

  const value = useMemo(
    () => ({ sound, setSound, reducedMotion, motionOverride, setMotionOverride }),
    [sound, setSound, reducedMotion, motionOverride, setMotionOverride],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
