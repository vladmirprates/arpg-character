import { act, screen } from "@testing-library/react";
import { ACHIEVEMENTS } from "../../data/achievements";
import { RECOMMENDATIONS } from "../../data/recommendations";
import { track } from "../../game/events";
import { renderWithProviders } from "../../test/render";
import { AchievementsPanel } from "./AchievementsPanel";

const card = (id: string) => screen.getByTestId(`ach-${id}`);

describe("achievements", () => {
  test("an event unlocks its achievement: toast, board and saved progress", () => {
    renderWithProviders(<AchievementsPanel />);
    expect(screen.getByText(`0 of ${ACHIEVEMENTS.length} unlocked`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset progress" })).toBeDisabled();

    act(() => track({ type: "craft", rarity: "rare" }));
    expect(screen.getByRole("status")).toHaveTextContent("Achievement unlocked: Rare Find");
    expect(card("rare-find")).toHaveAttribute("data-unlocked", "true");
    expect(card("rare-find")).toHaveTextContent(/Unlocked/);
    expect(screen.getByText(`1 of ${ACHIEVEMENTS.length} unlocked`)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("arpg:achievements")!).unlocked["rare-find"]).toEqual(expect.any(Number));
  });

  test("one event can unlock several, and a corrupted Rare doesn't count as crafting one", () => {
    renderWithProviders(<AchievementsPanel />);
    act(() => track({ type: "craft", rarity: "rare", corruption: "brick" }));
    expect(card("vaal-it")).toHaveAttribute("data-unlocked", "true");
    expect(card("undocumented")).toHaveAttribute("data-unlocked", "true");
    expect(card("rare-find")).toHaveAttribute("data-unlocked", "false");
  });

  test("multi-step achievements show their progress", () => {
    renderWithProviders(<AchievementsPanel />);
    act(() => {
      track({ type: "card.read", id: RECOMMENDATIONS[0]!.id });
      track({ type: "card.read", id: RECOMMENDATIONS[0]!.id });
      track({ type: "card.read", id: RECOMMENDATIONS[1]!.id });
    });
    expect(card("full-set")).toHaveTextContent(`2/${RECOMMENDATIONS.length}`);
  });

  test("reading every card completes the set", () => {
    renderWithProviders(<AchievementsPanel />);
    act(() => {
      for (const rec of RECOMMENDATIONS) track({ type: "card.read", id: rec.id });
    });
    expect(card("full-set")).toHaveAttribute("data-unlocked", "true");
  });

  test("unlocking everything else unlocks Completionist", () => {
    renderWithProviders(<AchievementsPanel />);
    act(() => {
      track({ type: "bug.found", id: "x" });
      track({ type: "bounty.complete" });
      track({ type: "craft", rarity: "rare" });
      track({ type: "craft", rarity: "unique", corruption: "brick" });
      for (const rec of RECOMMENDATIONS) track({ type: "card.read", id: rec.id });
      for (const type of [
        "item.copied",
        "locale.changed",
        "pseudo.enabled",
        "perf.opened",
        "gamepad.connected",
        "cert.opened",
      ] as const)
        track({ type });
    });
    expect(card("completionist")).toHaveAttribute("data-unlocked", "true");
    expect(screen.getByText(`${ACHIEVEMENTS.length} of ${ACHIEVEMENTS.length} unlocked`)).toBeInTheDocument();
  });

  test("progress can be reset", async () => {
    const { user } = renderWithProviders(<AchievementsPanel />);
    act(() => track({ type: "item.copied" }));
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    expect(card("price-check")).toHaveAttribute("data-unlocked", "false");
  });

  test("saved progress is restored, and tampered data is ignored", () => {
    localStorage.setItem("arpg:achievements", JSON.stringify({ unlocked: { polyglot: 1 }, progress: {} }));
    const { unmount } = renderWithProviders(<AchievementsPanel />);
    expect(card("polyglot")).toHaveAttribute("data-unlocked", "true");
    unmount();
    localStorage.setItem("arpg:achievements", JSON.stringify({ unlocked: { polyglot: "yes" } }));
    renderWithProviders(<AchievementsPanel />);
    expect(card("polyglot")).toHaveAttribute("data-unlocked", "false");
  });
});
