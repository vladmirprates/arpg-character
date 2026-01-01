// js/tooltips.js
import { TOOLTIPS_DATA } from "./data/tooltipsData.js";

export function setupTooltips() {
  const commonConfig = {
    allowHTML: true,
    placement: "top",
    animation: "shift-away",
    interactive: true,
    duration: [200, 0],
    delay: [50, 0],
  };

  // Helper function to generate standard PoE HTML
  const generateTooltipHTML = (data) => {
    return `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">${data.name}</span>
          <span class="item-base">${data.type}</span>
        </div>
        <div class="item-content">
          ${data.content}
        </div>
      </div>
    `;
  };

  // Iterate over data and create tooltips
  for (const [selector, data] of Object.entries(TOOLTIPS_DATA)) {
    tippy(selector, {
      ...commonConfig,
      content: generateTooltipHTML(data),
    });
  }
}

// Close tooltips on mobile/touch if tapping outside
document.addEventListener("touchstart", function (e) {
  if (!e.target.closest(".inventory-slot")) {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }
});