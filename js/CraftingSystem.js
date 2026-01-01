// js/CraftingSystem.js
import { RARITY, CURRENCY, ITEM_TYPE } from "./constants.js";

export class CraftingSystem {
  constructor() {
    // Define the Mod Pools for each Item Type
    this.pools = {
      [ITEM_TYPE.BUG]: {
        baseName: "Bug Report",
        prefixes: [
          { name: "Detailed", effect: "Adds 2 Reproduction Steps" },
          { name: "Urgent", effect: "Sets Priority to Critical" },
          { name: "Clean", effect: "+10% Readability" },
          { name: "Visual", effect: "Includes Video Evidence" },
          { name: "Backend", effect: "Contains Server Logs" },
          { name: "Blocking", effect: "Prevents Release Deployment" },
          { name: "Intermittent", effect: "Reproduces 50% of the time" },
          { name: "Regression", effect: "Was working in previous build" },
          { name: "Security", effect: "Exposes Vulnerability" },
          { name: "Performance", effect: "Page Load > 5000ms" },
        ],
        suffixes: [
          { name: "of the Intern", effect: "10% chance to crash on open" },
          { name: "of Friday", effect: "Deploy time set to 17:00" },
          { name: "of Coffee", effect: "Developers work 20% faster" },
          { name: "of the Legacy", effect: "References 2015 Codebase" },
          {
            name: "of the Heisenbug",
            effect: "Disappears when Debugger is open",
          },
          { name: "of the Cache", effect: "Fixed by Hard Refresh" },
          { name: "of the User", effect: "Closed as PEBKAC / User Error" },
          { name: "of the Typo", effect: "Fixed by changing one character" },
          { name: "of the Ping-Pong", effect: "Reassigned back to QA 3 times" },
          { name: "of the Duplicate", effect: "Linked to a ticket from 2019" },
        ],
        implicits: [
          "Grants Level 10 'Blame the User' Skill",
          "Cannot be closed as 'Works on My Machine'",
          "10% chance to become a Feature",
        ],
      },
      [ITEM_TYPE.TESTCASE]: {
        baseName: "Test Case",
        prefixes: [
          { name: "Reusable", effect: "Can be used in Regression Suite" },
          { name: "Data-Driven", effect: "Runs with 50 Dataset variations" },
          { name: "Atomic", effect: "Tests only 1 feature independently" },
          { name: "Declarative", effect: "+20% 'When/Then' clarity" },
          { name: "Negative", effect: "Focuses on Error Handling" },
          { name: "End-to-End", effect: "Validates full User Journey" },
          { name: "Boundary", effect: "Tests Min/Max input limits" },
          { name: "Accessibility", effect: "WCAG 2.1 Compliant" },
          { name: "Integrated", effect: "Connects 3 Microservices" },
          { name: "Smoke", effect: "Fast Critical Path verification" },
        ],
        suffixes: [
          {
            name: "of Ambiguity",
            effect: "Devs misinterpret the 'Given' step",
          },
          { name: "of the Spaghetti", effect: "Scenario has 40 steps" },
          { name: "of Coverage", effect: "Increases Code Coverage by 2%" },
          { name: "of the Manual", effect: "Cannot be automated" },
          { name: "of the False Positive", effect: "Passes even when broken" },
          {
            name: "of the Hardcoding",
            effect: "Breaks on Staging Environment",
          },
          { name: "of the Copy-Paste", effect: "Duplicate steps detected" },
          {
            name: "of the Missing Precondition",
            effect: "Assumes user is logged in",
          },
          { name: "of the Outdated", effect: "References removed button ID" },
          { name: "of the Bloat", effect: "Scenario file exceeds 500 lines" },
        ],
        implicits: [
          "Steps are read 20% faster",
          "Syntactic Sugar: +10% Coolness",
          "Grants 'Cucumber' Aura",
        ],
      },
      [ITEM_TYPE.SCRIPT]: {
        baseName: "Auto Script",
        prefixes: [
          { name: "Headless", effect: "+50% Execution Speed (No UI)" },
          { name: "Parallel", effect: "Can run on 4 nodes simultaneously" },
          { name: "Retryable", effect: "Auto-retries on flake (Max 3)" },
          { name: "Modular", effect: "Uses Page Object Model" },
          { name: "API-First", effect: "Bypasses UI layer entirely" },
          { name: "Cross-Browser", effect: "Runs on Chrome, Firefox & Safari" },
          { name: "Dockerized", effect: "Runs in isolated container" },
          { name: "Self-Healing", effect: "Finds elements even if ID changes" },
          { name: "Mocked", effect: "Simulates external dependencies" },
          { name: "Async", effect: "Non-blocking execution flow" },
        ],
        suffixes: [
          { name: "of Flakiness", effect: "Fails randomly 15% of the time" },
          { name: "of Timeout", effect: "Waits 30s for elements" },
          { name: "of Hardcoding", effect: "Contains 'sleep(5000)'" },
          { name: "of the Selector", effect: "Uses absolute XPath" },
          { name: "of the Race Condition", effect: "Fails on faster machines" },
          { name: "of the Memory Leak", effect: "Crashes after 100 runs" },
          { name: "of the Spaghetti Code", effect: "-20% Maintainability" },
          { name: "of the Dependency Hell", effect: "node_modules is 2GB" },
          { name: "of the Update", effect: "Breaks with Chrome v130 update" },
          { name: "of the Localhost", effect: "Works locally, fails on CI/CD" },
        ],
        implicits: [
          "Bypasses Captcha Verification",
          "Runs successfully on IE11",
          "Consumes 50% less Memory",
        ],
      },
    };

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
    // Corrupted items can't be modified (except by Scouring)
    if (this.item.corrupted && currencyType !== CURRENCY.SCOURING) {
      return false;
    }

    let success = false;
    const { mods, rarity } = this.item;
    const MAX_MODS = 6;

    switch (currencyType) {
      case CURRENCY.TRANSMUTE:
        if (rarity === RARITY.NORMAL) {
          this.item.rarity = RARITY.MAGIC;
          this.addRandomMod(1);
          success = true;
        }
        break;

      case CURRENCY.AUGMENTATION:
        if (rarity === RARITY.MAGIC && mods.length < 2) {
          this.addRandomMod(1);
          success = true;
        }
        break;

      case CURRENCY.ALTERATION:
        if (rarity === RARITY.MAGIC && mods.length > 0) {
          const idx = Math.floor(Math.random() * mods.length);
          mods.splice(idx, 1);
          this.addRandomMod(1);
          success = true;
        }
        break;

      case CURRENCY.REGAL:
        if (rarity === RARITY.MAGIC) {
          this.item.rarity = RARITY.RARE;
          this.item.rareName = this.generateRareName();
          this.addRandomMod(3);
          success = true;
        }
        break;

      case CURRENCY.CHAOS:
        if (rarity === RARITY.RARE && mods.length > 0) {
          const idx = Math.floor(Math.random() * mods.length);
          mods.splice(idx, 1);
          this.addRandomMod(3);
          success = true;
        }
        break;

      case CURRENCY.EXALTED:
        if (rarity === RARITY.RARE && mods.length < MAX_MODS) {
          this.addRandomMod(3);
          success = true;
        }
        break;

      // --- Annulment Logic (PoE Style) ---
      // Removes 1 Mod. Does NOT change rarity unless the item becomes empty.
      case CURRENCY.ANNULMENT:
        if (mods.length > 0) {
          // 1. Remove 1 strictly random mod
          const idx = Math.floor(Math.random() * mods.length);
          mods.splice(idx, 1);

          // 2. Only reset to Normal if empty
          if (mods.length === 0) {
            this.item.rarity = RARITY.NORMAL;
            this.item.rareName = "";
          }
          // Note: If 1 or 2 mods remain, it STAYS Rare.
          // This allows for "bricked" rare items with only 1 prefix.

          success = true;
        }
        break;

      case CURRENCY.VAAL:
        if (!this.item.corrupted && rarity !== RARITY.NORMAL) {
          this.applyCorruption();
          success = true;
        }
        break;

      case CURRENCY.SCOURING:
        if (rarity !== RARITY.NORMAL || this.item.corrupted) {
          this.resetItem(this.currentType);
          success = true;
        }
        break;
    }

    return success;
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
