> **Falante de Português?** Leia a [versão em Português](README-pt.md).

# QA Character Sheet — an ARPG portfolio

> What if a QA engineer's résumé were an action RPG character screen?

[![CI](https://github.com/vladmirprates/arpg-character/actions/workflows/ci.yml/badge.svg)](https://github.com/vladmirprates/arpg-character/actions/workflows/ci.yml)
[![Deploy](https://github.com/vladmirprates/arpg-character/actions/workflows/deploy.yml/badge.svg)](https://github.com/vladmirprates/arpg-character/actions/workflows/deploy.yml)
![Accessibility](<https://img.shields.io/badge/a11y-WCAG_2.2_AA_(axe)-blue>)
![Stack](https://img.shields.io/badge/React_19-TypeScript-informational)

**▶ Play it:** https://vladmirprates.github.io/arpg-character/

I'm **Vladmir Prates**, a mid-level QA engineer who plays far too many ARPGs (Path of Exile, Diablo, Last Epoch). This is my career rendered as a character sheet — and, more importantly, a small product built and tested the way I'd want any game feature to be tested.

## What's in it

| Screen                           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Character screen**             | Laid out like Path of Exile 1: character sheet, a stash tab of saved crafts, and the inventory window — equipment in PoE’s exact slot arrangement and sizes over a 12×5 bag. Each item is a tool or trait from my day-to-day QA work. Hover or focus any item for its tooltip; **Ctrl+C copies it** in the classic ARPG item-text format. The sheet is computed, not typed in: the four attributes (Automation, Manual, Process, Game Sense) add up from My Build's passive tree, the five resistances (Spaghetti Code, Production Fires, Tight Deadlines, Scope Creep, Flaky Tests) are the sum of the equipped gear, and every item has a level requirement.                                                                                     |
| **Action bar**                   | Q W E R T skills with real hotkeys, cooldown sweeps, and Sanity/Coffee globes. Casting costs Coffee; run dry and you get the time-honoured _“Not enough Coffee”_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Passive tree**                 | ~240 nodes in PoE style: roads of small nodes leading to wheel and hub clusters, 62 notables, 13 masteries and 16 keystones. Every notable is a specific skill or tool (Playwright, Appium, CI/CD, JMeter/k6, SQL, accessibility…), across Game Testing, Manual Testing, Test Automation, Strategy & Leadership and four bridge specialties; each region ends in a Mastery keystone. Two tabs: **My Build** (read-only) and **Make Your Own**. Click any node to allocate the shortest path to it; hover to preview cost/refund; refunds prune disconnected branches. Builds persist and share by link. A Build Summary lists the keystones and masteries and jumps to each one; region emblems and an optional nebula show the areas at a glance. |
| **Find the Bugs**                | An opt-in bug hunt: start it and five bugs are planted on the page, from a visible one (an item you couldn't equip at your level) to functional ones that only show up when you use a feature — a stash that saves the previous version of a craft, Ctrl+click duplicating items, skills that overdraw Coffee. Find each with Inspect Element (Q), by mouse, touch or keyboard; each find files its bug report with severity and steps to reproduce, and fixes the page.                                                                                                                                                                                                                                                                           |
| **QA Report**                    | The site's own quality report, built by the deploy pipeline from the real results: unit and property tests, coverage, end-to-end and accessibility runs, Lighthouse scores. The deploy is a quality gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Quest Log & Divination Cards** | My career as Acts, side quests and trials; 37 LinkedIn recommendations from colleagues as divination cards, each with its own art and a badge for how we worked together (translations marked, originals one click away).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Crafting bench**               | Nine orbs with real crafting rules (rarity gates, 3 prefix / 3 suffix limits, 6-affix cap, three-way corruption). PoE-style popup: pick currency up from the currency tab (click or right-click), click the item to use it, Shift to keep it on the cursor, Esc to put it back; or drag it onto the item. Keep up to 24 crafts in a persistent stash; drag (or click, or Ctrl+click) any item between the bag and the stash. On phones a tap on an orb uses it straight away, with the currency docked in reach.                                                                                                                                                                                                                                   |

Plus: English / Brazilian Portuguese, crafting sound effects (mutable), particles and ambient embers (off with _Reduce motion_ or the OS setting), and a layout that works from 320px phones to ultrawide — on phones the tree's summary becomes a sheet so the tree gets the screen.

## The QA part

The site is the work sample, so the engineering is built to be checked.

### Every craft is reproducible

The crafting engine is a **pure function with a seeded RNG**. A craft is fully described by `base + seed + orbs`, so the bench can:

- **Copy repro link** — opens the exact same item on any machine (`#craft=bug.2a.0458`).
- **Copy bug report** — a ready-to-file ticket: environment (seed), numbered steps including the _failed_ attempts, actual result, and the repro link.

That's the QA joke done seriously: the bug-report generator files bug reports about your bug reports.

### Test pyramid

| Layer             | Tooling                        | What it proves                                                                                                                                                                                                                              |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit              | Vitest                         | Every orb's rules and error messages; tree allocation, pathing and refunds; share-code parsing of untrusted input.                                                                                                                          |
| Property-based    | fast-check                     | Thousands of random orb sequences per run never produce an illegal item; corrupted items never change except via Revert; any tree-click sequence stays connected; every recipe and build code round-trips.                                  |
| Component         | Testing Library                | UI behaviour through the accessibility tree: roles, names, live-region announcements, keyboard operation, persistence and recovery from corrupted storage.                                                                                  |
| End-to-end        | Playwright (desktop + Pixel 7) | Real-browser flows: craft → keep → reload → reopen, repro links in a fresh tab, drag & drop, clipboard, tree sharing, the full bug hunt (with a frozen clock), keyboard-only use, touch flows on phones, no horizontal scroll at 320–412px. |
| Accessibility     | axe-core                       | Zero WCAG 2.2 A/AA violations on the sheet, the tree and the bench, on both viewports.                                                                                                                                                      |
| Visual regression | Playwright screenshots         | Pixel diffs of the sheet and tree, with Linux baselines owned by CI.                                                                                                                                                                        |
| Performance       | Lighthouse CI                  | Score budgets (performance ≥ 0.9, accessibility and best practices ≥ 0.95) on the built site before deploy, then again on the live URL after it.                                                                                            |

Coverage thresholds are enforced: **95% of lines and functions** in the game rules, plus a floor for the whole app so coverage can rise but never quietly drop. Everything runs in GitHub Actions on every push and PR, and the deploy only ships if all of it passes.

### Bugs this rewrite caught

The old version was vanilla JS. Rebuilding it with tests in place found real defects — the kind of list I'd hand a team after a test pass:

- The aura “shine” animation **never ran**: its CSS targeted `#aura1`, which didn't exist.
- Passive-tree tooltips referenced a Tippy theme and animation whose CSS was **never loaded**.
- CDN scripts were **unpinned** (`tippy.js@6`) with no integrity check.
- `initial-scale=0.6` shrank the page on phones to hide a 431px-wide layout — the new suite checks there's **no horizontal scroll** from 320px up.
- Crafting errors were shown visually but **never announced** to screen readers.
- Modals were plain divs: the background stayed reachable by assistive tech.
- Saved crafts **vanished on reload** and couldn't be removed; “stash full” used a blocking `alert()`.

…and ones the new tests caught in the new code before shipping:

- Tooltips bigger than the viewport could be clamped **off-screen** (unit test on the positioning maths).
- A fast orb drag **lost the pointer** before the first move event (E2E drag test).
- Tooltips for anything inside a modal `<dialog>` rendered **underneath it** — the top layer beats every `z-index` (E2E).
- The sticky action bar could **cover the focused element** on phones (WCAG 2.4.11), found when Playwright couldn't tap it.
- Pressing Esc in a card's zoom view **closed the whole gallery**: React propagates events from a nested `<dialog>` to its parent (unit test).
- Cleaning tampered storage **erased the planted duplicate** before the bug hunt could show it (unit test on `normalize`).
- axe flagged scrollable panels (craft log, quest log, QA report) that **keyboard users couldn't scroll**.
- The first cut ran at **4 FPS**. A trace showed ~95% of every frame went to rasterizing a full-screen canvas of blurred embers; rebuilt as compositor-only CSS it runs at 60 FPS (and tree panning stopped re-rendering React on every mouse move).

## Under the hood

- **React 19 + TypeScript (strict)**, built with Vite, deployed to GitHub Pages by Actions.
- **Game rules are framework-free** (`src/game/`): pure, deterministic, and fully unit-tested. React only renders them.
- **Content is typed data** (`src/data/`) with English and Portuguese side by side; a missing translation is a compile error.
- **No `innerHTML`.** Item text uses a tiny markup (`[value]`, `{highlight}`, `((warning))`) rendered as React nodes.
- **Native platform features** over libraries: `<dialog>` for modals (focus trap, Esc, inert background for free), Web Audio for synthesized SFX, compositor-only CSS animation for effects, container queries for the inventory.
- **Untrusted input everywhere is validated**: share links and `localStorage` are parsed defensively; stashed items are re-derived from their recipe on load, so tampered storage can't produce an illegal item.

```
src/
├── game/        # Pure rules: crafting engine, seeded RNG, tree graph (+ tests)
├── data/        # Typed, bilingual content: items, skills, orbs, my build
├── features/    # Screens: character, equipment, inventory, skills, tree, crafting
├── components/  # Design system: Frame, ItemCard, ItemSlot, Tooltip, Modal, Toasts
├── i18n/        # EN / PT-BR strings and provider
├── audio/ fx/   # Procedural SFX, particles, embers
└── app/         # Shell, settings, deep links
e2e/             # Playwright: flows, a11y, visual
```

## Run it locally

Requires Node.js 20+.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # unit, property and component tests
npm run test:coverage  # with coverage thresholds
npx playwright install chromium
npm run e2e            # end-to-end + accessibility (builds and serves the app)
npm run qa:report      # everything above + Lighthouse, then writes the in-app QA report
```

### Changing “My Build”

Open the passive tree → **Make Your Own** → allocate → **Export build code**, then paste the code into `MY_BUILD_CODE` in [`src/data/myBuild.ts`](src/data/myBuild.ts).

---

Passive-tree icons by Lorc, Delapouite & contributors from [game-icons.net](https://game-icons.net), licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

**Vladmir Prates** — QA Engineer · [LinkedIn](https://www.linkedin.com/in/vladmirprates/)

All “bugs” in the items are (mostly) fictional. 😉
