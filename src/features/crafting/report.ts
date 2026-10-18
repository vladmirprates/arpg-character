import { ORB_BY_ID } from "../../data/orbs";
import { describeItem, itemToText } from "../../game/crafting/describe";
import { POOLS } from "../../game/crafting/pools";
import { encodeRecipe } from "../../game/crafting/recipe";
import { CRAFT_ERRORS } from "../../i18n/strings";
import type { Locale } from "../../i18n/types";
import type { Session } from "./useCraftSession";

export function reproUrl(session: Session, baseUrl: string): string {
  return `${baseUrl}#craft=${encodeRecipe(session.recipe)}`;
}

/** A craft session written up as a proper bug report — the QA joke, done seriously. */
export function bugReport(session: Session, locale: Locale, baseUrl: string): string {
  const view = describeItem(session.item, locale);
  const base = POOLS[session.recipe.base].baseName[locale];
  const steps = session.log.map((entry, i) => {
    const orb = ORB_BY_ID[entry.orb].name[locale];
    const result = entry.error
      ? `FAIL — ${CRAFT_ERRORS[locale][entry.error]}`
      : entry.corruption
        ? `OK (${entry.corruption})`
        : "OK";
    return `${i + 2}. Apply ${orb} → ${result}`;
  });

  return [
    `[Crafting Bench] ${view.name}`,
    "",
    "Environment",
    `- Seed: 0x${session.recipe.seed.toString(16)}`,
    `- Base: ${base}`,
    "",
    "Steps to reproduce",
    `1. Open the crafting bench with base "${base}" and the seed above`,
    ...steps,
    "",
    "Actual result",
    itemToText(view, base, locale),
    "",
    `Repro link: ${reproUrl(session, baseUrl)}`,
  ].join("\n");
}
