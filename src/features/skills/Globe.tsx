import { useId, type CSSProperties } from "react";

interface Props {
  kind: "sanity" | "coffee";
  label: string;
  value: number;
  max: number;
  /** Find the Bugs marker, while a planted bug has affected this globe. */
  planted?: string;
}

/**
 * The surface and body of the fluid are ONE continuous path (wavy top flowing straight down),
 * so there is no seam between "wave" and "liquid". Viewbox is 200 wide (two wave periods) so the
 * layer can loop seamlessly by sliding -50%.
 */
const FLUID = "M0 14 C 25 4, 25 4, 50 14 S 75 24, 100 14 S 125 4, 150 14 S 175 24, 200 14 V 400 H 0 Z";

/**
 * Life/mana-style resource orb. The fluid layer is moved with `transform` (GPU-composited) and
 * eased between updates, so regeneration flows instead of stepping. Two fluid layers drift in
 * opposite directions at different speeds, which reads as a living surface.
 */
export function Globe({ kind, label, value, max, planted }: Props) {
  const fill = Math.max(0, Math.min(1, value / max));
  const id = useId().replace(/:/g, "");

  return (
    <div
      className={`globe globe--${kind}`}
      data-planted-bug={planted}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{ "--fill": fill } as CSSProperties}
    >
      <div className="globe__glass">
        <div className="globe__liquid">
          {(["back", "front"] as const).map((layer) => (
            <svg
              key={layer}
              className={`globe__fluid globe__fluid--${layer}`}
              viewBox="0 0 200 400"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`${id}-${layer}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: "var(--liquid-hi)" }} />
                  <stop offset="0.12" style={{ stopColor: "var(--liquid)" }} />
                  <stop offset="1" style={{ stopColor: "var(--liquid-deep)" }} />
                </linearGradient>
              </defs>
              <path d={FLUID} fill={`url(#${id}-${layer})`} />
            </svg>
          ))}
        </div>
        <div className="globe__shine" aria-hidden="true" />
      </div>
      <span className="globe__value" aria-hidden="true">
        {Math.round(value)}/{max}
      </span>
      <span className="globe__label" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
