import { act, fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { BACKPACK } from "../../data/equipment";
import { encodeRecipe } from "../../game/crafting/recipe";
import { RULES_LAYOUT } from "../../test/itemsFixture";
import { renderWithProviders } from "../../test/render";
import { CharacterPanel } from "../character/CharacterPanel";
import { InventoryPanel } from "../inventory/InventoryPanel";
import { IdolPanel } from "./IdolPanel";

const first = BACKPACK[0]!;
const code = encodeRecipe({ base: "testcase", seed: 9, orbs: ["transmute"] });

/** Where things start in the bag: the first cells it has room for, in data order. */
const RELEASE = "bag-7"; // 4×1
const NOTES = "bag-14"; // 1×1 Idol of the Patch Notes
const HOURGLASS = "bag-15";
const CROSSROADS = "bag-16";
const CUBE = "bag-19"; // 2×2
/** Where an old stash's craft lands in the default arrangement: right after the currency. */
const STASH_CRAFT = 5;

/** Uses the fixed test arrangement, unless the test is about a save from the old stash. */
function setup(onOpenBench = vi.fn(), onOpenCube = vi.fn()) {
  if (!localStorage.getItem("arpg:stash")) localStorage.setItem("arpg:items", JSON.stringify(RULES_LAYOUT));
  const result = renderWithProviders(
    <>
      <CharacterPanel />
      <InventoryPanel onOpenBench={onOpenBench} onOpenCube={onOpenCube} />
      <IdolPanel onOpenBench={onOpenBench} />
    </>,
  );
  return { ...result, onOpenBench, onOpenCube };
}

const stored = () =>
  JSON.parse(localStorage.getItem("arpg:items")!) as {
    bag: (string | null)[];
    idols: { ref: string; index: number }[];
    altar: string | null;
  };

const withCtrl = async (user: ReturnType<typeof setup>["user"], testId: string) => {
  await user.keyboard("{Control>}");
  await user.click(screen.getByTestId(testId));
  await user.keyboard("{/Control}");
};

describe("the bag", () => {
  test("click picks an item up; clicking an empty cell puts it there, and it persists", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("bag-0"));
    expect(screen.getByTestId("items-status")).toHaveTextContent(/Picked up/);
    await user.click(screen.getByRole("button", { name: "Place in the bag, cell 40" }));

    expect(screen.queryByTestId("bag-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("bag-39")).toHaveAccessibleName(expect.stringContaining(first.name.en));
    expect(stored().bag[39]).toBe(`d:${first.id}`);
  });

  test("dropping onto another item swaps the two", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("bag-0"));
    await user.click(screen.getByTestId("bag-1"));
    expect(screen.getByTestId("bag-1")).toHaveAccessibleName(expect.stringContaining(first.name.en));
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

  test("idols and the cube take up their real size", () => {
    setup();
    expect(screen.getByTestId(RELEASE).closest("li")).toHaveStyle({ gridColumn: "8 / span 4" });
    expect(screen.getByTestId("bag-6").closest("li")).toHaveStyle({ gridRow: "1 / span 4" });
    const cube = screen.getByTestId(CUBE).closest("li");
    expect(cube).toHaveStyle({ gridColumn: "8 / span 2", gridRow: "2 / span 2" });
  });

  test("a save from before the idol board moves its stash crafts into the bag", () => {
    localStorage.setItem("arpg:stash", JSON.stringify([code]));
    setup();
    expect(screen.getByTestId(`bag-${STASH_CRAFT}`)).toBeInTheDocument();
    expect(screen.queryByTestId(/^stash-/)).not.toBeInTheDocument();
  });

  test("double-click (or Shift+Enter) opens a crafted item in the bench", async () => {
    localStorage.setItem("arpg:stash", JSON.stringify([code]));
    const { user, onOpenBench } = setup();
    const craft = `bag-${STASH_CRAFT}`;
    await user.dblClick(screen.getByTestId(craft));
    expect(onOpenBench).toHaveBeenCalledWith({ base: "testcase", seed: 9, orbs: ["transmute"] });

    act(() => screen.getByTestId(craft).focus());
    fireEvent.keyDown(screen.getByTestId(craft), { key: "Enter", shiftKey: true });
    expect(onOpenBench).toHaveBeenCalledTimes(2);
  });

  test("double-click (or Shift+Enter) opens the cube", async () => {
    const { user, onOpenCube } = setup();
    await user.dblClick(screen.getByTestId(CUBE));
    expect(onOpenCube).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByTestId(CUBE), { key: "Enter", shiftKey: true });
    expect(onOpenCube).toHaveBeenCalledTimes(2);
  });

  test("a craft can be removed; a hand-written item can't", async () => {
    localStorage.setItem("arpg:stash", JSON.stringify([code]));
    const { user } = setup();
    expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /^Remove / }));
    expect(screen.queryByTestId(`bag-${STASH_CRAFT}`)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Item removed from the bag");
  });
});

describe("the idol board", () => {
  test("shows the starting idols, blocks its corners and centre, and sizes idols by their shape", () => {
    setup();
    const board = screen.getByRole("list", { name: "Idols" });
    expect(screen.getByTestId("idols-5").closest("li")).toHaveStyle({ gridRow: "2 / span 3" });
    expect(screen.getByTestId("idols-8").closest("li")).toHaveStyle({ gridColumn: "4 / span 2" });
    expect(board.querySelectorAll(".item-grid__cell--blocked")).toHaveLength(5);
  });

  test("an idol equipped with Ctrl+click raises the resistance on the character sheet", async () => {
    const { user } = setup();
    expect(screen.getByTestId("resist-scope")).toHaveTextContent("72%");
    await withCtrl(user, NOTES);
    expect(screen.getByTestId("idols-7")).toHaveAccessibleName(expect.stringContaining("Patch Notes"));
    expect(screen.queryByTestId(NOTES)).not.toBeInTheDocument();
    expect(screen.getByTestId("resist-scope")).toHaveTextContent("75%");
    expect(stored().idols).toContainEqual({ ref: "d:idol-patch-notes", index: 7 });
  });

  test("taking an idol off lowers the resistance", async () => {
    const { user } = setup();
    await withCtrl(user, "idols-1");
    expect(screen.getByTestId("resist-scope")).toHaveTextContent("67%");
  });

  test("the panel has no stat summary: effects live in each idol's tooltip", () => {
    setup();
    expect(screen.queryByTestId("idol-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("idols-1")).toHaveAccessibleDescription(expect.stringContaining("Scope Creep"));
  });

  test("a refused placement explains why and keeps the item held for another try", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("bag-0"));
    await user.click(screen.getByRole("button", { name: "Place in the idol board, cell 8" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Only idols fit on the board");
    expect(screen.getByTestId("bag-0").closest("li")).toHaveClass("is-held");
    expect(stored().idols).toEqual(RULES_LAYOUT.idols); // nothing changed

    await user.click(screen.getByRole("button", { name: "Place in the bag, cell 30" }));
    expect(screen.getByTestId("bag-29")).toBeInTheDocument();
  });

  test("the square idol can replace the long one by clicking", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId("idols-8")); // pick up the 2×2
    await user.click(screen.getByTestId("idols-5")); // click the 1×3
    expect(screen.getByRole("alert")).toBeEmptyDOMElement(); // no refusal
    const placed = stored().idols.find((p) => p.ref === "d:idol-exploration")!;
    expect(placed.index).toBe(5);
    expect(stored().idols.map((p) => p.ref)).toContain("d:idol-regression"); // the long one moved, still equipped
  });

  test("Ctrl+click on currency doesn't move it, and says why", async () => {
    const { user } = setup();
    await withCtrl(user, "bag-0");
    expect(screen.getByRole("alert")).toHaveTextContent("Only idols fit on the board");
    expect(screen.getByTestId("bag-0")).toBeInTheDocument();
  });

  test("while carrying an idol the board previews where it would land", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId(NOTES));
    act(() => screen.getByRole("button", { name: "Place in the idol board, cell 8" }).focus());
    expect(screen.getByTestId("preview-idols")).toHaveClass("item-preview--ok");
    expect(screen.getByTestId("preview-idols")).toHaveStyle({ gridColumn: "3" });
  });
});

describe("the altar socket", () => {
  test("starts empty, and says so to assistive tech", () => {
    setup();
    expect(screen.queryByTestId("altar-0")).not.toBeInTheDocument();
    expect(screen.getByText(/Altar socket: empty/)).toBeInTheDocument();
  });

  test("an altar changes the board and returns idols that no longer fit to the bag", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId(HOURGLASS));
    await user.click(screen.getByRole("button", { name: "Place in the altar socket" }));

    expect(screen.getByTestId("altar-0")).toHaveAccessibleName(expect.stringContaining("Hourglass"));
    expect(screen.queryByTestId("idols-8")).not.toBeInTheDocument(); // the 2×2 had to go…
    expect(stored().bag).toContain("d:idol-exploration"); // …back to the bag
  });

  test("an altar's tooltip explains what empowered means", () => {
    setup();
    expect(screen.getByTestId(HOURGLASS)).toHaveAccessibleDescription(
      expect.stringContaining("Empowered cells: an idol on one gains +50% to its resistances"),
    );
  });

  test("an idol on an empowered cell says so and counts for more", async () => {
    const { user } = setup();
    await withCtrl(user, CROSSROADS); // empowers cells under the Localization and Exploration idols
    expect(screen.getByTestId("idols-1")).toHaveAccessibleDescription(expect.stringContaining("Empowered"));
    expect(screen.getByTestId("resist-scope")).toHaveTextContent("75%"); // 61 + 7 + 9, capped
  });

  test("only altars go in the socket", async () => {
    const { user } = setup();
    await user.click(screen.getByTestId(NOTES));
    await user.click(screen.getByRole("button", { name: "Place in the altar socket" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Only altars fit in the socket");
  });
});
