import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { ToastProvider, readingTime, useToast } from "./Toasts";

function Trigger({ text }: { text: string }) {
  const notify = useToast();
  return (
    <button type="button" onClick={() => notify(text, "success")}>
      notify
    </button>
  );
}

const shown = (text: string) => document.querySelector(".toasts")!.textContent!.includes(text);

afterEach(() => vi.useRealTimers());

describe("toasts", () => {
  test("stay up long enough to read: longer messages last longer, within limits", () => {
    expect(readingTime("Saved")).toBe(3_500);
    expect(readingTime("Bug found and fixed: Stack size doesn't match its tooltip (2/5)")).toBeGreaterThan(5_000);
    expect(readingTime("x".repeat(500))).toBe(10_000);
  });

  test("a long message is still on screen after the old fixed 2.6 s, then goes", () => {
    vi.useFakeTimers();
    const text = "Bug found and fixed: Ctrl+click duplicates items instead of moving them (3/5)";
    render(
      <ToastProvider>
        <Trigger text={text} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "notify" }));
    act(() => vi.advanceTimersByTime(2_600));
    expect(shown(text)).toBe(true);
    act(() => vi.advanceTimersByTime(readingTime(text)));
    expect(shown(text)).toBe(false);
  });

  test("hovering pauses a toast until the pointer leaves", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger text="Bug found and fixed" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "notify" }));
    fireEvent.pointerEnter(document.querySelector(".toasts")!);
    act(() => vi.advanceTimersByTime(60_000));
    expect(shown("Bug found and fixed")).toBe(true);

    fireEvent.pointerLeave(document.querySelector(".toasts")!);
    act(() => vi.advanceTimersByTime(3_000));
    expect(shown("Bug found and fixed")).toBe(false);
  });

  test("messages that arrive together are announced together, so the first isn't cut off", () => {
    vi.useFakeTimers();
    function Pair() {
      const notify = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            notify("Item copied to clipboard", "success");
            notify("Achievement unlocked: Price Check", "achievement");
          }}
        >
          pair
        </button>
      );
    }
    render(
      <ToastProvider>
        <Pair />
        <Trigger text="Later message" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "pair" }));
    expect(screen.getByRole("status")).toHaveTextContent("Item copied to clipboard Achievement unlocked: Price Check");
    // A message well after the others replaces them as usual.
    act(() => vi.advanceTimersByTime(2_000));
    fireEvent.click(screen.getByRole("button", { name: "notify" }));
    expect(screen.getByRole("status")).toHaveTextContent(/^Later message$/);
  });
});
