/**
 * UI v2 is a style layer over v1, not a fork: every v2 rule is scoped to `:root[data-ui="v2"]`,
 * and v1's own stylesheets are untouched. v2 is the default; `?ui=v1` in the URL shows v1.
 *
 * Rolling back: delete src/styles/v2/ and its two lines in src/main.tsx.
 */
export type UiVersion = "v1" | "v2";

export const DEFAULT_UI: UiVersion = "v2";

export function applyUiVersion(
  search: string = location.search,
  root: HTMLElement = document.documentElement,
): UiVersion {
  const asked = new URLSearchParams(search).get("ui");
  const version: UiVersion = asked === "v1" || asked === "v2" ? asked : DEFAULT_UI;
  root.dataset.ui = version;
  return version;
}
