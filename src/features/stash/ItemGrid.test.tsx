import { act, fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BACKPACK } from "../../data/equipment";
import { encodeRecipe } from "../../game/crafting/recipe";
import { renderWithProviders } from "../../test/render";
import { InventoryPanel } from "../inventory/InventoryPanel";
import { StashPanel } from "./StashPanel";

const first = BACKPACK[0]!;
const code = encodeRecipe({ base: "testcase", seed: 9, orbs: ["transmute"] });

function setup(onOpenBench = vi.fn()) {
  const result = renderWithProviders(
    <>
      <InventoryPanel onOpenBench={onOpenBench} />
      <StashPanel onOpenBench={onOpenBench} />
    </>,
  );
  return { ...result, onOpenBench };
}

const stored = () => JSON.parse(localStorage.getItem("arpg:items")!) as { bag: string[]; stash: string[] };

describe("moving items between the bag and the stash", () => {
  test("click picks an item up; clicking an empty stash cell puts it there, and it persists", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("bag-0"));
    expect(screen.getByTestId("items-status")).toHaveTextContent(/Picked up/);
    await user.click(screen.getByRole("button", { name: "Place in the stash, cell 4" }));

    expect(screen.queryByTestId("bag-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("stash-3")).toHaveAccessibleName(expect.stringContaining(first.name.en));
    expect(stored().stash[3]).toBe(`d:${first.id}`);
  });

  test("dropping onto another item swaps the two", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("bag-0"));
    await user.click(screen.getByTestId("bag-1"));
    expect(screen.getByTestId("bag-1")).toHaveAccessibleName(expect.stringContaining(first.name.en));
  });

  test("Ctrl+click sends an item straight to the other container", async () => {
    const { user } = setup();
    await user.keyboard("{Control>}");
    await user.click(screen.getByTestId("bag-0"));
    await user.keyboard("{/Control}");
    expect(screen.getByTestId("stash-0")).toHaveAccessibleName(expect.stringContaining(first.name.en));
  });

  test("keyboard: Enter picks up, Enter on a cell places, Esc cancels", async () => {
    const { user } = setup();
    act(() => screen.getByTestId("bag-1").focus());
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /^Place in/ })).not.toBeInTheDocument();

    act(() => screen.getByTestId("bag-1").focus());
    await user.keyboard("{Enter}");
    act(() => screen.getByRole("button", { name: "Place in the bag, cell 60" }).focus());
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("bag-59")).toBeInTheDocument();
    expect(screen.queryByTestId("bag-1")).not.toBeInTheDocument();
  });

  test("double-click (or Shift+Enter) opens a crafted item in the bench, from either container", async () => {
    localStorage.setItem("arpg:stash", JSON.stringify([code]));
    const { user, onOpenBench } = setup();
    await user.dblClick(screen.getByTestId("stash-0"));
    expect(onOpenBench).toHaveBeenCalledWith({ base: "testcase", seed: 9, orbs: ["transmute"] });

    await user.click(screen.getByTestId("stash-0"));
    await user.click(screen.getByRole("button", { name: "Place in the bag, cell 10" }));
    act(() => screen.getByTestId("bag-9").focus());
    fireEvent.keyDown(screen.getByTestId("bag-9"), { key: "Enter", shiftKey: true });
    expect(onOpenBench).toHaveBeenCalledTimes(2);
  });
});
