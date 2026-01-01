import { PassiveTree } from "./PassiveTree.js";
import { setupTooltips } from "./tooltips.js";
import { CraftingBench } from "./CraftingBench.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Instance Modules
  const myTree = new PassiveTree();
  const myBench = new CraftingBench();

  // 2. Config Tooltips (Tippy.js)
  setupTooltips();

  // 3. Global Event Listeners
  const treeBtn = document.querySelector(".tree-btn");
  if (treeBtn) {
    treeBtn.addEventListener("click", () => {
      myTree.openTree();
    });
  }
  const closeBtn = document.querySelector(".close-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      myTree.closeTree();
    });

    // Crafting Bench Listener
    const craftBtn = document.querySelector(".craft-btn");
    if (craftBtn) {
      craftBtn.addEventListener("click", () => {
        myBench.openBench();
      });
    }
    const closeBenchBtn = document.querySelector(
      "#crafting-modal .close-modal"
    );
    if (closeBenchBtn) {
      closeBenchBtn.addEventListener("click", () => {
        myBench.closeBench();
      });
    }
  }
});
