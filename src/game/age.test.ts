import { levelAt } from "./age";

const BDAY = { year: 2000, month: 5, day: 23 };
const on = (iso: string) => levelAt(BDAY, new Date(`${iso}T12:00:00`));

describe("levelAt", () => {
  test("the birthday itself starts a new level at 0% experience", () => {
    expect(on("2026-05-23")).toEqual({ level: 26, experience: 0 });
  });

  test("the day before the birthday is 99% of the way there", () => {
    const { level, experience } = on("2027-05-22");
    expect(level).toBe(26);
    expect(Math.floor(experience * 100)).toBe(99);
  });

  test("the bar fills over the year", () => {
    const halfway = on("2026-11-21").experience;
    expect(halfway).toBeGreaterThan(0.49);
    expect(halfway).toBeLessThan(0.51);
  });

  test("the time of day doesn't change the result", () => {
    expect(levelAt(BDAY, new Date("2026-10-17T00:01:00"))).toEqual(levelAt(BDAY, new Date("2026-10-17T23:59:00")));
  });
});
