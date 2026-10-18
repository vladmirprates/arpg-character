import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { STRINGS } from "../i18n/strings";
import { buildFromTargets, encodeBuild } from "../game/tree/build";
import { pointsSpent } from "../game/tree/graph";
import { encodeRecipe } from "../game/crafting/recipe";
import { EQUIPMENT } from "../data/equipment";
import { characterAttributes, equipmentResistances } from "../game/stats";
import { publishedBuild } from "../game/tree/build";
import { NODES } from "../game/tree/data";

describe("<App />", () => {
  test("renders the three panels and the action bar", () => {
    render(<App initialLocale="en" />);
    expect(screen.getByRole("heading", { level: 1, name: "Vladmir Prates" })).toBeInTheDocument();
    for (const name of ["Attributes", "Stash", "Inventory"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole("navigation", { name: "Skills" })).toBeInTheDocument();
  });

  test("switching language translates the UI and sets <html lang>", async () => {
    const user = userEvent.setup();
    render(<App initialLocale="en" />);
    await user.click(screen.getByRole("button", { name: "PT-BR" }));
    expect(screen.getByRole("heading", { level: 2, name: "Atributos" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(JSON.parse(localStorage.getItem("arpg:locale")!)).toBe("pt");
  });

  test("every equipment slot has an accessible name and description", () => {
    render(<App initialLocale="en" />);
    const helmet = screen.getByTestId("equip-helmet");
    expect(helmet).toHaveAccessibleName("Crown of the Automator");
    expect(helmet).toHaveAccessibleDescription(/Playwright Automation/);
  });

  test("the passive tree opens in a modal dialog and closes again", async () => {
    const user = userEvent.setup();
    render(<App initialLocale="en" />);
    await user.click(screen.getByTestId("open-tree"));
    const dialog = screen.getByRole("dialog", { name: "Passive Skill Tree" });
    expect(within(dialog).getByRole("tab", { name: "My Build" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("casting a skill spends Coffee, and spamming it hits the cooldown", async () => {
    const user = userEvent.setup();
    render(<App initialLocale="en" />);
    const coffee = screen.getByRole("meter", { name: "Coffee" });
    expect(coffee).toHaveAttribute("aria-valuenow", "100");
    await user.keyboard("r");
    expect(Number(coffee.getAttribute("aria-valuenow"))).toBeLessThan(100);
    await user.keyboard("r");
    expect(screen.getByRole("alert")).toHaveTextContent(/cooldown/i);
  });

  test("the meeting stays open until you choose to leave", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App initialLocale="en" />);
    await user.keyboard("t");
    const meeting = screen.getByRole("dialog", { name: /Sprint Sync/ });
    const leave = within(meeting).getByRole("button", { name: "Leave meeting" });
    expect(leave).toHaveFocus();
    // Inside act(): 30 s of cooldown and Coffee ticks re-render the action bar.
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("dialog", { name: /Sprint Sync/ })).toBeInTheDocument();
    await user.click(leave);
    expect(screen.queryByRole("dialog", { name: /Sprint Sync/ })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  test("the sheet's attributes come from My Build and its resistances from the equipped gear", () => {
    render(<App initialLocale="en" />);
    for (const a of characterAttributes(publishedBuild(), NODES)) {
      expect(screen.getByTestId(`attr-${a.id}`)).toHaveTextContent(String(a.total));
    }
    for (const r of equipmentResistances(Object.values(EQUIPMENT))) {
      expect(screen.getByTestId(`resist-${r.id}`)).toHaveTextContent(`${r.value}%`);
    }
    expect(screen.getByTestId("resist-spaghetti")).toHaveTextContent("75% (Cap)");
  });

  test("each resistance explains itself to screen readers and on hover/focus", () => {
    render(<App initialLocale="en" />);
    const fires = screen.getByTestId("resist-fires").closest("li")!;
    expect(fires).toHaveAttribute("tabindex", "0");
    expect(fires).toHaveTextContent(/when production breaks/);
    expect(fires).toHaveTextContent(/From equipped gear: 68%/);
  });

  test("Portuguese defines every UI string", () => {
    for (const [key, value] of Object.entries(STRINGS.pt)) {
      expect(value, key).not.toBe("");
    }
    expect(Object.keys(STRINGS.pt).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });

  describe("share links", () => {
    afterEach(() => history.replaceState(null, "", location.pathname));

    test("#tree=<code> opens the tree on 'Make Your Own' with that build, and closing clears the link", async () => {
      const build = buildFromTargets(["proc_agile"]);
      history.replaceState(null, "", `#tree=${encodeBuild(build)}`);
      const user = userEvent.setup();
      render(<App initialLocale="en" />);
      const tree = screen.getByRole("dialog", { name: "Passive Skill Tree" });
      expect(within(tree).getByRole("tab", { name: "Make Your Own" })).toHaveAttribute("aria-selected", "true");
      expect(within(tree).getByTestId("points")).toHaveTextContent(String(pointsSpent(build)));

      await user.click(within(tree).getByRole("button", { name: "Close" }));
      expect(location.hash).toBe("");
    });

    test("#craft=<code> opens the crafting bench with that exact item", () => {
      const recipe = {
        base: "script" as const,
        seed: 0xbeef,
        orbs: ["transmute", "regal"] as ("transmute" | "regal")[],
      };
      history.replaceState(null, "", `#craft=${encodeRecipe(recipe)}`);
      render(<App initialLocale="en" />);
      const bench = screen.getByRole("dialog", { name: "Crafting Bench" });
      expect(within(bench).getByTestId("crafted-item")).toHaveAttribute("data-rarity", "rare");
    });

    test("a broken link is ignored instead of opening anything", () => {
      history.replaceState(null, "", "#craft=not-a-recipe");
      render(<App initialLocale="en" />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("Ctrl+C on a focused item copies it in ARPG item-text format", async () => {
    const user = userEvent.setup();
    render(<App initialLocale="en" />);
    act(() => screen.getByTestId("equip-helmet").focus());
    await user.keyboard("{Control>}c{/Control}");
    expect(await navigator.clipboard.readText()).toMatch(/Crown of the Automator/);
    expect(await screen.findByRole("status")).toHaveTextContent("Item copied to clipboard");
  });
});
