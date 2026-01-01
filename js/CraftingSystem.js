// js/CraftingSystem.js
import { RARITY, CURRENCY, ITEM_TYPE } from "./data/constants.js";
import { ITEM_POOLS } from "./data/itemPools.js";

export class CraftingSystem {
  constructor() {
    this.pools = ITEM_POOLS;
    this.resetItem(ITEM_TYPE.BUG);
  }

  resetItem(type) {
    this.currentType = type;
    this.item = {
      rarity: RARITY.NORMAL,
      baseName: this.pools[type].baseName,
      rareName: "",
      mods: [],
      implicit: null,
      corrupted: false,
    };
  }

  getItem() {
    return this.item;
  }

  // --- Main Logic: Consuming Currency Orbs ---
  craft(currencyType) {
    // 1. Check Corruption (Global Rule)
    if (this.item.corrupted && currencyType !== CURRENCY.SCOURING) {
      return { success: false, error: "Item is Corrupted" };
    }

    const { mods, rarity } = this.item;
    const MAX_MODS = 6;

    switch (currencyType) {
      case CURRENCY.TRANSMUTE:
        if (rarity === RARITY.NORMAL) {
          this.item.rarity = RARITY.MAGIC;
          this.addRandomMod(1);
          return { success: true };
        }
        return { success: false, error: "Item must be Normal" };

      case CURRENCY.AUGMENTATION:
        if (rarity !== RARITY.MAGIC)
          return { success: false, error: "Item must be Magic" };
        if (mods.length >= 2)
          return { success: false, error: "Magic items have max 2 mods" };

        this.addRandomMod(1);
        return { success: true };

      case CURRENCY.ALTERATION:
        if (rarity !== RARITY.MAGIC)
          return { success: false, error: "Item must be Magic" };
        if (mods.length === 0) {
          // Edge case: magic item without mods (rare but possible)
          this.addRandomMod(1);
          return { success: true };
        }

        const idx = Math.floor(Math.random() * mods.length);
        mods.splice(idx, 1);
        this.addRandomMod(1);
        return { success: true };

      case CURRENCY.REGAL:
        if (rarity === RARITY.MAGIC) {
          this.item.rarity = RARITY.RARE;
          this.item.rareName = this.generateRareName();
          this.addRandomMod(3);
          return { success: true };
        }
        return { success: false, error: "Item must be Magic" };

      case CURRENCY.CHAOS:
        if (rarity === RARITY.RARE) {
          // Chaos Logic: Remove 1 Mod, Add 1 Mod
          if (mods.length > 0) {
            const idxRemove = Math.floor(Math.random() * mods.length);
            mods.splice(idxRemove, 1);
          }

          // Add 1 new mod respecting the Rare limit (3 prefixes / 3 suffixes)
          this.addRandomMod(3);

          // Update name to reflect the chaotic change
          this.item.rareName = this.generateRareName();
          return { success: true };
        }
        return { success: false, error: "Item must be Rare" };

      case CURRENCY.EXALTED:
        if (rarity !== RARITY.RARE)
          return { success: false, error: "Item must be Rare" };
        if (mods.length >= MAX_MODS)
          return { success: false, error: "Item has max modifiers" };

        this.addRandomMod(3);
        return { success: true };

      case CURRENCY.ANNULMENT:
        if (mods.length > 0) {
          const idxAnnul = Math.floor(Math.random() * mods.length);
          mods.splice(idxAnnul, 1);

          if (mods.length === 0) {
            this.item.rarity = RARITY.NORMAL;
            this.item.rareName = "";
          }
          return { success: true };
        }
        return { success: false, error: "No modifiers to remove" };

      case CURRENCY.VAAL:
        if (!this.item.corrupted && rarity !== RARITY.NORMAL) {
          this.applyCorruption();
          return { success: true };
        }
        return { success: false, error: "Cannot corrupt this item" };

      case CURRENCY.SCOURING:
        if (rarity !== RARITY.NORMAL || this.item.corrupted) {
          this.resetItem(this.currentType);
          return { success: true };
        }
        return { success: false, error: "Already Normal" };

      default:
        return { success: false, error: "Unknown Currency" };
    }
  }

  // --- Helpers ---
  addRandomMod(rarityLimit) {
    const pool = this.pools[this.currentType];
    const currentPrefixes = this.item.mods.filter(
      (m) => m.type === "prefix"
    ).length;
    const currentSuffixes = this.item.mods.filter(
      (m) => m.type === "suffix"
    ).length;

    const existingNames = this.item.mods.map((m) => m.data.name);

    const availableP = pool.prefixes;
    const availableS = pool.suffixes;
    const candidates = [];

    if (currentPrefixes < rarityLimit) {
      availableP.forEach((p) => {
        if (!existingNames.includes(p.name))
          candidates.push({ type: "prefix", data: p });
      });
    }
    if (currentSuffixes < rarityLimit) {
      availableS.forEach((s) => {
        if (!existingNames.includes(s.name))
          candidates.push({ type: "suffix", data: s });
      });
    }

    if (candidates.length === 0) return;

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    pick.shining = true;
    this.item.mods.push(pick);
  }

  generateRareName() {
    const adj = [
      "Null",
      "Recursive",
      "Fatal",
      "Async",
      "Zombie",
      "Broken",
      "Legacy",
    ];
    const noun = [
      "Exception",
      "Overflow",
      "Promise",
      "Handler",
      "Cluster",
      "Kernel",
      "Build",
    ];
    return `${adj[Math.floor(Math.random() * adj.length)]} ${
      noun[Math.floor(Math.random() * noun.length)]
    }`;
  }

  // --- Corruption Mechanics ---
  applyCorruption() {
    this.item.corrupted = true;
    const roll = Math.random();

    // Outcome 1: Add Implicit (33%)
    if (roll < 0.33) {
      const imps = this.pools[this.currentType].implicits;
      this.item.implicit = imps[Math.floor(Math.random() * imps.length)];
    }
    // Outcome 2: Reroll 1-3 Mods (33%)
    else if (roll < 0.66) {
      const currentCount = this.item.mods.length;
      if (currentCount > 0) {
        const maxRemove = Math.min(3, currentCount);
        const count = Math.floor(Math.random() * maxRemove) + 1;

        for (let i = 0; i < count; i++) {
          if (this.item.mods.length > 0) {
            const removeIdx = Math.floor(Math.random() * this.item.mods.length);
            this.item.mods.splice(removeIdx, 1);

            const limit = this.item.rarity === RARITY.MAGIC ? 1 : 3;
            this.addRandomMod(limit);
          }
        }
      }
    }
    // Outcome 3: BRICK (Transform into Unique) (33%)
    else {
      this.item.rarity = RARITY.UNIQUE;
      this.item.baseName = "Undocumented Feature";
      this.item.rareName = "";
      this.item.implicit = "Cannot be Fixed";

      this.item.mods = [
        {
          type: "unique",
          shining: false,
          data: { effect: "Closed as 'Won't Fix'" },
        },
        {
          type: "unique",
          shining: false,
          data: { effect: "Grants Level 20 'Denial' Aura" },
        },
        {
          type: "unique",
          shining: false,
          data: { effect: "100% Increased Confusion" },
        },
        {
          type: "unique",
          shining: false,
          data: { effect: "Developers take 0 Damage from Logic" },
        },
      ];
    }
  }
}
