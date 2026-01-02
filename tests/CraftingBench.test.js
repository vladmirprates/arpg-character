import { jest } from '@jest/globals';
import { CraftingBench } from '../js/CraftingBench.js';
import { ITEM_TYPE, RARITY } from '../js/data/constants.js';

// 1. Mock global dependencies (Tippy)
global.tippy = jest.fn();

describe('CraftingBench UI Integration', () => {
  let bench;

  // 2. Setup fake DOM before each test
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="crafting-modal" style="display: none;">
        <div class="close-modal">X</div>
        <select id="base-selector">
          <option value="${ITEM_TYPE.BUG}">Bug Report</option>
          <option value="${ITEM_TYPE.TESTCASE}">Test Case</option>
        </select>
        <button id="btn-save-item">Save</button>
      </div>
      
      <div id="crafting-item" class="item-display normal">
        <div class="item-name">Item Name</div>
        <div class="item-base">Item Base</div>
        <div id="item-mods"></div>
        <div id="item-implicit">
            <div id="implicit-text"></div>
        </div>
        <div class="corrupted-tag"></div>
      </div>

      <div class="currency-belt">
        <div class="currency-slot" data-currency="transmute"></div>
        <div class="currency-slot" data-currency="regal"></div>
        <div class="currency-slot" data-currency="scouring"></div>
      </div>

      <div class="stash-slot"></div>
      <div class="stash-slot"></div>
    `;

    // Initialize the class
    bench = new CraftingBench();
    // Spy on notification method to avoid creating elements in real body
    jest.spyOn(bench, 'showNotification').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should initialize with Normal rarity', () => {
    const itemContainer = document.getElementById('crafting-item');
    expect(itemContainer.classList.contains('normal')).toBe(true);
    expect(bench.system.item.rarity).toBe(RARITY.NORMAL);
  });

  test('Clicking Transmute should make item Magic visually', () => {
    // Simulate click on Transmute Orb
    const transmuteBtn = document.querySelector('[data-currency="transmute"]');
    transmuteBtn.click();

    // Visual Verification (View)
    const itemContainer = document.getElementById('crafting-item');
    expect(itemContainer.classList.contains('magic')).toBe(true);
    
    // Logical Verification (System/Model)
    expect(bench.system.item.rarity).toBe(RARITY.MAGIC);
  });

  test('Scouring Orb should reset item to Normal', () => {
    // 1. Make Magic first
    bench.system.item.rarity = RARITY.MAGIC;
    bench.system.item.mods = [{ data: { effect: 'Mod' } }];
    bench.updateDisplay();

    // 2. Use Scouring
    const scourBtn = document.querySelector('[data-currency="scouring"]');
    scourBtn.click();

    // 3. Verify
    const itemContainer = document.getElementById('crafting-item');
    expect(itemContainer.classList.contains('normal')).toBe(true);
    expect(bench.system.item.mods.length).toBe(0);
  });

  test('Should change Base Type when selector changes', () => {
    const select = document.getElementById('base-selector');
    select.value = ITEM_TYPE.TESTCASE;
    
    // Trigger change event manually
    select.dispatchEvent(new Event('change'));

    expect(bench.system.currentType).toBe(ITEM_TYPE.TESTCASE);
    // Verify if DOM text updated (must match itemPools baseName)
    const baseText = document.querySelector('.item-base').textContent;
    expect(baseText).toBe("Test Case");
  });
});