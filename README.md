> **Falante de Português?** Leia a [Versão em Português aqui](README-pt.md)
# 🛡️ QA Character Sheet & Crafting Bench

> An interactive, gamified portfolio combining my passion for ARPGs with my career in **Quality Assurance**.

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)
![Accessibility](https://img.shields.io/badge/A11y-WCAG_2.1-blue)

## 🎯 About The Project

This project is a personal experiment: **"What if my resume was an Action RPG like Path of Exile, Diablo, Last Epoch and etc?"**

As a **Mid-Level QA Engineer**, my goal was to step out of my comfort zone and combine work with fun. I wanted to build something interactive to demonstrate my technical skills, but also use this project as a **learning laboratory**.

The focus isn't just on showing code, but on how I apply the **QA Mindset** to software development: ensuring it is testable, accessible, and well-structured from day one.

**Key Features:**
* **Passive Skill Tree:** An interactive graph (with zoom/pan) visualizing my QA competencies in a playful way.
* **Crafting Bench:** A fully functional simulator where you use "Orbs" to modify *Bug Reports* and *Test Cases*, applying real business logic (probabilities, prefixes/suffixes constraints). This replicates the basic currency crafting mechanics from Path of Exile.
* **Inventory System:** Equipment slots representing the tools I use daily (Jira, Playwright, etc.).

---

## 🛠️ What I Learned & Applied (Technical Highlights)

This project was an opportunity to practice advanced concepts that I value in my daily work routine.

### 1. 🧪 Automated Testing (Jest)
I believe quality must be guaranteed by code, not just manual effort.
* Decoupled business logic (`CraftingSystem.js`) from the UI to facilitate testing.
* Created **Unit Tests** to validate item probabilities and rule constraints.
* Used **Integration Tests** to ensure the interface responds correctly to user actions.

### 2. ♿ Accessibility (A11y)
Quality software must be usable by everyone. I strove to apply WCAG best practices:
* The project is **100% navigable via keyboard** (Tab, Enter, Esc).
* Implemented **"Focus Traps"** in modals so keyboard users don't get lost.
* Used semantic `roles` and dynamic `aria-labels` so screen readers can understand the context (e.g., crafting results are announced automatically).

### 3. 🏗️ Architecture & Organization
I tried to keep the code clean and organized to make future maintenance easier.
* **MVC Pattern:** Clear separation between Logic (Model), Interface (View/Controller), and Data.
* **Security:** Basic XSS prevention by avoiding unsafe DOM manipulation.

---

## 🚀 How to Run Locally

If you want to test the application or run the test suite on your machine:

### Prerequisites
* **Node.js** (Required only for running automated tests)
* A modern web browser.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vladmirprates/arpg-character.git
    cd arpg-character
    ```

2.  **Install dependencies (for testing):**
    ```bash
    npm install
    ```

## 🟢 Running Tests 
To see the business rule validation in action:

```bash
npm test
```
You should see all tests passing in the terminal.

### Running the Application
Since this project uses modern ES Modules, it requires a simple local server.


Option A: Using Python

```bash
python -m http.server
```
Open http://localhost:8000 in your browser


Option B: Using VS Code

Install the Live Server extension.
Right-click index.html and select "Open with Live Server".

Option C: Using Node.js (via npx)

```bash
npx http-server -o
```

## 📂 Project Structure
```
/
│
│   ├── js/
│   │   ├── data/             # Static Data (Item Pools, Tree Nodes, Text)
│   │   ├── CraftingBench.js  # UI Controller
│   │   ├── CraftingSystem.js # Pure Logic (Game Rules)
│   │   ├── PassiveTree.js    # Graph Logic & Zoom
│   │   ├── main.js           # Entry Point
│   │   └── tooltips.js       # Tooltip Configuration
│   ├── css/                  # Styles & Responsiveness
│   └── icons/                # Visual Assets
├── tests/                    # Test Suite (Jest)
│   ├── CraftingBench.test.js
│   ├── CraftingSystem.test.js
│   └── PassiveTree.test.js
├── index.html                # Main HTML
├── package.json              # NPM Config
└── babel.config.js           # Babel Config (for Jest)
```

### 👤 Author
**Vladmir Prates** - QA Engineer (Mid-Level)

Hobbies: ARPGs, Gaming in general and learning new tech

This is a portfolio project made with care. All "bugs" found in the items are (mostly) purely fictional. 😉
