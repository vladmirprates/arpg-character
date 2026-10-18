import { render } from "@testing-library/react";
import { useRef } from "react";
import { vi } from "vitest";
import { useTopLayer } from "./useTopLayer";

function Hud() {
  const ref = useRef<HTMLDivElement>(null);
  useTopLayer(ref);
  return <div ref={ref} popover="manual" data-testid="hud" />;
}

describe("useTopLayer", () => {
  test("shows the popover, re-raises it above a dialog that opens later, and hides it on unmount", async () => {
    // jsdom has no popover API: emulate showPopover/hidePopover and :popover-open.
    let open = false;
    const show = vi.fn(() => (open = true));
    const hide = vi.fn(() => (open = false));
    const proto = HTMLElement.prototype as HTMLElement & Record<string, unknown>;
    const matches = proto.matches;
    Object.assign(proto, { showPopover: show, hidePopover: hide });
    proto.matches = function (this: Element, selector: string) {
      return selector === ":popover-open" ? open : matches.call(this, selector);
    } as typeof matches;

    const { unmount } = render(<Hud />);
    expect(show).toHaveBeenCalledTimes(1);

    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    await new Promise((r) => setTimeout(r, 0)); // MutationObserver callbacks are microtasks
    expect(hide).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(2);

    unmount();
    expect(hide).toHaveBeenCalledTimes(2);
    dialog.remove();
    Reflect.deleteProperty(proto, "showPopover");
    Reflect.deleteProperty(proto, "hidePopover");
    proto.matches = matches;
  });

  test("does nothing where the popover API is missing", () => {
    expect(() => render(<Hud />)).not.toThrow();
  });
});
