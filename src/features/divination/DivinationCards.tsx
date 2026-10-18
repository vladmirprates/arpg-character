import { useEffect, useRef, useState, type ReactNode } from "react";
import { RECOMMENDATIONS, RECOMMENDATIONS_SOURCE, type Recommendation } from "../../data/recommendations";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { useI18n } from "../../i18n/I18nProvider";
import type { Locale } from "../../i18n/types";
import "./DivinationCards.css";

/** Short badge on the card; the full sentence when zoomed. */
const RELATION = {
  manager: { short: "cards.relShort.manager", full: "cards.rel.manager" },
  sameTeam: { short: "cards.relShort.sameTeam", full: "cards.rel.sameTeam" },
  otherTeam: { short: "cards.relShort.otherTeam", full: "cards.rel.otherTeam" },
  otherCompany: { short: "cards.relShort.otherCompany", full: "cards.rel.otherCompany" },
} as const;

/** The quote in the reader's language: the original when it matches, otherwise my translation. */
const quoteFor = (rec: Recommendation, locale: Locale, showOriginal: boolean) =>
  rec.lang === locale || showOriginal ? rec.original : rec.translation;

function Card({
  rec,
  full,
  showOriginal = false,
  footer,
}: {
  rec: Recommendation;
  full?: boolean;
  showOriginal?: boolean;
  footer?: ReactNode;
}) {
  const { t, l, locale } = useI18n();
  const relation = RELATION[rec.relation];
  return (
    <div className={`divcard ${full ? "divcard--full" : ""}`}>
      <p className="divcard__title">{l(rec.title)}</p>
      <div className="divcard__art">
        <svg viewBox={iconViewBox(rec.artIcon)} aria-hidden="true">
          {TREE_ICONS[rec.artIcon]?.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        <span className="divcard__stack" aria-hidden="true">
          1/1
        </span>
      </div>
      <div className="divcard__reward">
        <strong>{rec.name}</strong>
        <span>{l(rec.role)}</span>
        <span className={`relation relation--${rec.relation}`}>{t(full ? relation.full : relation.short)}</span>
      </div>
      <blockquote
        className="divcard__flavour"
        lang={showOriginal || rec.lang === locale ? rec.lang : locale}
        // The thumbnail's cut-off quote is hidden; the zoomed card reads it in full.
        aria-hidden={full ? undefined : true}
      >
        {quoteFor(rec, locale, showOriginal)}
      </blockquote>
      {footer}
    </div>
  );
}

/** Recommendations from colleagues, collected as PoE divination cards. */
export function DivinationCards() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState<Recommendation | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const zoom = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  // The zoomed card is its own modal dialog on top of the gallery: Esc closes just the card.
  useEffect(() => {
    const dialog = zoom.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(null);
    setShowOriginal(false);
    opener.current?.focus();
  };

  const date = (rec: Recommendation) =>
    new Date(`${rec.date}T12:00:00`).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="divination">
      <p className="divination__intro">
        {t("cards.count", { n: RECOMMENDATIONS.length })}{" "}
        <a href={RECOMMENDATIONS_SOURCE} target="_blank" rel="noopener noreferrer">
          {t("cards.verify")}
        </a>
      </p>

      <ul className="divination__grid">
        {RECOMMENDATIONS.map((rec) => (
          <li key={rec.id}>
            {/* Named by its visible title, name, role and relation (WCAG 2.5.3). */}
            <button
              type="button"
              className="divination__pick"
              data-testid={`card-${rec.id}`}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(rec);
              }}
            >
              <Card rec={rec} />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={zoom}
        className="divination__zoom"
        aria-label={open ? `${open.title[locale]} — ${open.name}` : undefined}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          // Clicking the dimmed backdrop (the dialog itself, outside the card) closes the card.
          if (e.target === e.currentTarget) close();
        }}
      >
        {open && (
          <Card
            rec={open}
            full
            showOriginal={showOriginal}
            footer={
              <footer className="divcard__footer">
                <span className="divcard__date">{date(open)}</span>
                {open.lang !== locale && (
                  <span>
                    {t(open.lang === "pt" ? "cards.translatedPt" : "cards.translatedEn")}{" "}
                    <button type="button" className="link-btn" onClick={() => setShowOriginal((v) => !v)}>
                      {showOriginal ? t("cards.showTranslation") : t("cards.showOriginal")}
                    </button>
                  </span>
                )}
                <button type="button" className="btn btn--sm divcard__close" onClick={close} autoFocus>
                  {t("nav.close")}
                </button>
              </footer>
            }
          />
        )}
      </dialog>
    </div>
  );
}
