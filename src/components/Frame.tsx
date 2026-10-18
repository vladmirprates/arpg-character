import type { ReactNode } from "react";
import "./Frame.css";

/** Filigree corner ornament — the signature motif of the UI. */
function Corner({ className }: { className: string }) {
  return (
    <svg className={`frame__corner ${className}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M2 38V14C2 7 7 2 14 2h24" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 38V17c0-5.5 4.5-10 10-10h21" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <path d="M2 2l7 7" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9" y="9" width="5" height="5" transform="rotate(45 11.5 11.5)" fill="currentColor" />
    </svg>
  );
}

interface FrameProps {
  title?: ReactNode;
  titleId?: string;
  as?: "section" | "div" | "aside";
  className?: string;
  children: ReactNode;
  headingLevel?: 2 | 3;
  labelledBy?: string;
}

export function Frame({
  title,
  titleId,
  as: Tag = "section",
  className = "",
  children,
  headingLevel = 2,
  labelledBy,
}: FrameProps) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <Tag className={`frame ${className}`} aria-labelledby={labelledBy ?? (title ? titleId : undefined)}>
      <Corner className="frame__corner--tl" />
      <Corner className="frame__corner--tr" />
      <Corner className="frame__corner--bl" />
      <Corner className="frame__corner--br" />
      {title && (
        <H id={titleId} className="frame__title">
          <span>{title}</span>
        </H>
      )}
      {children}
    </Tag>
  );
}

export function SubHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 className="frame__subtitle" id={id}>
      <span>{children}</span>
    </h3>
  );
}
