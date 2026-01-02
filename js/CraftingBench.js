// js/CraftingBench.js
import { CraftingSystem } from "./CraftingSystem.js";
import { RARITY, ITEM_TYPE } from "./data/constants.js";

export class CraftingBench {
  constructor() {
    this.system = new CraftingSystem();
    this.initDOM();
    this.bindEvents();
    this.updateDisplay();

    // Focus Trap variables
    this.previousFocus = null;
    this.boundFocusTrap = this.handleFocusTrap.bind(this);
  }

  // --- Setup & Caching ---
  initDOM() {
    const container = document.getElementById("crafting-item");

    this.elements = {
      modal: document.getElementById("crafting-modal"),
      itemContainer: container,
      itemName: container.querySelector(".item-name"),
      itemBase: container.querySelector(".item-base"),
      modsContainer: document.getElementById("item-mods"),
      implicitContainer: document.getElementById("item-implicit"),
      implicitText: document.getElementById("implicit-text"),
      corruptedTag: container.querySelector(".corrupted-tag"),
      baseSelector: document.getElementById("base-selector"),
      saveBtn: document.getElementById("btn-save-item"),
      stashSlots: document.querySelectorAll(".stash-slot"),
    };
  }

  bindEvents() {
    // 1. Currency Handling (Mouse + Keyboard)
    document.querySelectorAll(".currency-slot").forEach((slot) => {
      // Mouse
      slot.addEventListener("click", () => {
        const type = slot.getAttribute("data-currency");
        this.handleCraft(type);
      });

      // Keyboard
      slot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); // Prevents scroll with Space
          const type = slot.getAttribute("data-currency");
          this.handleCraft(type);
        }
      });
    });

    // 2. Close Button Handling
    const closeBtn = this.elements.modal.querySelector(".close-modal");
    if (closeBtn) {
      // Mouse
      closeBtn.addEventListener("click", () => this.closeBench());

      // Keyboard
      closeBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.closeBench();
        }
      });
    }

    // 3. Base Selector
    if (this.elements.baseSelector) {
      this.elements.baseSelector.addEventListener("change", (e) => {
        this.system.resetItem(e.target.value);
        this.updateDisplay();
        this.triggerAnimation("crafting-anim");
      });
    }

    // 4. Save Button
    if (this.elements.saveBtn) {
      this.elements.saveBtn.addEventListener("click", () => this.saveToStash());
    }
  }

  // --- Modal Controls with Focus Trap ---

  openBench() {
    this.elements.modal.style.display = "flex";

    // 1. Save previous focus to restore later
    this.previousFocus = document.activeElement;

    // 2. Focus the Close button immediately for better UX
    const closeBtn = this.elements.modal.querySelector(".close-modal");
    if (closeBtn) {
      closeBtn.focus();
    }

    // 3. Activate Focus Trap
    document.addEventListener("keydown", this.boundFocusTrap);
  }

  closeBench() {
    this.elements.modal.style.display = "none";

    // 1. Remove Focus Trap listener
    document.removeEventListener("keydown", this.boundFocusTrap);

    // 2. Restore focus to the button that opened the modal
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  // Focus Trap Logic
  handleFocusTrap(e) {
    if (e.key === "Escape") {
      this.closeBench();
      return;
    }

    if (e.key !== "Tab") return;

    const modal = this.elements.modal;

    // Get all focusable elements inside the modal:
    // Close Button, Select, Save Button, Item Display (tabindex=0), Currency Slots (tabindex=0)
    const focusableElements = modal.querySelectorAll(
      ".close-modal, select, button, [tabindex='0']"
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift + Tab (Backwards) logic
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    }
    // Tab (Forwards) logic
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  // --- Logic Bridge ---
  handleCraft(currencyType) {
    const result = this.system.craft(currencyType);

    if (result.success) {
      this.triggerAnimation("crafting-anim");
      this.updateDisplay();
    } else {
      this.triggerAnimation("error-anim");
      this.showNotification(result.error, "error");
    }
  }

  // --- UI Rendering (Core Function) ---
  updateDisplay() {
    const item = this.system.getItem();
    const {
      itemContainer,
      itemName,
      itemBase,
      modsContainer,
      implicitContainer,
      implicitText,
    } = this.elements;

    // Define finalName variable here to use it later
    const finalName = this.constructItemName(item);

    // 1. Classes and Base
    itemContainer.className = `item-display ${item.rarity} ${
      item.corrupted ? "is-corrupted" : ""
    }`;
    itemBase.textContent = item.baseName;

    // 2. Item name
    itemName.textContent = finalName;

    // 3. Implicits
    if (item.implicit) {
      implicitContainer.style.display = "block";
      implicitText.textContent = item.implicit;
    } else {
      implicitContainer.style.display = "none";
    }

    // 4. Mods
    modsContainer.innerHTML = "";

    if (item.mods.length === 0) {
      const noProp = document.createElement("span");
      Object.assign(noProp.style, { color: "#555", fontStyle: "italic" });
      noProp.textContent = "No properties";
      modsContainer.appendChild(noProp);
    } else {
      const createLine = (text, isShining) => {
        const div = document.createElement("div");
        div.className = "stat-line";
        div.textContent = text;
        if (isShining) {
          div.classList.add("mod-shine");
          setTimeout(() => div.classList.remove("mod-shine"), 500);
        }
        return div;
      };

      const uniques = item.mods.filter((m) => m.type === "unique");

      if (uniques.length > 0) {
        uniques.forEach((mod) =>
          modsContainer.appendChild(createLine(mod.data.effect, mod.shining))
        );
      } else {
        const prefixes = item.mods.filter((m) => m.type === "prefix");
        const suffixes = item.mods.filter((m) => m.type === "suffix");

        // Limit: Magic = 1, Rare = 3
        const limit = item.rarity === RARITY.MAGIC ? 1 : 3;

        // Render groups
        this.renderAffixGroup(
          modsContainer,
          "PREFIXES",
          prefixes,
          createLine,
          prefixes.length,
          limit
        );

        const hasSuffix = suffixes.length > 0;
        if (prefixes.length > 0 && hasSuffix) {
          const spacer = document.createElement("div");
          spacer.style.height = "8px";
          modsContainer.appendChild(spacer);
        }

        this.renderAffixGroup(
          modsContainer,
          "SUFFIXES",
          suffixes,
          createLine,
          suffixes.length,
          limit
        );
      }
      item.mods.forEach((m) => (m.shining = false));
    }

    // Update the aria-label so screen readers read the full item state when focused
    const fullText = `${finalName}, ${item.baseName}. ${item.rarity} Rarity. ${
      item.implicit ? "Implicit: " + item.implicit + "." : ""
    } ${item.mods.map((m) => m.data.effect).join(". ")}. ${
      item.corrupted ? "Corrupted." : ""
    }`;
    itemContainer.setAttribute("aria-label", fullText);
  }

  renderAffixGroup(container, title, list, createLineFn, count, limit) {
    if (list.length === 0) return;

    const header = document.createElement("div");
    header.className = "mod-section-header";
    // Format: PREFIXES (1/3)
    header.textContent = `${title} (${count}/${limit})`;
    container.appendChild(header);

    list.forEach((item) =>
      container.appendChild(createLineFn(item.data.effect, item.shining))
    );
  }

  constructItemName(item) {
    if (item.rarity === RARITY.NORMAL) return `Blank ${item.baseName}`;
    if (item.rarity === RARITY.RARE) return item.rareName;
    if (item.rarity === RARITY.UNIQUE) return "Undocumented Feature";

    if (item.rarity === RARITY.MAGIC) {
      const p = item.mods.find((m) => m.type === "prefix");
      const s = item.mods.find((m) => m.type === "suffix");
      let name = item.baseName;
      if (p && p.data && p.data.name) name = `${p.data.name} ${name}`;
      if (s && s.data && s.data.name) name = `${name} ${s.data.name}`;
      return name;
    }
    return item.baseName;
  }

  // --- Stash Management ---
  saveToStash() {
    const slots = this.elements.stashSlots;
    let targetSlot = null;
    let targetIndex = -1;

    // 1. Find first empty slot
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].hasChildNodes()) {
        targetSlot = slots[i];
        targetIndex = i;
        break;
      }
    }

    if (!targetSlot) {
      alert("Stash is full!");
      return;
    }

    const item = this.system.getItem();
    const rarityColors = {
      [RARITY.NORMAL]: "#e0e0e0",
      [RARITY.MAGIC]: "#8888ff",
      [RARITY.RARE]: "#ffff77",
      [RARITY.UNIQUE]: "#af6025",
    };
    const rarityColor = rarityColors[item.rarity] || "#e0e0e0";
    const finalName = this.constructItemName(item);

    // 2. Prepare HTML parts
    const iconPath = "icons/backpack1.svg"; // Default icon for stash items

    let implicitHtml = "";
    if (item.implicit) {
      implicitHtml = `<div class="item-implicit" style="display:block; margin-bottom:5px; color:#fff">${item.implicit}</div><div class="separator"></div>`;
    }

    let modsHtml = "";
    // Helper para criar linhas de mods
    const createModLineHtml = (text) =>
      `<div class="stat-line" style="color:${rarityColor}">${text}</div>`;

    if (item.rarity === RARITY.UNIQUE) {
      item.mods.forEach((m) => {
        modsHtml += `<div style="margin:2px 0;">${createModLineHtml(
          m.data.effect
        )}</div>`;
      });
    } else {
      const prefixes = item.mods.filter((m) => m.type === "prefix");
      const suffixes = item.mods.filter((m) => m.type === "suffix");
      const limit = item.rarity === RARITY.MAGIC ? 1 : 3;
      const headerStyle =
        "font-size: 10px; text-align: left; margin-top: 8px; width: 100%; color: #777;";

      if (prefixes.length > 0) {
        modsHtml += `<div class="mod-section-header" style="${headerStyle}">PREFIXES (${prefixes.length}/${limit})</div>`;
        prefixes.forEach((m) => {
          modsHtml += createModLineHtml(m.data.effect);
        });
      }
      if (suffixes.length > 0) {
        modsHtml += `<div class="mod-section-header" style="${headerStyle}">SUFFIXES (${suffixes.length}/${limit})</div>`;
        suffixes.forEach((m) => {
          modsHtml += createModLineHtml(m.data.effect);
        });
      }
    }

    let corruptedHtml = "";
    if (item.corrupted) {
      corruptedHtml = `<div class="corrupted-tag" style="display:block; margin-top:15px; font-size:16px; color:var(--corrupted-red);">CORRUPTED</div>`;
    }

    // 3. Assemble HTML directly (Safe because we control the data)
    let mobileDirection = "mobile-tooltip-left";
    if ([0, 1, 4, 5].includes(targetIndex)) {
      mobileDirection = "mobile-tooltip-right";
    }

    targetSlot.className = `inventory-slot small stash-slot ${item.rarity} tooltip-left ${mobileDirection}`;
    if (item.corrupted) {
      targetSlot.classList.add("corrupted");
      targetSlot.style.borderColor = "var(--corrupted-red)";
    }

    // --- A11Y FIX: Generate Full Description String ---
    // This string replicates what is visible in the tooltip but for Screen Readers
    const screenReaderText = `
      ${finalName}, ${item.baseName}. 
      ${item.rarity} Rarity. 
      ${item.implicit ? "Implicit: " + item.implicit + "." : ""} 
      ${item.mods.map((m) => m.data.effect).join(". ")}. 
      ${item.corrupted ? "Corrupted." : ""}
    `
      .replace(/\s+/g, " ")
      .trim(); // Clean up extra spaces

    // Set the aria-label on the slot itself so focus reads it immediately
    targetSlot.setAttribute("aria-label", screenReaderText);

    targetSlot.innerHTML = `
      <img src="${iconPath}" class="item-icon" style="${
      item.corrupted ? "filter: sepia(1) hue-rotate(-50deg) saturate(3);" : ""
    }">
      <div class="poe-tooltip" style="min-width: 300px;">
        <div class="item-header ${item.rarity}" style="${
      item.corrupted ? "border-bottom-color: var(--corrupted-red);" : ""
    }">
          <span class="item-name" style="color: ${rarityColor}">${finalName}</span>
          <span class="item-base" style="color: ${rarityColor}">${
      item.baseName
    }</span>
        </div>
        <div class="item-content" style="padding: 10px;">
          ${implicitHtml}
          <div style="width:100%; display:flex; flex-direction:column; align-items:center;">
             ${modsHtml}
          </div>
          ${corruptedHtml}
        </div>
      </div>
    `;

    this.showNotification("Item Saved to Stash");

    this.system.resetItem(this.system.currentType);
    this.updateDisplay();
  }

  triggerAnimation(animClass) {
    const el = this.elements.itemContainer;
    el.classList.remove("crafting-anim", "error-anim");
    void el.offsetWidth;
    el.classList.add(animClass);
  }

  showNotification(text, type = "success") {
    const notif = document.createElement("div");

    notif.className = "stash-notification";
    if (type === "error") {
      notif.classList.add("error");
    }

    notif.innerText = text;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 2000);
  }
}
