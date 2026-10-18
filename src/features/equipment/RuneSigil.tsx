import { SIGIL_INSCRIPTION, toRunes } from "./runes";

/** Circumference of the inscription path (r = 172). */
const TEXT_LENGTH = 2 * Math.PI * 172;
const INSCRIPTION = toRunes(SIGIL_INSCRIPTION.replaceAll("·", " "));

/**
 * Slowly turning summoning circle. Decorative; the ring of runes spells SIGIL_INSCRIPTION in Elder Futhark.
 * Each ring is its own <svg> element rotated as a whole, so the browser can rotate a cached
 * GPU layer instead of repainting the vector art every frame (rotating inner <g>s repaints).
 */
export function RuneSigil({ className = "" }: { className?: string }) {
  return (
    <div className={`sigil ${className}`} aria-hidden="true">
      <svg className="sigil__layer sigil__glow" viewBox="0 0 400 400" focusable="false">
        <defs>
          <radialGradient id="sigil-glow">
            <stop offset="0%" stopColor="rgb(239 154 69 / 0.18)" />
            <stop offset="70%" stopColor="rgb(239 154 69 / 0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="198" fill="url(#sigil-glow)" />
      </svg>
      <svg className="sigil__layer sigil__outer" viewBox="0 0 400 400" focusable="false">
        <defs>
          <path id="sigil-text" d="M200 200m-172 0a172 172 0 1 1 344 0a172 172 0 1 1-344 0" />
        </defs>
        <circle cx="200" cy="200" r="186" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <circle
          cx="200"
          cy="200"
          r="160"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="2 6"
          opacity="0.6"
        />
        {/* textLength stretches the inscription to close the ring exactly. */}
        <text fontSize="15" fill="currentColor" opacity="0.55">
          <textPath href="#sigil-text" textLength={TEXT_LENGTH} lengthAdjust="spacing">
            {INSCRIPTION}
          </textPath>
        </text>
      </svg>
      <svg className="sigil__layer sigil__inner" viewBox="0 0 400 400" focusable="false">
        <polygon points="200,58 323,271 77,271" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
        <polygon points="200,342 77,129 323,129" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.45" />
        <circle cx="200" cy="200" r="142" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="200" r="70" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.35" />
      </svg>
    </div>
  );
}
