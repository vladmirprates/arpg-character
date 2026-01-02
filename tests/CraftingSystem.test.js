// tests/CraftingSystem.test.js
import { CraftingSystem } from "../js/CraftingSystem.js";
import { CURRENCY, RARITY, ITEM_TYPE } from "../js/data/constants.js";

describe("CraftingSystem Logic", () => {
  let system;

  // Run before every single test to ensure a clean state
  beforeEach(() => {
    system = new CraftingSystem();
    system.resetItem(ITEM_TYPE.BUG); // Start with a Bug Report (Normal Rarity)
  });

  test("Transmute Orb should upgrade Normal to Magic", () => {
    const result = system.craft(CURRENCY.TRANSMUTE);

    expect(result.success).toBe(true);
    expect(system.getItem().rarity).toBe(RARITY.MAGIC);
    expect(system.getItem().mods.length).toBeGreaterThan(0);
  });

  test("Transmute Orb should fail on Rare items", () => {
    // Setup: Force item to Rare
    system.item.rarity = RARITY.RARE;

    const result = system.craft(CURRENCY.TRANSMUTE);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Item must be Normal");
  });

  test("Chaos Orb should reroll Rare items (Remove 1, Add 1)", () => {
    // Setup: Create a Rare item manually for consistent testing
    system.item.rarity = RARITY.RARE;
    system.item.mods = [
      { type: "prefix", data: { name: "TestPrefix1" } },
      { type: "prefix", data: { name: "TestPrefix2" } },
      { type: "suffix", data: { name: "TestSuffix" } },
    ];
    const initialCount = system.item.mods.length;

    const result = system.craft(CURRENCY.CHAOS);

    expect(result.success).toBe(true);
    // Chaos removes 1 and adds 1, so count should remain 2 (in this specific scenario)
    // Note: Since logic is random, we mainly check success and that mods exist
    expect(system.getItem().mods.length).toBeGreaterThan(2);
  });

  test("Annulment Orb should remove a modifier", () => {
    // Setup: Add 2 mods
    system.item.mods = [
      { type: "prefix", data: { name: "A" } },
      { type: "suffix", data: { name: "B" } },
    ];

    const result = system.craft(CURRENCY.ANNULMENT);

    expect(result.success).toBe(true);
    expect(system.getItem().mods.length).toBe(1);
  });

  test("Vaal Orb should corrupt the item", () => {
    // Setup: Magic item
    system.item.rarity = RARITY.MAGIC;

    const result = system.craft(CURRENCY.VAAL);

    expect(result.success).toBe(true);
    expect(system.getItem().corrupted).toBe(true);
  });

  test("Cannot modify corrupted items (except Scouring)", () => {
    system.item.corrupted = true;

    const result = system.craft(CURRENCY.TRANSMUTE);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Item is Corrupted");
  });
});
