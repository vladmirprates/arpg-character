import { useMemo, type CSSProperties } from "react";
import "./EmberField.css";

const COUNT = 26;

/**
 * Ambient embers drifting up the screen. Pure CSS: each ember animates only `transform`
 * and `opacity`, which run on the compositor — no canvas, no per-frame paint, no main-thread work.
 * (A canvas version with shadowBlur cost ~95% of every frame.)
 */
export function EmberField({ disabled }: { disabled: boolean }) {
  // Random but stable for the lifetime of the page.
  const embers = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        left: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 3}px`,
        duration: `${14 + Math.random() * 16}s`,
        delay: `${-Math.random() * 30}s`,
        drift: `${(Math.random() - 0.5) * 120}px`,
        hue: 20 + Math.random() * 25,
      })),
    [],
  );

  if (disabled) return null;
  return (
    <div className="ember-field" aria-hidden="true">
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={
            {
              left: e.left,
              width: e.size,
              height: e.size,
              animationDuration: e.duration,
              animationDelay: e.delay,
              "--drift": e.drift,
              "--hue": e.hue,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
