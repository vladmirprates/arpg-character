import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { RESOURCES } from "../../data/character";
import { SKILLS, type Skill } from "../../data/skills";
import { Markup, plainText } from "../../components/Markup";
import { ItemCard } from "../../components/ItemCard";
import { useToast } from "../../components/Toasts";
import { useTooltip } from "../../components/Tooltip";
import { useI18n } from "../../i18n/I18nProvider";
import { useBugHunt, type SkillId } from "../bughunt/BugHunt";
import { usePlanted } from "../bounty/BountyProvider";
import { Globe } from "./Globe";
import "./ActionBar.css";

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName));

export function ActionBar() {
  const { t, l } = useI18n();
  const notify = useToast();
  const hunt = useBugHunt();
  const overdraft = usePlanted("overdraft");
  const [coffee, setCoffee] = useState(RESOURCES.coffee.max);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const coffeeRef = useRef(coffee);
  coffeeRef.current = coffee;

  const overdrawn = overdraft.planted && coffee < 0;
  // Fixing the overdraft bug brings Coffee back to a legal value.
  useEffect(() => {
    if (!overdraft.planted && coffeeRef.current < 0) setCoffee(0);
  }, [overdraft.planted]);

  // Coffee regenerates over time.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCoffee((c) => Math.min(RESOURCES.coffee.max, c + RESOURCES.coffee.regenPerSecond / 4));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const cast = useCallback(
    (skill: Skill) => {
      const now = performance.now();
      if ((cooldowns[skill.id] ?? 0) > now) {
        notify(t("skills.cooldown"), "error");
        return;
      }
      // Find the Bugs, "overdraft": while planted, the Coffee check is skipped.
      if (!overdraft.planted && coffeeRef.current < skill.cost) {
        notify(t("skills.noMana"), "error");
        return;
      }
      // The skill acts on the bug hunt; if it has nothing to act on, nothing is spent.
      const result = hunt.perform(skill.id as SkillId);
      if (!result.ok) {
        notify(result.message ?? t("skills.cooldown"), "error");
        return;
      }
      setCoffee((c) => c - skill.cost);
      setCooldowns((cd) => ({ ...cd, [skill.id]: now + skill.cooldownMs }));
      notify(result.message ?? l(skill.castLine), skill.effect === "shake" ? "corrupt" : "info");

      if (skill.effect) {
        const root = document.documentElement;
        const cls = `fx-${skill.effect}`;
        root.classList.remove(cls);
        void root.offsetWidth; // restart the animation
        root.classList.add(cls);
        window.setTimeout(() => root.classList.remove(cls), 700);
      }
    },
    [cooldowns, notify, t, l, hunt, overdraft.planted],
  );

  // Q W E R T hotkeys — ignored while typing or while a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const skill = SKILLS.find((s) => s.hotkey === e.key.toUpperCase());
      if (skill) {
        e.preventDefault();
        cast(skill);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cast]);

  return (
    <nav className="action-bar" aria-label={t("skills.bar")}>
      <Globe kind="sanity" label={t("globe.sanity")} value={RESOURCES.sanity.current} max={RESOURCES.sanity.max} />

      <div className="action-bar__center">
        {/* Once Coffee is below zero, the skill bar is where the overdraft bug can be reported. */}
        <ul className="skills" aria-label={t("skills.hint")} {...(overdrawn ? overdraft.marker : {})}>
          {SKILLS.map((s) => (
            <li key={s.id}>
              <SkillButton skill={s} cooldownUntil={cooldowns[s.id] ?? 0} onCast={() => cast(s)} />
            </li>
          ))}
        </ul>
      </div>

      <Globe
        kind="coffee"
        label={t("globe.coffee")}
        value={Math.floor(coffee)}
        max={RESOURCES.coffee.max}
        planted={overdrawn ? "overdraft" : undefined}
      />
    </nav>
  );
}

function SkillButton({ skill, cooldownUntil, onCast }: { skill: Skill; cooldownUntil: number; onCast: () => void }) {
  const { t, l } = useI18n();
  const [, force] = useState(0);
  const remaining = Math.max(0, cooldownUntil - performance.now());

  // Animate the cooldown sweep while it runs.
  useEffect(() => {
    if (cooldownUntil <= performance.now()) return;
    let raf = 0;
    const tick = () => {
      force((n) => n + 1);
      if (cooldownUntil > performance.now()) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cooldownUntil]);

  const card = (
    <ItemCard
      rarity="normal"
      className="skill-card"
      name={l(skill.name)}
      base={l(skill.type)}
      blocks={[
        <div key="p">
          {skill.properties.map((p, i) => (
            <p key={i}>
              <Markup text={l(p)} />
            </p>
          ))}
        </div>,
        <div key="l" className="skill-card__lines">
          {skill.lines.map((line, i) => (
            <p key={i}>
              <Markup text={l(line)} />
            </p>
          ))}
        </div>,
      ]}
      flavor={l(skill.flavor)}
    />
  );
  const tip = useTooltip<HTMLButtonElement>(card, "top");
  const description = [
    l(skill.type),
    ...skill.properties.map((p) => plainText(l(p))),
    ...skill.lines.map((x) => plainText(l(x))),
    l(skill.flavor),
  ].join(". ");
  const progress = remaining / skill.cooldownMs;

  return (
    <button
      type="button"
      className="skill"
      style={{ "--tint": skill.color } as CSSProperties}
      aria-label={`${t("skills.cast", { name: l(skill.name) })} (${skill.hotkey})`}
      aria-describedby={`skill-desc-${skill.id}`}
      aria-keyshortcuts={skill.hotkey}
      data-testid={`skill-${skill.hotkey}`}
      onClick={onCast}
      {...tip}
    >
      {/* The white icon is used as a mask, so it takes the skill's colour. */}
      <span className="skill__icon" aria-hidden="true">
        <span style={{ maskImage: `url(${skill.icon})`, WebkitMaskImage: `url(${skill.icon})` }} />
      </span>
      <kbd className="skill__key" aria-hidden="true">
        {skill.hotkey}
      </kbd>
      {remaining > 0 && (
        <span className="skill__cooldown" aria-hidden="true" style={{ "--p": progress } as CSSProperties}>
          {(remaining / 1000).toFixed(1)}
        </span>
      )}
      <span id={`skill-desc-${skill.id}`} className="visually-hidden">
        {description}
      </span>
    </button>
  );
}
