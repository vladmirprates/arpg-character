import { PassiveTree } from './PassiveTree.js';
import { setupTooltips } from './tooltips.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Instance Tree
    const myTree = new PassiveTree();

    // 2. Config Tooltips
    setupTooltips();

    // 3. Event Listeners
    const treeBtn = document.querySelector('.tree-btn');
    if (treeBtn) {
        treeBtn.addEventListener('click', () => {
            myTree.openTree();
        });
    }
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            myTree.closeTree();
        });
    }
});