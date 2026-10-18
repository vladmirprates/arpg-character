import { useCallback, useId, type CSSProperties, type ReactNode } from "react";
import type { ItemRarity } from "../data/equipment";
import { TREE_ICONS, iconViewBox } from "../game/tree/icons.generated";
import { useTooltip, type Placement } from "./Tooltip";
import { clearCopyTarget, setCopyTarget } from "./copyTarget";
import "./ItemSlot.css";

interface Props {
  label: string;
  /** Full plain-text description for assistive tech. */
  description?: string;
  icon?: string;
  /** game-icons.net icon name, drawn inline and tinted by rarity (used for crafted items). */
  glyph?: string;
  rarity?: ItemRarity;
  tooltip?: ReactNode;
  placement?: Placement;
  /** Text copied by Ctrl+C while hovered/focused. */
  copyText?: () => string;
  /** "fill" stretches to its grid area (PoE-style multi-cell items). */
  shape?: "square" | "tall" | "wide" | "flask" | "small" | "fill";
  style?: CSSProperties;
  /** Stack count shown in the corner, PoE-style. */
  stack?: number;
  className?: string;
  onActivate?: () => void;
  children?: ReactNode;
  testId?: string;
  /** Marks a planted bug for the "Find the Bugs" challenge. */
  planted?: string;
}

export function ItemSlot({
  label,
  description,
  icon,
  glyph,
  rarity,
  tooltip,
  placement = "right",
  copyText,
  shape = "square",
  style,
  stack,
  className = "",
  onActivate,
  children,
  testId,
  planted,
}: Props) {
  const tip = useTooltip<HTMLButtonElement>(tooltip, placement);
  const descId = useId();
  const empty = !icon && !glyph;

  const engage = useCallback(() => copyText && setCopyTarget(copyText), [copyText]);
  const disengage = useCallback(() => copyText && clearCopyTarget(copyText), [copyText]);

  const classes = `slot slot--${shape} ${rarity ? `rarity-${rarity}` : ""} ${empty ? "slot--empty" : ""} ${className}`;

  // Empty, inert cells are decoration, not controls.
  if (empty && !onActivate) {
    return <div className={classes} style={style} aria-hidden="true" data-testid={testId} />;
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-label={stack ? `${label} (${stack})` : label}
      aria-describedby={description ? descId : undefined}
      data-testid={testId}
      data-planted-bug={planted}
      ref={tip.ref}
      onPointerEnter={(e) => {
        if (tooltip) tip.onPointerEnter(e);
        engage();
      }}
      onPointerLeave={() => {
        if (tooltip) tip.onPointerLeave();
        disengage();
      }}
      onFocus={() => {
        if (tooltip) tip.onFocus();
        engage();
      }}
      onBlur={() => {
        if (tooltip) tip.onBlur();
        disengage();
      }}
      onClick={onActivate}
    >
      {icon && <img src={icon} alt="" className="slot__icon" draggable={false} />}
      {glyph && (
        <svg className="slot__icon slot__glyph" viewBox={iconViewBox(glyph)} aria-hidden="true">
          {TREE_ICONS[glyph]?.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      )}
      {/* Count is drawn by CSS from data-stack; the accessible name already carries it (WCAG 2.5.3). */}
      {stack !== undefined && <span className="slot__stack" data-stack={stack} aria-hidden="true" />}
      {children}
      {description && (
        <span id={descId} className="visually-hidden">
          {description}
        </span>
      )}
    </button>
  );
}
