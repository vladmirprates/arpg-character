// js/CraftingBench.js
import { CraftingSystem } from "./CraftingSystem.js";
import { RARITY, ITEM_TYPE } from "./constants.js";

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
    const success = this.system.craft(currencyType);

    if (success) {
      this.triggerAnimation("crafting-anim");
      this.updateDisplay();
    } else {
      this.triggerAnimation("error-anim");
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
    let iconPath = "icons/backpack1.svg";

    const rarityColors = {
      [RARITY.NORMAL]: "#e0e0e0",
      [RARITY.MAGIC]: "#8888ff",
      [RARITY.RARE]: "#ffff77",
      [RARITY.UNIQUE]: "#af6025",
    };
    const rarityColor = rarityColors[item.rarity] || "#e0e0e0";
    const finalName = this.constructItemName(item);

    let modsHtml = "";
    if (item.rarity === RARITY.UNIQUE) {
      item.mods.forEach((m) => {
        modsHtml += `<div class="stat-line" style="color:${rarityColor}; margin: 2px 0;">${m.data.effect}</div>`;
      });
    } else {
      const prefixes = item.mods.filter((m) => m.type === "prefix");
      const suffixes = item.mods.filter((m) => m.type === "suffix");
      const headerStyle = `font-size: 10px; text-align: left; margin-top: 8px; width: 100%; color: #777;`;

      const limit = item.rarity === RARITY.MAGIC ? 1 : 3;

      if (prefixes.length > 0) {
        modsHtml += `<div class="mod-section-header" style="${headerStyle}">PREFIXES (${prefixes.length}/${limit})</div>`;
        prefixes.forEach(
          (m) =>
            (modsHtml += `<div class="stat-line" style="color:${rarityColor}">${m.data.effect}</div>`)
        );
      }
      if (suffixes.length > 0) {
        modsHtml += `<div class="mod-section-header" style="${headerStyle}">SUFFIXES (${suffixes.length}/${limit})</div>`;
        suffixes.forEach(
          (m) =>
            (modsHtml += `<div class="stat-line" style="color:${rarityColor}">${m.data.effect}</div>`)
        );
      }
    }

    const implicitHtml = item.implicit
      ? `<div class="item-implicit" style="display:block; margin-bottom:5px; color:#fff;">${item.implicit}</div><div class="separator"></div>`
      : "";

    const corruptedHtml = item.corrupted
      ? `<div class="corrupted-tag" style="display:block; margin-top:15px; font-size:16px; color: var(--corrupted-red);">CORRUPTED</div>`
      : "";

    let mobileDirection = "mobile-tooltip-left";
    if ([0, 1, 4, 5].includes(targetIndex))
      mobileDirection = "mobile-tooltip-right";

    targetSlot.className = `inventory-slot small stash-slot ${item.rarity} tooltip-left ${mobileDirection}`;
    if (item.corrupted) {
      targetSlot.classList.add("corrupted");
      targetSlot.style.borderColor = "var(--corrupted-red)";
    }

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

  showNotification(text) {
    const notif = document.createElement("div");
    notif.className = "stash-notification";
    notif.innerText = text;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
  }
}
