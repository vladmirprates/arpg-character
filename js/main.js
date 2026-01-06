import { PassiveTree } from "./PassiveTree.js";
import { setupTooltips } from "./tooltips.js";
import { CraftingBench } from "./CraftingBench.js";
import { Inventory } from "./Inventory.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Instance Modules
  const myTree = new PassiveTree();
  const myBench = new CraftingBench();
  const myInventory = new Inventory();

  // 2. Config Tooltips (Tippy.js)
  setupTooltips();

  // 3. Global Event Listeners

  // A. Tree Button (Open)
  const treeBtn = document.querySelector(".tree-btn");
  if (treeBtn) {
    treeBtn.addEventListener("click", () => myTree.openTree());
  }

  // B. Tree Close Button (Close)
  const treeCloseBtn = document.querySelector("#tree-modal .close-modal");
  if (treeCloseBtn) {
    // Mouse
    treeCloseBtn.addEventListener("click", () => myTree.closeTree());

    // Keyboard (Enter/Space)
    treeCloseBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        myTree.closeTree();
      }
    }); 
  }

  // C. Crafting Bench Button (Open)
  const craftBtn = document.querySelector(".craft-btn");
  if (craftBtn) {
    craftBtn.addEventListener("click", () => myBench.openBench());
  }
});
