import { useEffect, type RefObject } from "react";

/**
 * Keeps a `popover="manual"` element shown in the top layer, above any modal <dialog> that opens
 * after it. Native modal dialogs live in the top layer too, so a HUD (the FPS overlay, controller
 * hints) would otherwise disappear behind the passive tree or the bench.
 */
export function useTopLayer(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el?.showPopover) return;
    const raise = () => {
      if (el.matches(":popover-open")) el.hidePopover();
      el.showPopover();
    };
    raise();
    // The top layer is ordered by insertion: re-showing moves the element above the new dialog.
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.target instanceof HTMLDialogElement && r.target.open)) raise();
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => {
      observer.disconnect();
      if (el.matches(":popover-open")) el.hidePopover();
    };
  }, [ref]);
}
