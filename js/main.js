import { PassiveTree } from './PassiveTree.js';
import { setupTooltips } from './tooltips.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Instancia a classe da árvore
    const myTree = new PassiveTree();

    // 2. Configura os Tooltips
    setupTooltips();

    // 3. EVENT LISTENERS
    // Substituindo o 'onclick="openTree()"' do HTML
    const treeBtn = document.querySelector('.tree-btn');
    if (treeBtn) {
        treeBtn.addEventListener('click', () => {
            myTree.openTree();
        });
    }

    // Substituindo o 'onclick="closeTree()"' do HTML
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            myTree.closeTree();
        });
    }
});