import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { encodeRecipe } from "../../game/crafting/recipe";
import { StashPanel } from "../stash/StashPanel";
import { STASH_SIZE } from "../stash/StashProvider";
import { CraftingBench } from "./CraftingBench";

const item = () => screen.getByTestId("crafted-item");
const orb = (id: string) => screen.getByTestId(`orb-${id}`);
const slot = () => screen.getByTestId("item-slot");
type User = ReturnType<typeof renderWithProviders>["user"];
/** PoE-style: pick the orb up, then click the item. */
const craftWith = async (user: User, id: string) => {
  await user.click(orb(id));
  await user.click(slot());
};

describe("<CraftingBench />", () => {
  test("starts with a blank Normal item", () => {
    renderWithProviders(<CraftingBench incoming={null} />);
    expect(item()).toHaveAttribute("data-rarity", "normal");
    expect(within(item()).getByText("Blank Bug Report")).toBeInTheDocument();
    expect(within(item()).getByText("No properties")).toBeInTheDocument();
  });

  test("picking up Orb of Triage and clicking the item makes it Magic and logs the step", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    await user.click(orb("transmute"));
    expect(orb("transmute")).toHaveAttribute("aria-pressed", "true");
    expect(item()).toHaveAttribute("data-rarity", "normal");
    await user.click(slot());
    expect(item()).toHaveAttribute("data-rarity", "magic");
    expect(orb("transmute")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Orb of Triage", { selector: "li span" })).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  test("an invalid orb fails, is logged, and the error is announced to screen readers", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    await craftWith(user, "chaos");
    expect(item()).toHaveAttribute("data-rarity", "normal");
    expect(screen.getByText("FAIL")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Item must be Rare");
  });

  test("keyboard users can craft with Enter: the orb is picked up and focus moves to the item", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    orb("transmute").focus();
    await user.keyboard("{Enter}");
    expect(slot()).toHaveFocus();
    expect(slot()).toHaveAccessibleName("Use Orb of Triage on the item");
    await user.keyboard("{Enter}");
    expect(item()).toHaveAttribute("data-rarity", "magic");
  });

  test("Shift keeps the orb on the cursor for repeated use", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    await craftWith(user, "transmute");
    await user.click(orb("alteration"));
    await user.keyboard("{Shift>}");
    await user.click(slot());
    await user.click(slot());
    await user.keyboard("{/Shift}");
    expect(orb("alteration")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("Orb of Revision", { selector: "li span" })).toHaveLength(2);
  });

  test("right-click picks an orb up; Esc puts it back without crafting", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    fireEvent.contextMenu(orb("transmute"));
    expect(orb("transmute")).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Escape}");
    expect(orb("transmute")).toHaveAttribute("aria-pressed", "false");
    await user.click(slot());
    expect(item()).toHaveAttribute("data-rarity", "normal");
  });

  test("changing the base resets to a fresh item of that base", async () => {
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    await craftWith(user, "transmute");
    await user.selectOptions(screen.getByLabelText("Item base"), "testcase");
    expect(item()).toHaveAttribute("data-rarity", "normal");
    expect(within(item()).getByText("Blank Test Case")).toBeInTheDocument();
  });

  test("an incoming recipe replays to exactly the same item", () => {
    const recipe = { base: "script" as const, seed: 0xc0ffee, orbs: ["transmute", "augmentation", "regal"] as const };
    const first = renderWithProviders(
      <CraftingBench incoming={{ recipe: { ...recipe, orbs: [...recipe.orbs] }, shared: true }} />,
    );
    const label = item().getAttribute("aria-label");
    first.unmount();
    renderWithProviders(<CraftingBench incoming={{ recipe: { ...recipe, orbs: [...recipe.orbs] }, shared: true }} />);
    expect(item().getAttribute("aria-label")).toBe(label);
    expect(item()).toHaveAttribute("data-rarity", "rare");
  });

  test("Keep Item saves to the stash, persists it, and resets the bench", async () => {
    const { user } = renderWithProviders(
      <>
        <CraftingBench incoming={null} />
        <StashPanel onOpenBench={() => {}} />
      </>,
    );
    await craftWith(user, "transmute");
    await user.click(screen.getByRole("button", { name: "Keep item" }));

    expect(item()).toHaveAttribute("data-rarity", "normal");
    expect(screen.getByRole("status")).toHaveTextContent("Item saved to stash");
    expect(screen.getByTestId("stash-0")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem("arpg:items")!) as { stash: (string | null)[] };
    expect(stored.stash.filter(Boolean)).toHaveLength(1);
  });

  test("a full stash refuses new items with an error", async () => {
    const code = encodeRecipe({ base: "bug", seed: 1, orbs: ["transmute"] });
    localStorage.setItem("arpg:stash", JSON.stringify(Array(STASH_SIZE).fill(code)));
    const { user } = renderWithProviders(<CraftingBench incoming={null} />);
    await user.click(screen.getByRole("button", { name: "Keep item" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Stash is full");
  });

  test("a stash saved with fewer slots still loads, one cell per item", () => {
    const code = encodeRecipe({ base: "testcase", seed: 3, orbs: ["transmute"] });
    localStorage.setItem("arpg:stash", JSON.stringify([code, null, code, null, null, null, null, null]));
    renderWithProviders(<StashPanel onOpenBench={() => {}} />);
    expect(screen.getAllByTestId(/^stash-/)).toHaveLength(2);
    expect(screen.getByTestId("stash-2").closest("li")).toHaveStyle({ gridColumn: "3" });
  });

  test("tampered stash storage is ignored instead of crashing", () => {
    localStorage.setItem("arpg:stash", '{"not":"an array"');
    renderWithProviders(<StashPanel onOpenBench={() => {}} />);
    expect(screen.queryAllByTestId(/^stash-/)).toHaveLength(0);
    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
  });
});
