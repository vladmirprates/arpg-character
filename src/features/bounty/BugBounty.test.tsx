import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { useBounty } from "./BountyProvider";
import { BugBounty } from "./BugBounty";
import { PLANTED_BUGS } from "./plantedBugs";

/** Stands in for Inspect Element: reports a bug the way the inspector does. */
function Inspector() {
  const { report, isPlanted } = useBounty();
  return (
    <>
      {PLANTED_BUGS.map((b) => (
        <button key={b.id} type="button" onClick={() => report(b.id)}>
          {`report ${b.id}${isPlanted(b.id) ? " (planted)" : ""}`}
        </button>
      ))}
    </>
  );
}

function setup() {
  return renderWithProviders(
    <>
      <BugBounty />
      <Inspector />
    </>,
  );
}

const plantedCount = () => screen.queryAllByRole("button", { name: /\(planted\)$/ }).length;

describe("Find the Bugs", () => {
  test("nothing is planted until the visitor starts the hunt; the board then shows progress and hints", async () => {
    const { user } = setup();
    expect(plantedCount()).toBe(0);
    expect(screen.getByRole("button", { name: "Let's find the bugs!" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    expect(screen.getAllByRole("button", { name: "Hint" })).toHaveLength(PLANTED_BUGS.length);
    expect(plantedCount()).toBe(PLANTED_BUGS.length);
    expect(screen.getByText("0 of 5 found")).toBeInTheDocument();
  });

  test("a find fixes that bug and files its report; reporting it again does nothing", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    await user.click(screen.getByRole("button", { name: "report requirement (planted)" }));

    expect(plantedCount()).toBe(PLANTED_BUGS.length - 1);
    expect(screen.getByText("1 of 5 found")).toBeInTheDocument();
    expect(screen.getByText(PLANTED_BUGS[0]!.actual.en)).toBeInTheDocument();
    expect(screen.getByText("Steps to reproduce")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "report requirement" }));
    expect(screen.getByText("1 of 5 found")).toBeInTheDocument();
  });

  test("bugs can't be reported before a hunt starts", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "report requirement" }));
    expect(screen.getByRole("button", { name: "Let's find the bugs!" })).toBeInTheDocument();
  });

  test("hints reveal one at a time", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    const [first] = screen.getAllByRole("button", { name: "Hint" });
    await user.click(first!);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(PLANTED_BUGS[0]!.hint.en)).toBeInTheDocument();
  });

  test("finding all five ends the hunt with a clean page and the win message", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    for (const b of PLANTED_BUGS) await user.click(screen.getByRole("button", { name: `report ${b.id} (planted)` }));

    expect(plantedCount()).toBe(0);
    expect(screen.getByText("Bounty complete!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "let's talk on LinkedIn." })).toHaveAttribute("target", "_blank");
    await user.click(screen.getByRole("button", { name: "Plant them again" }));
    expect(plantedCount()).toBe(PLANTED_BUGS.length);
  });

  test("giving up fixes every bug and returns to the start screen", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    await user.click(screen.getByRole("button", { name: "Give up and fix the page" }));
    expect(plantedCount()).toBe(0);
    expect(screen.getByRole("button", { name: "Let's find the bugs!" })).toBeInTheDocument();
  });

  test("a hunt in progress survives a reload", async () => {
    const first = setup();
    await first.user.click(screen.getByRole("button", { name: "Let's find the bugs!" }));
    await first.user.click(screen.getByRole("button", { name: "report stack (planted)" }));
    first.unmount();

    setup();
    expect(screen.getByText("1 of 5 found")).toBeInTheDocument();
    expect(plantedCount()).toBe(PLANTED_BUGS.length - 1);
  });
});
