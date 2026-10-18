import { act, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { useSettings } from "../../app/SettingsProvider";
import { renderWithProviders } from "../../test/render";
import { GamepadController } from "./GamepadController";

/**
 * jsdom has no layout, so elements get boxes from data-box="left top": enough for the D-pad's
 * spatial navigation to pick neighbours, and for focusables to count as rendered.
 */
const rectOf = (el: Element) => {
  const [left = 0, top = 0] = (el.getAttribute("data-box") ?? "0 0").split(" ").map(Number);
  return new DOMRect(left, top, 40, 40);
};
const originals = {
  rect: Element.prototype.getBoundingClientRect,
  rects: Element.prototype.getClientRects,
  scroll: Element.prototype.scrollIntoView,
};
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    return rectOf(this);
  };
  Element.prototype.getClientRects = function (this: Element) {
    return [rectOf(this)] as unknown as DOMRectList;
  };
  Element.prototype.scrollIntoView = () => {};
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = originals.rect;
  Element.prototype.getClientRects = originals.rects;
  Element.prototype.scrollIntoView = originals.scroll;
});

const pad = {
  id: "Test Pad (STANDARD GAMEPAD)",
  connected: true,
  buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
  axes: [0, 0, 0, 0],
};
beforeEach(() => {
  pad.connected = true;
  pad.buttons.forEach((b) => (b.pressed = false));
  pad.axes = [0, 0, 0, 0];
  Object.defineProperty(navigator, "getGamepads", {
    configurable: true,
    value: () => [pad.connected ? pad : null],
  });
});

const frame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
async function press(button: number) {
  pad.buttons[button]!.pressed = true;
  await frame();
  await frame();
  pad.buttons[button]!.pressed = false;
  await frame();
}
function connect() {
  act(() => {
    const e = new Event("gamepadconnected");
    Object.defineProperty(e, "gamepad", { value: pad });
    window.dispatchEvent(e);
  });
}

function PerfState() {
  return <span data-testid="perf">{String(useSettings().perfOverlay)}</span>;
}

function Page({ onArrow, onA }: { onArrow?: () => void; onA?: () => void }) {
  return (
    <>
      <GamepadController />
      <PerfState />
      <button type="button" data-testid="open-tree" data-box="0 0" onClick={onA}>
        Tree
      </button>
      <button type="button" data-testid="right" data-box="100 0">
        Right
      </button>
      <button type="button" data-testid="below" data-box="0 100">
        Below
      </button>
      <div
        role="grid"
        tabIndex={0}
        data-testid="grid"
        data-box="100 100"
        onKeyDown={(e) => {
          if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            onArrow?.();
          }
        }}
      />
    </>
  );
}

describe("<GamepadController />", () => {
  test("announces the controller and shows its button prompts", () => {
    renderWithProviders(<Page />);
    expect(screen.queryByTestId("gamepad-hints")).toBeNull();
    connect();
    expect(screen.getByRole("status")).toHaveTextContent("Controller connected: Test Pad");
    expect(screen.getByTestId("gamepad-hints")).toHaveTextContent("Test Pad");
  });

  test("Menu jumps to the features, the D-pad moves to the neighbour, A clicks", async () => {
    const onA = vi.fn();
    renderWithProviders(<Page onA={onA} />);
    connect();
    await press(9); // Menu
    expect(screen.getByTestId("open-tree")).toHaveFocus();
    expect(document.documentElement.dataset.input).toBe("gamepad");
    await press(15); // right
    expect(screen.getByTestId("right")).toHaveFocus();
    await press(14); // left
    await press(13); // down
    expect(screen.getByTestId("below")).toHaveFocus();
    await press(12); // up
    expect(screen.getByTestId("open-tree")).toHaveFocus();
    await press(0); // A
    expect(onA).toHaveBeenCalledTimes(1);
  });

  test("the left stick works as a D-pad, and a widget with its own arrow keys keeps them", async () => {
    const onArrow = vi.fn();
    renderWithProviders(<Page onArrow={onArrow} />);
    connect();
    await press(0); // A with nothing focused focuses the first element
    expect(screen.getByTestId("open-tree")).toHaveFocus();
    pad.axes = [0.9, 0, 0, 0];
    await frame();
    pad.axes = [0, 0, 0, 0];
    await frame();
    expect(screen.getByTestId("right")).toHaveFocus();
    act(() => screen.getByTestId("grid").focus());
    await press(13);
    expect(onArrow).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("grid")).toHaveFocus();
  });

  test("B closes the top dialog; shoulder buttons press skill keys; View toggles the FPS overlay", async () => {
    renderWithProviders(<Page />);
    connect();
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.showModal();
    await press(1); // B
    expect(dialog.open).toBe(false);
    dialog.remove();

    const keys: string[] = [];
    const onKey = (e: KeyboardEvent) => keys.push(e.key);
    window.addEventListener("keydown", onKey);
    for (const b of [2, 3, 4, 5, 7]) await press(b);
    window.removeEventListener("keydown", onKey);
    expect(keys).toEqual(["q", "w", "e", "r", "t"]);

    await press(8); // View
    expect(screen.getByTestId("perf")).toHaveTextContent("true");
  });

  test("the right stick scrolls the page", async () => {
    const scrollBy = vi.fn();
    Object.defineProperty(document, "scrollingElement", { configurable: true, value: { scrollBy } });
    renderWithProviders(<Page />);
    connect();
    pad.axes = [0, 0, 0, 1];
    await frame();
    pad.axes = [0, 0, 0, 0];
    expect(scrollBy).toHaveBeenCalledWith(0, expect.any(Number));
  });

  test("unplugging is announced, and mouse input drops the controller focus style", async () => {
    renderWithProviders(<Page />);
    connect();
    await press(9);
    expect(document.documentElement.dataset.input).toBe("gamepad");
    act(() => {
      pad.connected = false;
      window.dispatchEvent(new Event("gamepaddisconnected"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Controller disconnected");
    await waitFor(() => expect(screen.queryByTestId("gamepad-hints")).toBeNull());
    expect(document.documentElement.dataset.input).toBeUndefined();
  });
});
