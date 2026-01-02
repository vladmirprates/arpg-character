import { jest } from '@jest/globals';
import { PassiveTree } from '../js/PassiveTree.js';

// 1. Mock global dependencies (Panzoom and Tippy)
// Panzoom returns an object with fake methods to avoid breaking
global.Panzoom = jest.fn(() => ({
  zoom: jest.fn(),
  pan: jest.fn(),
  zoomWithWheel: jest.fn()
}));
global.tippy = jest.fn();

describe('PassiveTree Logic & Graph', () => {
  let tree;

  beforeEach(() => {
    // Minimal DOM setup required for initTree to run
    document.body.innerHTML = `
      <div id="tree-modal" style="display:none;">
        <div class="close-modal">X</div>
        <div id="tree-container">
            <div id="tree-canvas">
                <svg id="svg-layer"></svg>
            </div>
        </div>
        <span id="points-counter">0</span>
      </div>
    `;
    
    tree = new PassiveTree();
    tree.initTree(); // Force initialization and drawing of nodes
  });

  test('Should start with only "start" node allocated', () => {
    expect(tree.allocated.size).toBe(1);
    expect(tree.allocated.has('start')).toBe(true);
  });

  test('Should allocate a connected node (Valid Move)', () => {
    // The 'start' node connects to 'gm_mechanics' (check your treeData.js)
    // Let's simulate a click on 'gm_mechanics'
    
    // Simulates internal toggleNode logic
    tree.toggleNode('gm_mechanics');

    expect(tree.allocated.has('gm_mechanics')).toBe(true);
    
    // Verify if CSS class was applied to DOM
    const nodeEl = document.getElementById('gm_mechanics');
    expect(nodeEl.classList.contains('allocated')).toBe(true);
  });

  test('Should NOT allocate a disconnected node (Invalid Move)', () => {
    // Try to allocate a far node (e.g. 'tech_master') without path
    tree.toggleNode('tech_master');

    expect(tree.allocated.has('tech_master')).toBe(false);
    
    const nodeEl = document.getElementById('tech_master');
    expect(nodeEl.classList.contains('allocated')).toBe(false);
  });

  test('Deallocating a node should remove disconnected children (Pathfinding)', () => {
    // Path: start -> gm_mechanics -> gm_collision
    tree.toggleNode('gm_mechanics');
    tree.toggleNode('gm_collision');
    
    expect(tree.allocated.has('gm_collision')).toBe(true);

    // Now remove the middle node ('gm_mechanics')
    // This should "cut" power to 'gm_collision'
    tree.toggleNode('gm_mechanics');

    expect(tree.allocated.has('gm_mechanics')).toBe(false);
    expect(tree.allocated.has('gm_collision')).toBe(false); // Should be automatically removed
  });

  test('Should handle Escape key to close modal', () => {
    const modal = document.getElementById('tree-modal');
    modal.style.display = 'block';
    
    // Simulate ESC key
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    tree.handleFocusTrap(event);

    expect(modal.style.display).toBe('none');
  });
});