// js/CraftingBench.js
import { CraftingSystem } from "./CraftingSystem.js";
import { RARITY, ITEM_TYPE } from "./data/constants.js";

export class CraftingBench {
  constructor() {
    this.system = new CraftingSystem();
    this.initDOM();
    this.bindEvents();
    this.updateDisplay();
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
    document.querySelectorAll(".currency-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        const type = slot.getAttribute("data-currency");
        this.handleCraft(type);
      });
    });

    if (this.elements.baseSelector) {
      this.elements.baseSelector.addEventListener("change", (e) => {
        this.system.resetItem(e.target.value);
        this.updateDisplay();
        this.triggerAnimation("crafting-anim");
      });
    }

    if (this.elements.saveBtn) {
      this.elements.saveBtn.addEventListener("click", () => this.saveToStash());
    }
  }

  openBench() {
    this.elements.modal.style.display = "flex";
  }

  closeBench() {
    this.elements.modal.style.display = "none";
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

    // 1. Classes e Base
    itemContainer.className = `item-display ${item.rarity} ${
      item.corrupted ? "is-corrupted" : ""
    }`;
    itemBase.textContent = item.baseName;

    // 2. Item name
    itemName.textContent = this.constructItemName(item);

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

    // 2. Create Icon Image (Safe DOM creation)
    const img = document.createElement("img");
    img.src = "icons/backpack1.svg";
    img.className = "item-icon";
    if (item.corrupted) {
      img.style.filter = "sepia(1) hue-rotate(-50deg) saturate(3)";
    }

    // 3. Create Tooltip Container
    const tooltip = document.createElement("div");
    tooltip.className = "poe-tooltip";
    tooltip.style.minWidth = "300px";

    // 3a. Tooltip Header
    const header = document.createElement("div");
    header.className = `item-header ${item.rarity}`;
    if (item.corrupted) {
      header.style.borderBottomColor = "var(--corrupted-red)";
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "item-name";
    nameSpan.style.color = rarityColor;
    nameSpan.textContent = finalName;

    const baseSpan = document.createElement("span");
    baseSpan.className = "item-base";
    baseSpan.style.color = rarityColor;
    baseSpan.textContent = item.baseName;

    header.appendChild(nameSpan);
    header.appendChild(baseSpan);

    // 3b. Tooltip Content
    const content = document.createElement("div");
    content.className = "item-content";
    content.style.padding = "10px";

    // Implicit
    if (item.implicit) {
      const impDiv = document.createElement("div");
      impDiv.className = "item-implicit";
      impDiv.style.display = "block";
      impDiv.style.marginBottom = "5px";
      impDiv.style.color = "#fff";
      impDiv.textContent = item.implicit;

      const sep = document.createElement("div");
      sep.className = "separator";

      content.appendChild(impDiv);
      content.appendChild(sep);
    }

    // Mods Container
    const modsDiv = document.createElement("div");
    modsDiv.style.width = "100%";
    modsDiv.style.display = "flex";
    modsDiv.style.flexDirection = "column";
    modsDiv.style.alignItems = "center";

    // Helper to create mod lines safely
    const createModLine = (text) => {
      const line = document.createElement("div");
      line.className = "stat-line";
      line.style.color = rarityColor;
      line.textContent = text;
      return line;
    };

    if (item.rarity === RARITY.UNIQUE) {
      item.mods.forEach((m) => {
        const line = createModLine(m.data.effect);
        line.style.margin = "2px 0";
        modsDiv.appendChild(line);
      });
    } else {
      const prefixes = item.mods.filter((m) => m.type === "prefix");
      const suffixes = item.mods.filter((m) => m.type === "suffix");
      const limit = item.rarity === RARITY.MAGIC ? 1 : 3;

      const headerStyle =
        "font-size: 10px; text-align: left; margin-top: 8px; width: 100%; color: #777;";

      if (prefixes.length > 0) {
        const pHeader = document.createElement("div");
        pHeader.className = "mod-section-header";
        pHeader.style.cssText = headerStyle;
        pHeader.textContent = `PREFIXES (${prefixes.length}/${limit})`;
        modsDiv.appendChild(pHeader);

        prefixes.forEach((m) =>
          modsDiv.appendChild(createModLine(m.data.effect))
        );
      }

      if (suffixes.length > 0) {
        const sHeader = document.createElement("div");
        sHeader.className = "mod-section-header";
        sHeader.style.cssText = headerStyle;
        sHeader.textContent = `SUFFIXES (${suffixes.length}/${limit})`;
        modsDiv.appendChild(sHeader);

        suffixes.forEach((m) =>
          modsDiv.appendChild(createModLine(m.data.effect))
        );
      }
    }
    content.appendChild(modsDiv);

    // Corrupted Tag
    if (item.corrupted) {
      const corrTag = document.createElement("div");
      corrTag.className = "corrupted-tag";
      corrTag.style.display = "block";
      corrTag.style.marginTop = "15px";
      corrTag.style.fontSize = "16px";
      corrTag.style.color = "var(--corrupted-red)";
      corrTag.textContent = "CORRUPTED";
      content.appendChild(corrTag);
    }

    // Assemble Tooltip
    tooltip.appendChild(header);
    tooltip.appendChild(content);

    // 4. Assemble Slot
    let mobileDirection = "mobile-tooltip-left";
    if ([0, 1, 4, 5].includes(targetIndex)) {
      mobileDirection = "mobile-tooltip-right";
    }

    targetSlot.className = `inventory-slot small stash-slot ${item.rarity} tooltip-left ${mobileDirection}`;
    if (item.corrupted) {
      targetSlot.classList.add("corrupted");
      targetSlot.style.borderColor = "var(--corrupted-red)";
    }

    // Clear and append new elements
    targetSlot.innerHTML = "";
    targetSlot.appendChild(img);
    targetSlot.appendChild(tooltip);

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
