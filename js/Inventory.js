import { INITIAL_ITEMS } from "./data/initialItems.js";

export class Inventory {
  constructor() {
    this.init();
  }

  init() {
    INITIAL_ITEMS.forEach((item) => {
      const slot = document.querySelector(item.selector);

      if (slot) {
        this.renderItem(slot, item);
      } else {
        console.warn(
          `Inventory: Slot not found for selector "${item.selector}"`
        );
      }
    });
  }

  renderItem(slotContainer, item) {
    slotContainer.classList.remove(
      "normal",
      "magic",
      "rare",
      "unique",
      "corrupted"
    );
    slotContainer.classList.add(item.rarity);
    slotContainer.setAttribute("tabindex", "0");
    slotContainer.setAttribute("role", "button");

    const statsHtml = item.stats
      .map((stat) => {
        if (stat.type === "separator") return '<div class="separator"></div>';
        if (stat.color) {
          return `<div><span class="stat-${stat.color}">${stat.text}</span></div>`;
        }
        return `<div>${stat.text}</div>`;
      })
      .join("");

    slotContainer.innerHTML = `
      <img src="${item.icon}" class="item-icon" alt="${item.name}" />
      <div class="poe-tooltip">
         <div class="item-header ${item.rarity}">
            <span class="item-name">${item.name}</span>
            <span class="item-base">${item.base}</span>
         </div>
         <div class="item-content">
            ${statsHtml}
            <div class="flavor-text">${item.flavor || ""}</div>
         </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    const cleanStats = item.stats
      .map((s) => {
        if (s.type === "separator") return "";
        tempDiv.innerHTML = s.text;
        return tempDiv.textContent || s.text || "";
      })
      .join(". ");
    const flavorString = item.flavor ? `Flavor Text: ${item.flavor}` : "";

    const fullText = `${item.name}, ${item.base}. ${cleanStats}. ${flavorString}`;
    slotContainer.setAttribute("aria-label", fullText.trim());
  }
}
