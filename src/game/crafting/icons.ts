import type { BaseType, CraftItem } from "./types";

/** game-icons.net names for crafted items, by base (bundled via scripts/extract-tree-icons.mjs). */
const CRAFT_ICONS = {
  bugIcon: "spotted-bug",
  testcaseIcon: "checklist",
  scriptIcon: "robot-golem",
  brickedIcon: "ghost",
} as const;

const BY_BASE: Record<BaseType, string> = {
  bug: CRAFT_ICONS.bugIcon,
  testcase: CRAFT_ICONS.testcaseIcon,
  script: CRAFT_ICONS.scriptIcon,
};

export function craftIcon(item: CraftItem): string {
  return item.bricked ? CRAFT_ICONS.brickedIcon : BY_BASE[item.base];
}
