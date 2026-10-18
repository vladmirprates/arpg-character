import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { SettingsProvider } from "../app/SettingsProvider";
import { ToastProvider } from "../components/Toasts";
import { TooltipProvider } from "../components/Tooltip";
import { AchievementsProvider } from "../features/achievements/AchievementsProvider";
import { BountyProvider } from "../features/bounty/BountyProvider";
import { StashProvider } from "../features/stash/StashProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/types";

/** Renders UI inside every app provider, English by default. */
export function renderWithProviders(ui: ReactElement, { locale = "en" as Locale } = {}) {
  const user = userEvent.setup();
  const result = render(
    <SettingsProvider>
      <I18nProvider initialLocale={locale}>
        <ToastProvider>
          <AchievementsProvider>
            <TooltipProvider>
              <BountyProvider>
                <StashProvider>{ui}</StashProvider>
              </BountyProvider>
            </TooltipProvider>
          </AchievementsProvider>
        </ToastProvider>
      </I18nProvider>
    </SettingsProvider>,
  );
  return { user, ...result };
}
