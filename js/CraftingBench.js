export class CraftingBench {
  constructor() {
    this.pools = {
      bug: {
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
      testcase: {
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
      script: {
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

    this.currentType = "bug";
    this.currentItem = {
      rarity: "normal",
      baseName: "Bug Report",
      rareName: "",
      mods: [],
      implicit: null,
      corrupted: false,
    };
    this.MAX_MODS = 6;

    this.bindEvents();
    this.changeBase("bug"); // Init
  }

  bindEvents() {
    // Currency clicks
    document.querySelectorAll(".currency-slot").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        const type = slot.getAttribute("data-currency");
        if (type) this.applyCurrency(type);
      });
    });

    // Base Selector
    const selector = document.getElementById("base-selector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        this.changeBase(e.target.value);
      });
    }
  }

  openBench() {
    document.getElementById("crafting-modal").style.display = "flex";
  }

  closeBench() {
    document.getElementById("crafting-modal").style.display = "none";
  }

  changeBase(type) {
    this.currentType = type;
    this.applyCurrency("scouring");
    this.currentItem.baseName = this.pools[this.currentType].baseName;
    this.updateDisplay();
  }

  applyCurrency(type) {
    let success = false;

    // GLOBAL CHECK: If corrupted, only Scouring works
    if (this.currentItem.corrupted && type !== "scouring") {
      this.triggerAnimation("error-anim");
      return;
    }

    switch (type) {
      case "transmute":
        if (this.currentItem.rarity === "normal") {
          this.currentItem.rarity = "magic";
          this.addRandomMod();
          success = true;
        }
        break;

      case "augmentation":
        if (
          this.currentItem.rarity === "magic" &&
          this.currentItem.mods.length < 2
        ) {
          this.addRandomMod();
          success = true;
        }
        break;

      case "alteration":
        if (
          this.currentItem.rarity === "magic" &&
          this.currentItem.mods.length > 0
        ) {
          const idx = Math.floor(Math.random() * this.currentItem.mods.length);
          this.currentItem.mods.splice(idx, 1);
          this.addRandomMod();
          success = true;
        }
        break;

      case "regal":
        if (this.currentItem.rarity === "magic") {
          this.currentItem.rarity = "rare";
          this.currentItem.rareName = this.generateRareName();
          this.addRandomMod();
          success = true;
        }
        break;

      case "chaos":
        if (
          this.currentItem.rarity === "rare" &&
          this.currentItem.mods.length > 0
        ) {
          const idx = Math.floor(Math.random() * this.currentItem.mods.length);
          this.currentItem.mods.splice(idx, 1);
          this.addRandomMod();
          this.currentItem.rareName = this.generateRareName();
          success = true;
        }
        break;

      case "exalted":
        if (
          this.currentItem.rarity === "rare" &&
          this.currentItem.mods.length < this.MAX_MODS
        ) {
          this.addRandomMod();
          success = true;
        }
        break;

      case "annulment":
        if (this.currentItem.mods.length > 0) {
          const idx = Math.floor(Math.random() * this.currentItem.mods.length);
          this.currentItem.mods.splice(idx, 1);

          if (this.currentItem.mods.length === 0) {
            this.currentItem.rarity = "normal";
          } else if (
            this.currentItem.mods.length <= 2 &&
            this.currentItem.rarity === "rare"
          ) {
            this.currentItem.rarity = "magic";
          }
          success = true;
        }
        break;

      case "vaal":
        if (
          !this.currentItem.corrupted &&
          this.currentItem.rarity !== "normal"
        ) {
          this.applyCorruption();
          success = true;
        }
        break;

      case "scouring":
        if (
          this.currentItem.rarity !== "normal" ||
          this.currentItem.corrupted
        ) {
          this.currentItem.rarity = "normal";
          this.currentItem.mods = [];
          this.currentItem.implicit = null;
          this.currentItem.corrupted = false;
          this.currentItem.baseName = this.pools[this.currentType].baseName;
          success = true;
        }
        break;
    }

    if (success) {
      this.triggerAnimation("crafting-anim");
      this.updateDisplay();
    } else {
      this.triggerAnimation("error-anim");
    }
  }

  applyCorruption() {
    this.currentItem.corrupted = true;
    const roll = Math.random();

    // Outcome 1: Randomize 1-3 Affixes
    if (roll < 0.2) {
      if (this.currentItem.mods.length > 0) {
        const loops = Math.min(
          this.currentItem.mods.length,
          Math.floor(Math.random() * 3) + 1
        );
        for (let i = 0; i < loops; i++) {
          this.currentItem.mods.pop();
          this.addRandomMod();
          const newModIndex = this.currentItem.mods.length - 1;
          if (newModIndex >= 0) {
            this.currentItem.mods[newModIndex].shining = true;
          }
        }
      }
    }
    // Outcome 2: Add Corrupted Implicit
    else if (roll < 0.6) {
      const imps = this.pools[this.currentType].implicits;
      this.currentItem.implicit = imps[Math.floor(Math.random() * imps.length)];
    }
    // Outcome 3: BRICK
    else {
      this.currentItem.rarity = "unique";
      this.currentItem.baseName = "Undocumented Feature";
      this.currentItem.rareName = "";
      this.currentItem.implicit = "Cannot be Fixed";
      this.currentItem.mods = [
        { data: { effect: "Closed as 'Won't Fix'" } },
        { data: { effect: "Grants Level 20 'Denial' Aura" } },
        { data: { effect: "100% Increased Confusion" } },
        { data: { effect: "Developers take 0 Damage from Logic" } },
      ];
    }
  }

  addRandomMod() {
    const pool = this.pools[this.currentType];

    const limit = this.currentItem.rarity === "magic" ? 1 : 3;

    const currentPrefixCount = this.currentItem.mods.filter(
      (m) => m.type === "prefix"
    ).length;
    const currentSuffixCount = this.currentItem.mods.filter(
      (m) => m.type === "suffix"
    ).length;
    const currentNames = this.currentItem.mods.map((m) => m.data.name);

    const availPrefix = pool.prefixes.filter(
      (p) => !currentNames.includes(p.name)
    );
    const availSuffix = pool.suffixes.filter(
      (s) => !currentNames.includes(s.name)
    );

    const candidates = [];

    if (currentPrefixCount < limit) {
      availPrefix.forEach((p) => candidates.push({ type: "prefix", data: p }));
    }

    if (currentSuffixCount < limit) {
      availSuffix.forEach((s) => candidates.push({ type: "suffix", data: s }));
    }
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this.currentItem.mods.push(pick);
  }

  generateRareName() {
    const adj = [
      "Null",
      "Recursive",
      "Orphaned",
      "Fatal",
      "Silent",
      "Infinite",
      "Mocked",
      "Async",
      "Zombie",
      "Headless",
    ];
    const noun = [
      "Exception",
      "Overflow",
      "Deadlock",
      "Promise",
      "Thread",
      "Socket",
      "Handler",
      "Memory",
      "Cluster",
      "Pipeline",
    ];

    const randAdj = adj[Math.floor(Math.random() * adj.length)];
    const randNoun = noun[Math.floor(Math.random() * noun.length)];
    return `${randAdj} ${randNoun}`;
  }

  updateDisplay() {
    const el = document.getElementById("crafting-item");
    const nameEl = el.querySelector(".item-name");
    const baseEl = el.querySelector(".item-base");
    const modsEl = document.getElementById("item-mods");
    const implicitContainer = document.getElementById("item-implicit");
    const implicitText = document.getElementById("implicit-text");

    el.className = `item-display ${this.currentItem.rarity} ${
      this.currentItem.corrupted ? "is-corrupted" : ""
    }`;
    baseEl.innerText = this.currentItem.baseName;

    // --- Name Display Logic ---
    if (this.currentItem.rarity === "normal") {
      nameEl.innerText = "Blank " + this.currentItem.baseName;
    } else if (this.currentItem.rarity === "magic") {
      let name = this.currentItem.baseName;
      const p = this.currentItem.mods.find((m) => m.type === "prefix");
      const s = this.currentItem.mods.find((m) => m.type === "suffix");
      if (p) name = `${p.data.name} ${name}`;
      if (s) name = `${name} ${s.data.name}`;
      nameEl.innerText = name;
    } else if (this.currentItem.rarity === "rare") {
      nameEl.innerText = this.currentItem.rareName;
    } else if (this.currentItem.rarity === "unique") {
      nameEl.innerText = "Undocumented Feature";
    }

    // --- Implicit Display ---
    if (this.currentItem.implicit) {
      implicitContainer.style.display = "block";
      implicitText.innerText = this.currentItem.implicit;
    } else {
      implicitContainer.style.display = "none";
    }

    // --- Mods Display Logic ---
    modsEl.innerHTML = "";

    if (this.currentItem.mods.length === 0) {
      modsEl.innerHTML =
        '<span style="color:#555; font-style:italic;">No properties</span>';
    } else {
      
      if (this.currentItem.rarity === "unique") {
        this.currentItem.mods.forEach((mod) => {
          const div = document.createElement("div");
          div.className = "stat-line";
          div.innerText = mod.data.effect;
          modsEl.appendChild(div);
        });
        return;
      }

      // Standard Logic for Magic/Rare (Prefix/Suffix Split)
      const prefixes = this.currentItem.mods.filter((m) => m.type === "prefix");
      const suffixes = this.currentItem.mods.filter((m) => m.type === "suffix");

      const renderGroup = (title, list) => {
        if (list.length === 0) return;

        const header = document.createElement("div");
        header.className = "mod-section-header";
        const max = this.currentItem.rarity === "rare" ? 3 : 1;
        header.innerText = `${title} (${list.length}/${max})`;
        modsEl.appendChild(header);

        list.forEach((mod) => {
          const div = document.createElement("div");
          div.className = "stat-line";
          div.innerText = mod.data.effect;

          if (mod.shining) {
            div.classList.add("mod-shine");
            mod.shining = false;
          }
          modsEl.appendChild(div);
        });
      };

      renderGroup("PREFIXES", prefixes);

      if (prefixes.length > 0 && suffixes.length > 0) {
        const spacer = document.createElement("div");
        spacer.style.height = "8px";
        modsEl.appendChild(spacer);
      }

      renderGroup("SUFFIXES", suffixes);
    }
  }

  triggerAnimation(animClass) {
    const el = document.getElementById("crafting-item");
    el.classList.remove("crafting-anim", "error-anim");
    void el.offsetWidth;
    el.classList.add(animClass);
  }
}
