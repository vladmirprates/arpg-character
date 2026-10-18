import { screen, within } from "@testing-library/react";
import { RECOMMENDATIONS } from "../../data/recommendations";
import { renderWithProviders } from "../../test/render";
import { DivinationCards } from "./DivinationCards";

const card = (id: string) => screen.getByTestId(`card-${id}`);

describe("recommendation data", () => {
  test("every card has a title in both languages, a translation and a valid date", () => {
    const ids = new Set<string>();
    for (const rec of RECOMMENDATIONS) {
      expect(ids.has(rec.id)).toBe(false);
      ids.add(rec.id);
      expect(rec.title.en && rec.title.pt).toBeTruthy();
      expect(rec.original.trim()).not.toBe("");
      expect(rec.translation.trim()).not.toBe("");
      expect(Number.isNaN(new Date(rec.date).getTime())).toBe(false);
    }
  });

  test("cards are ordered newest first", () => {
    const dates = RECOMMENDATIONS.map((r) => r.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe("<DivinationCards />", () => {
  test("shows one card per recommendation", () => {
    renderWithProviders(<DivinationCards />);
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(RECOMMENDATIONS.length);
  });

  test("a Portuguese quote is shown translated in English, with the original one click away", async () => {
    const rec = RECOMMENDATIONS.find((r) => r.lang === "pt")!;
    const { user } = renderWithProviders(<DivinationCards />);
    await user.click(card(rec.id));
    const zoom = screen.getByRole("dialog");
    expect(within(zoom).getByText(rec.translation.split("\n")[0]!, { exact: false })).toBeInTheDocument();
    expect(zoom).toHaveTextContent("Translated from Portuguese.");
    await user.click(within(zoom).getByRole("button", { name: "Show original" }));
    expect(within(zoom).getByText(rec.original.split("\n")[0]!, { exact: false })).toBeInTheDocument();
  });

  test("an English quote is shown as written, with no translation note", async () => {
    const rec = RECOMMENDATIONS.find((r) => r.lang === "en")!;
    const { user } = renderWithProviders(<DivinationCards />);
    await user.click(card(rec.id));
    const zoom = screen.getByRole("dialog");
    expect(zoom).not.toHaveTextContent("Translated from");
    expect(within(zoom).getByText(rec.original.split("\n")[0]!, { exact: false })).toBeInTheDocument();
  });

  test("closing the zoomed card returns focus to it", async () => {
    const rec = RECOMMENDATIONS[0]!;
    const { user } = renderWithProviders(<DivinationCards />);
    await user.click(card(rec.id));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(card(rec.id)).toHaveFocus();
  });
});
