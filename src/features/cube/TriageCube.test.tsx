import { screen, within } from "@testing-library/react";
import { CUBE_RECIPES, findRecipe } from "../../data/cube";
import { BACKPACK } from "../../data/equipment";
import { subscribe, type GameEvent } from "../../game/events";
import { RULES_LAYOUT } from "../../test/itemsFixture";
import { renderWithProviders } from "../../test/render";
import { TriageCube } from "./TriageCube";

const bench = () => {};
const cubeGrid = () => screen.getByRole("list", { name: "Triage Cube" });

const stored = () =>
  JSON.parse(localStorage.getItem("arpg:items")!) as { bag: (string | null)[]; cube: { ref: string; index: number }[] };

function setup() {
  localStorage.setItem("arpg:items", JSON.stringify(RULES_LAYOUT));
  return renderWithProviders(<TriageCube onOpenBench={bench} />);
}

/** Ctrl+clicks currencies into the cube, finding each by name wherever it sits in the bag. */
const sendIn = async (user: ReturnType<typeof setup>["user"], ids: readonly string[]) => {
  const bag = within(screen.getByRole("list", { name: "Backpack" }));
  await user.keyboard("{Control>}");
  for (const id of ids) {
    const item = BACKPACK.find((i) => i.id === id)!;
    await user.click(bag.getByRole("button", { name: new RegExp(item.name.en) }));
  }
  await user.keyboard("{/Control}");
};

/** Ctrl+clicks everything in the cube back to the bag. */
const emptyCube = async (user: ReturnType<typeof setup>["user"]) => {
  await user.keyboard("{Control>}");
  for (const button of within(cubeGrid()).getAllByRole("button")) await user.click(button);
  await user.keyboard("{/Control}");
};

describe("recipe data", () => {
  test("recipes use real currencies, three different ones, and no two share a trio", () => {
    const currency = new Set(BACKPACK.map((i) => i.id));
    const keys = CUBE_RECIPES.map((r) => {
      for (const id of r.inputs) expect(currency.has(id), id).toBe(true);
      expect(new Set(r.inputs).size).toBe(3);
      return [...r.inputs].sort().join("|");
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("findRecipe ignores order and needs exactly three", () => {
    const [a, b, c] = CUBE_RECIPES[0]!.inputs;
    expect(findRecipe([c, a, b])?.id).toBe(CUBE_RECIPES[0]!.id);
    expect(findRecipe([a, b])).toBeNull();
    expect(findRecipe([a, b, c, "idol-hotfix"])).toBeNull();
    expect(findRecipe([])).toBeNull();
  });
});

describe("the Triage Cube", () => {
  test("has its own square 4 × 4 grid next to the bag, empty at first, and can't transmute nothing", () => {
    setup();
    expect(within(cubeGrid()).getAllByRole("listitem")).toHaveLength(16);
    expect(screen.getByRole("list", { name: "Backpack" })).toBeInTheDocument();
    expect(screen.getByTestId("cube-transmute")).toBeDisabled();
  });

  test("items move in by picking up and placing, and stay there across a reload", async () => {
    const { user, unmount } = setup();
    await user.click(screen.getByTestId("bag-0"));
    await user.click(screen.getByRole("button", { name: "Place in the cube, cell 6" }));
    expect(screen.getByTestId("cube-5")).toHaveAccessibleName(expect.stringContaining(BACKPACK[0]!.name.en));
    expect(screen.queryByTestId("bag-0")).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<TriageCube onOpenBench={bench} />);
    expect(screen.getByTestId("cube-5")).toBeInTheDocument();
  });

  test("the longest idols fit, until something's in the way; the cube itself never does", async () => {
    const { user } = setup();
    await user.keyboard("{Control>}");
    await user.click(screen.getByTestId("bag-6")); // 1×4 Full Playthrough
    expect(screen.getByTestId("cube-0").closest("li")).toHaveStyle({ gridRow: "1 / span 4" });

    await user.click(screen.getByTestId("bag-7")); // 4×1 Release Day
    expect(screen.getByRole("alert")).toHaveTextContent("doesn't fit");
    expect(screen.getByTestId("bag-7")).toBeInTheDocument();

    await user.click(screen.getByTestId("bag-19")); // the cube
    expect(screen.getByRole("alert")).toHaveTextContent("The cube can't hold itself");
    await user.keyboard("{/Control}");
  });

  test("a wrong trio does nothing and leaves everything in the cube", async () => {
    const { user } = setup();
    await sendIn(user, ["doc-scroll", "env-orb", "replication-mirror"]);
    await user.click(screen.getByTestId("cube-transmute"));
    expect(screen.getByTestId("cube-result")).toHaveTextContent("Nothing happens");
    expect(stored().cube).toHaveLength(3);
    expect(screen.getByText("Recipes discovered: 0 of 4")).toBeInTheDocument();
  });

  test("an extra item spoils the recipe, as it should", async () => {
    const { user } = setup();
    await sendIn(user, [...CUBE_RECIPES[0]!.inputs, "env-orb"]);
    await user.click(screen.getByTestId("cube-transmute"));
    expect(screen.getByTestId("cube-result")).toHaveTextContent("Nothing happens");
  });

  test("the right trio makes the item beside them and takes one from each stack", async () => {
    const events: GameEvent[] = [];
    const off = subscribe((e) => events.push(e));
    const { user } = setup();
    const recipe = CUBE_RECIPES[0]!;
    await sendIn(user, recipe.inputs);
    await user.click(screen.getByTestId("cube-transmute"));
    off();

    expect(screen.getByTestId("cube-result")).toHaveTextContent(recipe.result.name.en);
    expect(screen.getByTestId("cube-3")).toHaveAccessibleName(recipe.result.name.en);
    expect(stored().cube).toHaveLength(4);
    recipe.inputs.forEach((id, i) => {
      const item = BACKPACK.find((b) => b.id === id)!;
      expect(screen.getByTestId(`cube-${i}`)).toHaveAccessibleName(`${item.name.en} (${item.stack! - 1})`);
      expect(screen.getByTestId(`cube-${i}`)).toHaveAccessibleDescription(
        expect.stringContaining(`Stack Size: ${item.stack! - 1}/${item.maxStack}`),
      );
    });
    expect(screen.getByText("Recipes discovered: 1 of 4")).toBeInTheDocument();
    expect(events).toContainEqual({ type: "cube.recipe", id: recipe.id });
  });

  test("every result is a 1×1 idol with a resistance of its own", () => {
    for (const recipe of CUBE_RECIPES) {
      expect(recipe.result.shape, recipe.id).toEqual({ w: 1, h: 1 });
      expect(Object.values(recipe.result.resists ?? {}).length, recipe.id).toBeGreaterThan(0);
      expect(recipe.result.base.en).toMatch(/Idol/);
    }
  });

  test("the lower count persists after a reload", async () => {
    const { user, unmount } = setup();
    const recipe = CUBE_RECIPES[0]!;
    await sendIn(user, recipe.inputs);
    await user.click(screen.getByTestId("cube-transmute"));
    unmount();
    renderWithProviders(<TriageCube onOpenBench={bench} />);
    const item = BACKPACK.find((b) => b.id === recipe.inputs[0])!;
    expect(screen.getByTestId("cube-0")).toHaveAccessibleName(`${item.name.en} (${item.stack! - 1})`);
  });

  test("a made result can't be repeated, and trying costs nothing", async () => {
    const { user } = setup();
    const recipe = CUBE_RECIPES[0]!;
    await sendIn(user, recipe.inputs);
    await user.click(screen.getByTestId("cube-transmute"));

    await user.keyboard("{Control>}");
    await user.click(screen.getByTestId("cube-3")); // take the result out
    await user.keyboard("{/Control}");
    expect(stored().bag).toContain(`d:${recipe.result.id}`);
    expect(screen.getByText("Recipes discovered: 1 of 4")).toBeInTheDocument();

    const item = BACKPACK.find((b) => b.id === recipe.inputs[0])!;
    await user.click(screen.getByTestId("cube-transmute"));
    expect(screen.getByTestId("cube-result")).toHaveTextContent("You already made that");
    expect(screen.getByTestId("cube-0")).toHaveAccessibleName(`${item.name.en} (${item.stack! - 1})`);
  });

  test("every recipe can be made in one sitting, each using up its share", async () => {
    const { user } = setup();
    for (const recipe of CUBE_RECIPES) {
      await sendIn(user, recipe.inputs);
      await user.click(screen.getByTestId("cube-transmute"));
      await emptyCube(user);
    }
    expect(screen.getByText("Recipes discovered: 4 of 4")).toBeInTheDocument();
    const scroll = BACKPACK.find((b) => b.id === "doc-scroll")!; // used by three of the four
    const bag = within(screen.getByRole("list", { name: "Backpack" }));
    expect(bag.getByRole("button", { name: `${scroll.name.en} (${scroll.stack! - 3})` })).toBeInTheDocument();
  }, 20_000);
});
