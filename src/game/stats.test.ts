import { ATTRIBUTES, BASE_ATTRIBUTE, CHARACTER, RESIST_CAP } from "../data/character";
import { levelAt } from "./age";
import { EQUIPMENT } from "../data/equipment";
import { characterAttributes, equipmentResistances, parseAttributes, resistLines, treeAttributes } from "./stats";
import { buildFromTargets } from "./tree/build";
import { NODES, ROOT_ID } from "./tree/data";

describe("parseAttributes", () => {
  test("reads the three shapes of attribute line the tree uses", () => {
    expect(parseAttributes("+10 to Manual (Str)")).toEqual({ manual: 10 });
    expect(parseAttributes("+6 to Game Sense and Automation")).toEqual({ gamesense: 6, automation: 6 });
    expect(parseAttributes("+8 to all Attributes")).toEqual({ manual: 8, automation: 8, process: 8, gamesense: 8 });
  });

  test("ignores lines that aren't attributes", () => {
    expect(parseAttributes("+5% Coffee Regeneration")).toEqual({});
    expect(parseAttributes("+10 to Something Else")).toEqual({});
    expect(parseAttributes("Expert hands-on testing")).toEqual({});
  });

  test("every attribute line anywhere in the tree is understood (a typo can't silently drop points)", () => {
    const names = ATTRIBUTES.map((a) => a.label.en);
    const unparsed = NODES.flatMap((n) => n.stats.map((s) => s.en)).filter(
      (line) =>
        /^\+\d+ to /.test(line) &&
        (names.some((name) => line.includes(name)) || /all Attributes/.test(line)) &&
        Object.keys(parseAttributes(line)).length === 0,
    );
    expect(unparsed).toEqual([]);
  });
});

describe("attributes from the passive tree", () => {
  test("an empty build has only the base", () => {
    const sheet = characterAttributes(new Set([ROOT_ID]), NODES);
    for (const a of sheet) expect(a.total).toBe(BASE_ATTRIBUTE);
  });

  test("each main region feeds its own attribute", () => {
    const pairs = [
      ["man_master", "manual"],
      ["tech_master", "automation"],
      ["proc_master", "process"],
      ["gm_master", "gamesense"],
    ] as const;
    for (const [keystone, attribute] of pairs) {
      const tree = treeAttributes(buildFromTargets([keystone]), NODES);
      const best = Object.entries(tree).sort((a, b) => b[1] - a[1])[0]![0];
      expect(best, keystone).toBe(attribute);
    }
  });

  test("a mastery keystone grants a big bonus to its attribute", () => {
    const path = buildFromTargets(["tech_master"]);
    const withoutKeystone = new Set([...path].filter((id) => id !== "tech_master"));
    const gain = treeAttributes(path, NODES).automation - treeAttributes(withoutKeystone, NODES).automation;
    expect(gain).toBe(10);
  });
});

describe("resistances from equipment", () => {
  const sheet = equipmentResistances(Object.values(EQUIPMENT));

  test("five resistances, each the sum of the gear's mods", () => {
    expect(sheet).toHaveLength(5);
    const fires = Object.values(EQUIPMENT).reduce((s, item) => s + (item.resists?.fires ?? 0), 0);
    expect(sheet.find((r) => r.id === "fires")!.total).toBe(fires);
  });

  test("values cap at 75%; over-capped resistances say so", () => {
    for (const r of sheet) {
      expect(r.value).toBeLessThanOrEqual(RESIST_CAP);
      expect(r.capped).toBe(r.total >= RESIST_CAP);
    }
    expect(sheet.some((r) => r.total > RESIST_CAP)).toBe(true); // over-capped, as careful PoE players gear
  });

  test("no weak spots: every resistance is at least 60%, and some are capped", () => {
    for (const r of sheet) expect(r.value, r.id).toBeGreaterThanOrEqual(60);
    expect(sheet.filter((r) => r.capped).length).toBeGreaterThan(0);
  });

  test("items list their resistance mods in both languages", () => {
    expect(resistLines(EQUIPMENT.helmet)).toEqual([
      { en: "[+26%] to Production Fires Resistance", pt: "[+26%] de Resistência a Incêndios em Produção" },
      { en: "[+18%] to Flaky Tests Resistance", pt: "[+18%] de Resistência a Testes Instáveis" },
    ]);
    expect(resistLines(EQUIPMENT.flask1)).toEqual([]);
  });
});

describe("item requirements", () => {
  test("every equipped item and flask has a level requirement the character meets", () => {
    const { level } = levelAt(CHARACTER.birthday, new Date());
    for (const [slot, item] of Object.entries(EQUIPMENT)) {
      expect(item.requiredLevel, slot).toBeGreaterThan(0);
      expect(item.requiredLevel!, slot).toBeLessThanOrEqual(level);
    }
  });
});

describe("every node in a region counts the same towards its attribute", () => {
  // Found by hand: attributes used to come only from some small-node types, so a region laid out
  // with more flavour nodes (Manual Testing) scored lower than one with fewer (Test Automation)
  // even when the build took more of it.
  const sum = (stats: { en: string }[]) =>
    stats.reduce<Record<string, number>>((acc, s) => {
      for (const [id, v] of Object.entries(parseAttributes(s.en))) acc[id] = (acc[id] ?? 0) + v!;
      return acc;
    }, {});

  test("every node of a kind grants the same, everywhere: small nodes little, notables most", () => {
    const main = { minor: 2, mastery: 4, notable: 6 };
    for (const region of ["north", "south", "east", "west", "northeast", "southeast", "southwest", "northwest"]) {
      const bridge = region.length > 5;
      for (const [kind, amount] of Object.entries(main)) {
        const grants = NODES.filter((n) => n.region === region && n.kind === kind).map((n) => sum(n.stats));
        const values = new Set(grants.flatMap((g) => Object.values(g)));
        expect([...values], `${region} ${kind}`).toEqual([bridge ? amount / 2 : amount]);
        // A main region grants its one attribute; a bridge grants its two neighbours'.
        for (const g of grants) expect(Object.keys(g), `${region} ${kind}`).toHaveLength(bridge ? 2 : 1);
      }
    }
  });

  test("so taking more of a region always raises its attribute more", () => {
    const south = NODES.filter((n) => n.region === "south" && n.kind !== "keystone").map((n) => n.id);
    const east = NODES.filter((n) => n.region === "east" && n.kind !== "keystone").map((n) => n.id);
    const build = buildFromTargets([...south, ...east.slice(0, 10)]);
    const t = treeAttributes(build, NODES);
    expect(t.manual).toBeGreaterThan(t.automation);
  });
});
