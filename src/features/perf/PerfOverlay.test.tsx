import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import { PerfOverlay } from "./PerfOverlay";

afterEach(() => vi.useRealTimers());

/** Fake timers include requestAnimationFrame: each advance plays ~60 fps of frames. */
const play = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("<PerfOverlay />", () => {
  test("measures frames, shows the live numbers and exposes a probe for the performance test", () => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setInterval", "clearInterval", "performance"],
    });
    const onClose = vi.fn();
    const { unmount } = renderWithProviders(<PerfOverlay onClose={onClose} />);
    play(1000);
    expect(Number(screen.getByTestId("perf-fps").textContent)).toBeGreaterThanOrEqual(55);
    const probe = window.__perf!;
    expect(probe.summary().frames).toBeGreaterThan(50);
    probe.reset();
    expect(probe.summary().frames).toBe(0);
    play(500);
    expect(probe.summary().frames).toBeGreaterThan(20);

    // jsdom has no popover API, so the overlay never "opens" and counts as hidden.
    fireEvent.click(screen.getByRole("button", { name: "Close the performance overlay", hidden: true }));
    expect(onClose).toHaveBeenCalled();
    unmount();
    expect(window.__perf).toBeUndefined();
  });

  test("a hidden tab isn't counted as one long frame", () => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setInterval", "clearInterval", "performance"],
    });
    renderWithProviders(<PerfOverlay onClose={() => {}} />);
    play(500);
    window.__perf!.reset();
    // A hidden tab gets no frames; on return the clock restarts instead of logging the gap.
    document.dispatchEvent(new Event("visibilitychange"));
    play(500);
    expect(window.__perf!.summary().maxMs).toBeLessThan(50);
  });
});
