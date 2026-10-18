import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nProvider";
import "./Modal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Accessible name; also rendered as the visible heading. */
  title: string;
  titleId: string;
  className?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Native <dialog> in modal mode: the browser provides the focus trap, Esc to close,
 * an inert background and focus restoration — no hand-rolled trap needed.
 */
export function Modal({ open, onClose, title, titleId, className = "", headerExtra, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      // React propagates dialog events through the component tree, so a nested dialog's close/cancel
      // would also reach this one: only react to events from this dialog itself.
      onClose={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        // Esc: let our state drive the close so it stays in sync.
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <div className="modal__inner">
          <header className="modal__header">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {headerExtra}
            <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label={t("nav.close")}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
