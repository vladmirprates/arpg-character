# QA Character Sheet & Crafting Bench 🛡️🎲

**A Gamified QA Portfolio inspired by Action RPGs (PoE, Diablo, Last Epoch).**

This project transforms a standard QA Engineer resume into an interactive RPG character sheet. It gamifies technical skills, tools, and daily workflows using mechanics familiar to ARPG players, such as passive skill trees, inventory management, and item crafting.

## 🌟 Project Concept

The goal is to demonstrate technical proficiency in **Frontend Development** (HTML/CSS/JS) and **Logic** while showcasing **QA competencies** in a creative, engaging way.

-   **The "Character":** A Mid-Level QA
-   **The "Skills":** Represented as a complex node-based Passive Tree
-   **The "Work":** Represented as a Crafting Bench where "Bug Reports", "Test Cases" and "Automation Scripts" are rolled using currency orbs like in Path of Exile crafting system (logic algorithms)

## ✨ Key Features

### 🌳 Interactive Passive Tree
A fully navigable SVG-based skill tree that visualizes professional competencies.
-   **Pathfinding Logic:** Nodes are only allocated if connected to the start, simulating skill progression
-   **Categories:** Zones dedicated to Automation, Manual Testing, Process Management, and specialized testing (Localization, Physics, etc)
-   **Zoom & Pan:** Smooth navigation using mouse interactions

### 🔨 The Crafting Bench
A simulation of RNG-based crafting systems applied to QA artifacts.
-   **Item Bases:** Users can craft "Bug Reports", "Test Cases", or "Automation Scripts"
-   **Currency System:** Custom "orbs" that modify item properties (e.g., *Orb of Triage* turns a ticket into a Magic item; *Orb of Deployment* corrupts the item)
-   **Affix System:** Logic that randomly assigns prefixes and suffixes based on the item's type and rarity (e.g., *"of the Heisenbug"* or *"Headless"*)

### 🎒 Inventory & Equipment
-   **Tooltips:** Dynamic, hover-over tooltips that describe tools (Jira, Playwright, Jenkins) as if they were legendary weapons and armor
-   **Responsive UI:** A layout that adapts from desktop to mobile, maintaining the "game interface" aesthetic

## 🛠️ Tech Stack

-   **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
-   **Visualization:** SVG for the tree connections
-   **Libraries:**
    -   `Panzoom` (for canvas navigation).
    -   `Tippy.js` & `Popper.js` (for advanced tooltips).
-   **Style:** Custom CSS with heavy use of CSS Variables, Flexbox, Grid, and Animations


## 🚧 Roadmap & Future Improvements

This project is currently under active refactoring to align with Engineering and QA best practices. Upcoming updates include:

-   ~~**Architecture:** Separating UI rendering logic from Game/Business logic (MVC pattern)~~
-   **Testing:** Implementation of Unit Tests (Jest/Vitest) for the Crafting and Tree pathfinding algorithms
-   ~~**Accessibility:** Improving ARIA labels and keyboard navigation for the inventory and tree~~
-   ~~**Security:** Sanitizing DOM manipulation to prevent injection risks~~


---
*Created by Vladmir Prates - QA Professional & ARPG Enthusiast*
