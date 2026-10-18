import { fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { MY_BUILD_CODE, MY_BUILD_NODES } from "../../data/myBuild";
import { buildFromTargets, decodeBuild, encodeBuild } from "../../game/tree/build";
import { NODES, ROOT_ID } from "../../game/tree/data";
import { pathTo, pointsSpent } from "../../game/tree/graph";
import { renderWithProviders } from "../../test/render";
import { PassiveTree, type TreeTab } from "./PassiveTree";

function Harness({ initial = "yours" as TreeTab, shared = null as string | null }) {
  const [tab, setTab] = useState<TreeTab>(initial);
  return <PassiveTree tab={tab} onTabChange={setTab} sharedCode={shared} />;
}

const points = () => Number(screen.getByTestId("points").textContent);
const node = (id: string) => screen.getByTestId(`node-${id}`);
/** Expectations are derived from the graph, so they survive edits to the tree's shape. */
const costFromStart = (id: string) => pathTo(id, new Set([ROOT_ID])).length;

describe("<PassiveTree />", () => {
  test("'My Build' shows the published build and is read-only", () => {
    const mine = (MY_BUILD_CODE ? decodeBuild(MY_BUILD_CODE) : null) ?? buildFromTargets(MY_BUILD_NODES);
    renderWithProviders(<Harness initial="mine" />);
    expect(points()).toBe(pointsSpent(mine));
    expect(node("man_master")).toHaveAttribute("aria-pressed", String(mine.has("man_master")));

    const outside = NODES.find((n) => !mine.has(n.id))!;
    fireEvent.click(node(outside.id));
    expect(node(outside.id)).toHaveAttribute("aria-pressed", "false");
    expect(points()).toBe(pointsSpent(mine));
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });

  test("'Make Your Own' starts empty and allocates the whole path to a distant node", () => {
    renderWithProviders(<Harness />);
    expect(points()).toBe(0);
    fireEvent.click(node("tech_master"));
    expect(points()).toBe(costFromStart("tech_master"));
    for (const id of pathTo("tech_master", new Set([ROOT_ID]))) {
      expect(node(id)).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("refunding a node also refunds the nodes that depended on it", () => {
    renderWithProviders(<Harness />);
    fireEvent.click(node("gm_collision"));
    expect(points()).toBe(costFromStart("gm_collision"));
    fireEvent.click(node("ring_0"));
    expect(points()).toBe(0);
  });

  test("Enter allocates the focused node", () => {
    renderWithProviders(<Harness />);
    fireEvent.keyDown(node("ring_4"), { key: "Enter" });
    expect(node("ring_4")).toHaveAttribute("aria-pressed", "true");
  });

  test("only one node is in the Tab order (roving tabindex)", () => {
    renderWithProviders(<Harness />);
    const tabbable = screen.getAllByTestId(/^node-/).filter((n) => n.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
  });

  test("your build persists and Reset clears it", () => {
    const { unmount } = renderWithProviders(<Harness />);
    fireEvent.click(node("man_bugs"));
    unmount();
    renderWithProviders(<Harness />);
    expect(points()).toBe(costFromStart("man_bugs"));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(points()).toBe(0);
  });

  test("a shared build code loads into 'Make Your Own'", () => {
    const shared = buildFromTargets(["proc_agile"]);
    renderWithProviders(<Harness shared={encodeBuild(shared)} />);
    expect(points()).toBe(pointsSpent(shared));
    expect(screen.getByRole("status")).toHaveTextContent("Loaded a shared build");
  });

  test("the build summary sums up the build and updates as nodes are allocated", () => {
    renderWithProviders(<Harness />);
    const summary = () => screen.getByTestId("build-summary");
    expect(summary()).toHaveTextContent("Allocate nodes");
    fireEvent.click(node("tech_master"));
    expect(within(summary()).getByRole("heading", { name: "Keystones" })).toBeInTheDocument();
    expect(
      within(summary()).getByRole("button", { name: "Automated Testing Mastery: show on the tree" }),
    ).toBeInTheDocument();
    expect(within(summary()).getByRole("heading", { name: "Stat Totals" })).toBeInTheDocument();
  });

  test("clicking a summary entry focuses its node on the tree", async () => {
    const { user } = renderWithProviders(<Harness initial="mine" />);
    await user.click(screen.getByRole("button", { name: "Manual Testing Mastery: show on the tree" }));
    await new Promise((r) => requestAnimationFrame(r));
    expect(node("man_master")).toHaveFocus();
  });

  test("the Nebula button turns the region glows off and on, and remembers the choice", async () => {
    const { user, container, unmount } = renderWithProviders(<Harness />);
    const toggle = screen.getByRole("button", { name: "Nebula" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll(".region-glow").length).toBeGreaterThan(0);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll(".region-glow")).toHaveLength(0);
    unmount();

    renderWithProviders(<Harness />);
    expect(screen.getByRole("button", { name: "Nebula" })).toHaveAttribute("aria-pressed", "false");
  });

  test("tabs switch with arrow keys and expose the selected state", () => {
    renderWithProviders(<Harness initial="mine" />);
    const mine = screen.getByRole("tab", { name: "My Build" });
    expect(mine).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(mine, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Make Your Own" })).toHaveAttribute("aria-selected", "true");
  });
});
