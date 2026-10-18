import { SPECIES } from "./species";
import { browserName, buildTicket, ticketText } from "./ticket";

const context = {
  species: SPECIES[0]!,
  number: 3,
  panel: "Inventory",
  x: 812.4,
  y: 430.6,
  browser: "Chrome 131",
  viewport: { w: 1440, h: 900 },
  locale: "en" as const,
};

describe("bug tickets", () => {
  test("build a complete, numbered ticket from the capture context", () => {
    const t = buildTicket(context);
    expect(t.key).toBe("QA-1003");
    expect(t.title).toBe("Heisenbug lurking behind the Inventory panel");
    expect(t.environment).toBe("Chrome 131 · 1440×900 · en");
    expect(t.steps[1]).toContain("(812, 431)");
    expect(t.actual).toMatch(/^div\.heisenbug — /);
  });

  test("localize to Portuguese", () => {
    const t = buildTicket({ ...context, locale: "pt", panel: "Inventário" });
    expect(t.title).toBe("Heisenbug escondido atrás do painel Inventário");
    expect(ticketText(t, "pt")).toContain("Passos para reproduzir:");
  });

  test("clipboard text reads like a ticket", () => {
    const text = ticketText(buildTicket(context), "en");
    expect(text.split("\n")[0]).toBe("[QA-1003] Heisenbug lurking behind the Inventory panel");
    expect(text).toContain("1. Open the character sheet");
    expect(text).toContain("Expected result: No bugs on the character sheet");
  });

  test.each([
    ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0 Safari/537.36", "Chrome 131"],
    ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Edg/131.0", "Edge 131"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0", "Firefox 133"],
    ["Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.1 Safari/605.1.15", "Safari 18"],
    ["curl/8.0", "Unknown browser"],
  ])("browserName(%j) → %s", (ua, expected) => {
    expect(browserName(ua)).toBe(expected);
  });

  test("every species has full bilingual text", () => {
    for (const s of SPECIES) {
      for (const field of [s.name, s.title, s.severity, s.actual]) expect(field.en && field.pt).toBeTruthy();
      expect(s.title.en).toContain("{panel}");
      expect(s.title.pt).toContain("{panel}");
    }
  });
});
