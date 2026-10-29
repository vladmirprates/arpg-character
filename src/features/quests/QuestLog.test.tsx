import { screen, within } from "@testing-library/react";
import { ACTS, SIDE_QUESTS, TRIALS, monthsBetween } from "../../data/questLog";
import { renderWithProviders } from "../../test/render";
import { QuestLog } from "./QuestLog";

describe("monthsBetween", () => {
  test("counts both the first and last month", () => {
    expect(monthsBetween("2024-09", "2026-07")).toBe(23);
    expect(monthsBetween("2022-03", "2022-03")).toBe(1);
  });
});

describe("<QuestLog />", () => {
  test("opens on the latest act, with its quests and gems", () => {
    renderWithProviders(<QuestLog />);
    const latest = ACTS.at(-1)!;
    expect(screen.getByRole("tab", { name: /Act V/ })).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: latest.role.en })).toBeInTheDocument();
    expect(within(panel).getByText(/10 mo/)).toBeInTheDocument();
    expect(within(panel).getAllByRole("listitem").length).toBeGreaterThanOrEqual(latest.quests.length);
  });

  test("a job's game is highlighted, apart from the studio it was made at", () => {
    renderWithProviders(<QuestLog />);
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByTestId("quest-game")).toHaveTextContent(/Game\s*Hell Clock\s*Brazilian Action RPG/);
    expect(within(panel).getByText("Rogue Snail")).toBeInTheDocument();
    expect(panel).not.toHaveTextContent("Clients");
    expect(screen.getByRole("tab", { name: /Act V/ })).toHaveTextContent("Hell Clock");
  });

  test("arrow keys move between acts, side quests and trials", async () => {
    const { user } = renderWithProviders(<QuestLog />);
    screen.getByRole("tab", { name: /Act V/ }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Side Quests" })).toHaveFocus();
    expect(screen.getAllByRole("article")).toHaveLength(SIDE_QUESTS.length);
    await user.keyboard("{ArrowDown}");
    expect(within(screen.getByRole("tabpanel")).getAllByRole("listitem")).toHaveLength(TRIALS.length);
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: /Act I\b/ })).toHaveAttribute("aria-selected", "true");
  });

  test("external links open safely in a new tab", async () => {
    const { user } = renderWithProviders(<QuestLog />);
    await user.click(screen.getByRole("tab", { name: "Side Quests" }));
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
