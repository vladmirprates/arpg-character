import { CHARACTER } from "../data/character";
import { levelAt } from "../game/age";
import { useI18n } from "../i18n/I18nProvider";
import { LOCALES } from "../i18n/types";
import { track } from "../game/events";
import { useSettings } from "./SettingsProvider";

export function TopBar() {
  const { t, l, locale, setLocale, pseudo, setPseudo } = useI18n();
  const { sound, setSound, motionOverride, setMotionOverride, perfOverlay, setPerfOverlay } = useSettings();

  return (
    <header className="topbar">
      {/* Centred name banner: ornamental rules either side, details underneath. */}
      <div className="topbar__identity">
        {/* A name isn't translated (translate="no" also tells the pseudo-localization scan). */}
        <h1 className="topbar__name" translate="no">
          {CHARACTER.name}
        </h1>
        <p className="topbar__class">
          {/* One flex item, so the line's gap only spaces the ornamental rules. */}
          <span>
            {t("char.level")} {levelAt(CHARACTER.birthday, new Date()).level} · {l(CHARACTER.className)}
          </span>
        </p>
      </div>

      <div className="topbar__settings">
        {/* Language names are shown in their own language, never translated. */}
        <div className="segmented" role="group" aria-label={t("settings.language")} translate="no">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              aria-pressed={locale === loc}
              lang={loc === "pt" ? "pt-BR" : "en"}
              onClick={() => {
                if (loc === locale) return;
                setLocale(loc);
                track({ type: "locale.changed" });
              }}
            >
              {loc === "pt" ? "PT-BR" : "EN"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={sound}
          aria-label={sound ? t("settings.sound.on") : t("settings.sound.off")}
          title={sound ? t("settings.sound.on") : t("settings.sound.off")}
          onClick={() => setSound(!sound)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
            {sound ? (
              <path
                d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={motionOverride}
          aria-label={t("settings.motion")}
          title={t("settings.motion")}
          onClick={() => setMotionOverride(!motionOverride)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={pseudo}
          aria-label={t("settings.pseudo")}
          title={t("settings.pseudo")}
          data-testid="toggle-pseudo"
          onClick={() => {
            setPseudo(!pseudo);
            if (!pseudo) track({ type: "pseudo.enabled" });
          }}
        >
          {/* An accented "A": Ã */}
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M5.5 21L12 8l6.5 13M8 16h8M8 4.5c1.3-1.2 2.7 1.2 4 0s2.7-1.2 4 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={perfOverlay}
          aria-label={t("settings.perf")}
          title={t("settings.perf")}
          data-testid="toggle-perf"
          onClick={() => {
            setPerfOverlay(!perfOverlay);
            if (!perfOverlay) track({ type: "perf.opened" });
          }}
        >
          {/* A frame-time graph */}
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M3 20h18M5 17V12M9 17V8M13 17v-4M17 17V5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
