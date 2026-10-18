import { CHARACTER, RESIST_CAP, SOCIALS } from "../../data/character";
import { EQUIPMENT } from "../../data/equipment";
import { characterAttributes, equipmentResistances } from "../../game/stats";
import { publishedBuild } from "../../game/tree/build";
import { NODES } from "../../game/tree/data";

/** Computed once: the published build and the equipped gear don't change while the page is open. */
const SHEET = {
  attributes: characterAttributes(publishedBuild(), NODES),
  resistances: equipmentResistances(Object.values(EQUIPMENT)),
};
import { Frame, SubHeading } from "../../components/Frame";
import { levelAt } from "../../game/age";
import { useTooltip } from "../../components/Tooltip";
import { useI18n } from "../../i18n/I18nProvider";
import "./CharacterPanel.css";

const ICONS = {
  github: (
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  ),
  linkedin: (
    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
  ),
};

export function CharacterPanel() {
  const { t, l } = useI18n();
  // Find the Bugs: these spots show their bug only while it's planted.
  const { attributes, resistances } = SHEET;
  const { level, experience } = levelAt(CHARACTER.birthday, new Date());
  // Floored, so the day before my birthday reads 99%, never a rounded-up 100%.
  const xp = Math.floor(experience * 100);

  return (
    <Frame title={t("panel.attributes")} titleId="attributes-title" className="char-panel">
      <dl className="stat-list">
        <div className="stat">
          <dt>{t("char.class")}</dt>
          <dd>{l(CHARACTER.className)}</dd>
        </div>
        <div className="stat">
          <dt>{t("char.level")}</dt>
          <dd>
            <span className="stat__badge">{level}</span>
          </dd>
        </div>
      </dl>

      <div className="xp">
        <div className="xp__label">
          <span>{t("char.experience")}</span>
          <span>{xp}%</span>
        </div>
        <div
          className="xp__bar"
          role="progressbar"
          aria-label={t("char.experience")}
          aria-valuenow={xp}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="xp__fill" style={{ width: `${xp}%` }} />
        </div>
      </div>

      <ul className="attr-list">
        {attributes.map((a) => (
          <AttributeRow key={a.id} attribute={a} />
        ))}
      </ul>

      <SubHeading id="resist-title">{t("panel.resistances")}</SubHeading>
      <ul className="resist-list" aria-labelledby="resist-title">
        {resistances.map((r) => (
          <ResistRow key={r.id} resist={r} />
        ))}
      </ul>

      <SubHeading id="socials-title">{t("panel.socials")}</SubHeading>
      <ul className="socials" aria-labelledby="socials-title">
        {SOCIALS.map((s) => (
          <li key={s.id}>
            <a className="btn btn--sm" href={s.href} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                {ICONS[s.id]}
              </svg>
              {/* Brand names. */}
              <span translate="no">{s.label}</span>
              <span className="visually-hidden"> {t("a11y.newTab")}</span>
            </a>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** One attribute; hover or focus shows where it comes from (base + passive tree). */
function AttributeRow({ attribute: a }: { attribute: (typeof SHEET.attributes)[number] }) {
  const { t, l } = useI18n();
  const from = t("char.attrFrom", { base: a.base, tree: a.tree });
  const tip = useTooltip<HTMLLIElement>(
    <div className="tip-simple">
      <strong>
        {l(a.label)} {a.total}
      </strong>
      {from}
    </div>,
    "right",
  );
  return (
    <li className={`attr attr--${a.tone}`} tabIndex={0} {...tip}>
      <span className="attr__gem" aria-hidden="true" />
      <span className="attr__label">
        {l(a.label)} <abbr>({l(a.short)})</abbr>
      </span>
      <span className="attr__value" data-testid={`attr-${a.id}`}>
        {a.total}
      </span>
      <span className="visually-hidden">{from}</span>
    </li>
  );
}

/** One resistance; hover or focus explains what it means and where the value comes from. */
function ResistRow({ resist: r }: { resist: (typeof SHEET.resistances)[number] }) {
  const { t, l } = useI18n();
  const label = l(r.label);
  const from =
    r.total > RESIST_CAP
      ? t("char.resistOvercap", { total: r.total, cap: RESIST_CAP })
      : t("char.resistFrom", { total: r.total });
  const tip = useTooltip<HTMLLIElement>(
    <div className="tip-simple tip-resist">
      <strong>{label}</strong>
      <span>{l(r.desc)}</span>
      <small>{from}</small>
    </div>,
    "right",
  );
  return (
    <li className={`resist resist--${r.tone}`} tabIndex={0} {...tip}>
      <span className="resist__label">{label}</span>
      <span className="resist__value" data-testid={`resist-${r.id}`}>
        {r.value}% {r.capped && <small>{t("resist.capped")}</small>}
      </span>
      <span className="resist__meter" aria-hidden="true">
        <span style={{ width: `${(r.value / RESIST_CAP) * 100}%` }} />
      </span>
      <span className="visually-hidden">
        {l(r.desc)} {from}
      </span>
    </li>
  );
}
