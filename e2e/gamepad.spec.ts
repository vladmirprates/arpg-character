import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * A virtual controller: navigator.getGamepads() is replaced with one "standard"-layout pad the test
 * presses buttons on. The app polls it every frame, exactly as it polls a real one.
 */
declare global {
  interface Window {
    __pad: { id: string; connected: boolean; buttons: { pressed: boolean; value: number }[]; axes: number[] };
  }
}

const A = 0;
const B = 1;
const RB = 5;
const MENU = 9;
const RIGHT = 15;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__pad = {
      id: "Test Controller (STANDARD GAMEPAD Vendor: 0000 Product: 0000)",
      connected: true,
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      axes: [0, 0, 0, 0],
    };
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [window.__pad.connected ? { ...window.__pad, index: 0, mapping: "standard" } : null],
    });
  });
  await page.goto("./");
});

async function connect(page: Page) {
  await page.evaluate(() => {
    const e = new Event("gamepadconnected");
    Object.defineProperty(e, "gamepad", { value: window.__pad });
    window.dispatchEvent(e);
  });
}

/** Holds a button for a few frames, then lets go (the app acts on the press, not the release). */
async function press(page: Page, button: number) {
  const frames = (n: number) =>
    page.evaluate(
      (count) =>
        new Promise<void>((resolve) => {
          let left = count;
          const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
          requestAnimationFrame(tick);
        }),
      n,
    );
  await page.evaluate((b) => (window.__pad.buttons[b]!.pressed = true), button);
  await frames(3);
  await page.evaluate((b) => (window.__pad.buttons[b]!.pressed = false), button);
  await frames(3);
}

test("[CERT-INP-03] connecting a controller shows its name and button prompts", async ({ page }) => {
  await connect(page);
  await expect(page.getByRole("status")).toContainText("Controller connected: Test Controller");
  const hints = page.getByTestId("gamepad-hints");
  await expect(hints).toBeVisible();
  await expect(hints).toContainText("Test Controller");
  await expect(hints).toContainText("Select");
  // Connecting a pad is also an achievement.
  await page.getByTestId("open-achievements").click();
  await expect(page.getByTestId("ach-couch-qa")).toHaveAttribute("data-unlocked", "true");
});

test("[CERT-INP-02] the D-pad moves focus, A selects and B goes back", async ({ page }) => {
  await connect(page);
  await press(page, MENU);
  await expect(page.getByTestId("open-tree")).toBeFocused();
  await press(page, RIGHT);
  await expect(page.getByTestId("open-bench")).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-input", "gamepad");

  await press(page, A);
  const bench = page.getByRole("dialog", { name: "Crafting Bench" });
  await expect(bench).toBeVisible();
  await press(page, B);
  await expect(bench).toBeHidden();
  // Native dialogs restore focus to what opened them.
  await expect(page.getByTestId("open-bench")).toBeFocused();
});

test("[CERT-INP-02] face and shoulder buttons cast skills", async ({ page }) => {
  await connect(page);
  await press(page, RB); // RB is R: Production Push
  await expect(page.getByRole("status")).toContainText("PRODUCTION IS DOWN");
});

test("[CERT-INP-01] unplugging the controller is announced and mouse/keyboard take over", async ({ page }) => {
  await connect(page);
  await expect(page.getByTestId("gamepad-hints")).toBeVisible();
  await page.evaluate(() => {
    window.__pad.connected = false;
    window.dispatchEvent(new Event("gamepaddisconnected"));
  });
  await expect(page.getByRole("alert")).toHaveText("Controller disconnected. Mouse and keyboard still work.");
  await expect(page.getByTestId("gamepad-hints")).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute("data-input", "gamepad");
  await page.getByTestId("open-quests").click();
  await expect(page.getByRole("dialog", { name: "Quest Log" })).toBeVisible();
});
