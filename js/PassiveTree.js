import { treeData, links } from "./data/treeData.js";

export class PassiveTree {
  constructor() {
    this.cx = 1500;
    this.cy = 1500;
    this.allocated = new Set(["start"]);
    this.treeInitialized = false;
    this.panzoomInstance = null;

    // Variable to save previous focus before opening modal
    this.previousFocus = null;
    // Bind to ensure 'this' context works in event listener
    this.boundFocusTrap = this.handleFocusTrap.bind(this);
  }

  // --- Tree Initialization & Drawing ---
  initTree() {
    if (this.treeInitialized) return;
    const canvas = document.getElementById("tree-canvas");
    const svg = document.getElementById("svg-layer");

    // Adding circle runes to passive tree
    const runeContainer = document.createElement("div");
    runeContainer.className = "rune-circle-container";
    runeContainer.innerHTML = `
          <div class="rune-circle-inner" style="width: 800px; height: 800px;"></div>
          <div class="rune-circle-outer" style="width: 1000px; height: 1000px;"></div>
      `;
    runeContainer.style.position = "absolute";
    runeContainer.style.zIndex = "0";
    canvas.appendChild(runeContainer);

    // Draw Section Labels
    const labels = [
      { text: "SYSTEMS", x: this.cx, y: this.cy - 600 },
      { text: "BUG REPORT", x: this.cx, y: this.cy + 600 },
      { text: "TECHNICAL", x: this.cx + 850, y: this.cy },
      { text: "PROCESS", x: this.cx - 900, y: this.cy },
    ];
    labels.forEach((l) => {
      const lbl = document.createElement("div");
      lbl.className = "section-label";
      lbl.innerText = l.text;
      lbl.style.left = l.x + "px";
      lbl.style.top = l.y + "px";
      canvas.appendChild(lbl);
    });

    // Draw Lines
    links.forEach((l) => {
      const n1 = treeData.find((n) => n.id === l.from);
      const n2 = treeData.find((n) => n.id === l.to);
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", n1.x);
      line.setAttribute("y1", n1.y);
      line.setAttribute("x2", n2.x);
      line.setAttribute("y2", n2.y);
      line.setAttribute("class", "link");
      line.setAttribute("id", `link-${l.from}-${l.to}`);
      svg.appendChild(line);
    });

    // Draw Nodes
    treeData.forEach((n) => {
      const el = document.createElement("div");
      let region = n.id.startsWith("gm_")
        ? "north"
        : n.id.startsWith("bug_")
          ? "south"
          : n.id.startsWith("tech_")
            ? "east"
            : "west";
      el.className = `node ${n.type || ""} ${region}`;
      el.id = n.id;
      el.style.left = n.x + "px";
      el.style.top = n.y + "px";
      el.innerHTML = `<span class="icon">${n.icon}</span>`;

      // --- ACCESSIBILITY ---
      el.setAttribute("tabindex", "0"); // Allow Tab focus
      el.setAttribute("role", "button"); // Semantic button

      // Define initial text for screen readers
      const status = this.allocated.has(n.id) ? "Allocated" : "Unallocated";
      el.setAttribute("aria-label", `${n.name}: ${n.desc}. Status: ${status}`);

      // 1. Mouse Click
      el.onclick = () => {
        this.toggleNode(n.id);
        // Update screen reader status after click
        this.updateNodeAriaLabel(n.id, n.name, n.desc);
      };

      // 2. Keyboard (Enter/Space)
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); // Prevent scrolling with Space
          this.toggleNode(n.id);
          // Update screen reader status after activation
          this.updateNodeAriaLabel(n.id, n.name, n.desc);
        }
      });

      // Tooltip Config
      tippy(el, {
        content: `<div style="text-align:center; min-width: 150px;">
                      <strong style="color: #c0a040; text-transform:uppercase;">${n.name}</strong>
                      <div style="height:1px; background:#444; margin:5px 0;"></div>
                      <span style="color:#ccc; font-size: 0.9em;">${n.desc}</span>
                  </div>`,
        allowHTML: true,
        theme: "translucent",
        animation: "shift-away",
        duration: [200, 0],
        delay: [50, 0],
      });
      canvas.appendChild(el);
    });

    // Initialize Panzoom
    this.panzoomInstance = Panzoom(canvas, {
      maxScale: 2,
      minScale: 0.3,
      contain: "outside",
      startScale: 0.8,
      touchAction: "none",
    });
    document
      .getElementById("tree-container")
      .addEventListener("wheel", this.panzoomInstance.zoomWithWheel);

    this.updateVisuals();
    this.treeInitialized = true;

    // Recenter
    setTimeout(
      () =>
        this.panzoomInstance.pan(
          -this.cx + window.innerWidth / 2,
          -this.cy + window.innerHeight / 2
        ),
      100
    );
  }

  // --- Helper: Adjacency Map for Graph Logic ---
  getAdjacencyList() {
    const adj = new Map();
    treeData.forEach((node) => adj.set(node.id, new Set()));
    links.forEach((link) => {
      adj.get(link.from).add(link.to);
      adj.get(link.to).add(link.from);
    });
    return adj;
  }

  // --- Pathfinding (BFS) to validate connections ---
  getReachableNodes(currentAllocated) {
    const adj = this.getAdjacencyList();
    const reachable = new Set(["start"]);
    const queue = ["start"];

    while (queue.length > 0) {
      const currentId = queue.shift();

      adj.get(currentId).forEach((neighborId) => {
        if (currentAllocated.has(neighborId) && !reachable.has(neighborId)) {
          reachable.add(neighborId);
          queue.push(neighborId);
        }
      });
    }
    return reachable;
  }

  // --- Interaction Logic ---
  toggleNode(id) {
    if (id === "start") return;

    if (this.allocated.has(id)) {
      // Try to unspecc (Unallocating)
      this.allocated.delete(id);

      // Revalidate the tree (Remove disconnected islands)
      const trulyReachable = this.getReachableNodes(this.allocated);

      const nodesToRemove = [];
      this.allocated.forEach((nodeId) => {
        if (!trulyReachable.has(nodeId)) {
          nodesToRemove.push(nodeId);
        }
      });

      nodesToRemove.forEach((nodeId) => this.allocated.delete(nodeId));
    } else {
      // Try to allocate
      const adj = this.getAdjacencyList();
      const neighbors = adj.get(id);
      let isReachable = false;

      for (const neighborId of neighbors) {
        if (this.allocated.has(neighborId)) {
          isReachable = true;
          break;
        }
      }

      if (isReachable) {
        this.allocated.add(id);
      }
    }
    this.updateVisuals();
  }

  updateVisuals() {
    // Update Node Styles
    treeData.forEach((n) => {
      const el = document.getElementById(n.id);
      if (this.allocated.has(n.id)) {
        el.classList.add("allocated");
        if (n.type === "keystone") el.classList.add("allocated");
      } else {
        el.classList.remove("allocated");
      }
    });
    // Update Connection Lines
    links.forEach((l) => {
      const line = document.getElementById(`link-${l.from}-${l.to}`);
      if (this.allocated.has(l.from) && this.allocated.has(l.to))
        line.classList.add("active");
      else line.classList.remove("active");
    });
    // Update Counter
    const counter = document.getElementById("points-counter");
    if (counter) counter.innerText = this.allocated.size - 1;
  }

  // Helper to dynamically update screen reader text
  updateNodeAriaLabel(id, name, desc) {
    const el = document.getElementById(id);
    if (el) {
      const status = this.allocated.has(id) ? "Allocated" : "Unallocated";
      el.setAttribute("aria-label", `${name}: ${desc}. Status: ${status}`);
    }
  }

  // --- Modal Controls with Focus Trap ---

  openTree() {
    const modal = document.getElementById("tree-modal");
    modal.style.display = "block";

    // 1. Save where the user was before opening the modal
    this.previousFocus = document.activeElement;

    if (!this.treeInitialized) {
      this.initTree();
    }

    // 2. Focus on the close button first
    const closeBtn = modal.querySelector(".close-modal");
    if (closeBtn) closeBtn.focus();

    // 3. Activate Focus Trap
    document.addEventListener("keydown", this.boundFocusTrap);

    setTimeout(() => {
      const defaultScale = 1.0;
      this.panzoomInstance.zoom(defaultScale, { animate: false });
      const valX = window.innerWidth / 2 - this.cx * defaultScale;
      const valY = window.innerHeight / 2 - this.cy * defaultScale;
      this.panzoomInstance.pan(valX, valY, { animate: false });
    }, 100);
  }

  closeTree() {
    document.getElementById("tree-modal").style.display = "none";

    // 1. Remove the trap
    document.removeEventListener("keydown", this.boundFocusTrap);

    // 2. Return focus to the button that opened the modal
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  // Focus Trap Logic
  handleFocusTrap(e) {
    if (e.key === "Escape") {
      this.closeTree();
      return;
    }

    if (e.key !== "Tab") return;

    const modal = document.getElementById("tree-modal");

    // Find all focusable elements inside modal (Close Button + Tree Nodes)
    const focusableElements = modal.querySelectorAll(
      ".close-modal, .node[tabindex='0']"
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If Shift + Tab and on first item -> move to last
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    }
    // If Tab only and on last item -> move to first
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}
