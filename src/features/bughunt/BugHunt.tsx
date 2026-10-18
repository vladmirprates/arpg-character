import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useToast } from "../../components/Toasts";
import { copyToClipboard } from "../../components/copyTarget";
import { useBounty } from "../bounty/BountyProvider";
import { TREE_ICONS, iconViewBox } from "../../game/tree/icons.generated";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useI18n } from "../../i18n/I18nProvider";
import { HUNT_ICONS, SPECIES, type Species } from "./species";
import { browserName, buildTicket, ticketLabels, ticketText, type Ticket } from "./ticket";
import "./BugHunt.css";

/**
 * The bug hunt: anomalies crawl around the page background (behind the panels), and the
 * action-bar skills interact with them:
 *   Q Inspect Element → DevTools-style picker; clicking a bug reveals it
 *   W Capture Bug     → nets a revealed bug and files a ticket
 *   E Regression      → scan beam that flags hidden bugs
 *   R Break Prod      → alarm, and more bugs escape
 *   T Teleport        → a meeting that could have been an email
 */

export type SkillId = "inspect" | "capture" | "regression" | "break-prod" | "teleport";
export interface SkillResult {
  ok: boolean;
  message?: string;
}

interface Bug {
  id: number;
  species: Species;
  x: number;
  y: number;
  angle: number;
  travelMs: number;
  arriveAt: number;
  revealed: boolean;
  captured: boolean;
}

interface Hunt {
  perform: (skill: SkillId) => SkillResult;
}

const HuntContext = createContext<Hunt | null>(null);
const BUG_SIZE = 30;
const MAX_BUGS = 4;
/** Things a bug should not pick as a resting spot (it may still crawl behind them). */
const SOLID = ".frame, .action-bar, .topbar__identity, .topbar__settings, dialog[open], .ticket";

let nextId = 1;

function isFree(x: number, y: number) {
  // Hit-testing is unavailable in some environments (e.g. jsdom); then any spot will do.
  if (typeof document.elementFromPoint !== "function") return true;
  const el = document.elementFromPoint(x, y);
  return !!el && !el.closest(SOLID);
}

/** A random spot in the page background; falls back to anywhere if the screen is full. */
function freeSpot(): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = 0; i < 40; i++) {
    const x = 20 + Math.random() * (w - 40);
    const y = 20 + Math.random() * (h - 40);
    if (isFree(x, y)) return { x, y };
  }
  return { x: 20 + Math.random() * (w - 40), y: 20 + Math.random() * (h * 0.6) };
}

function spawnBug(): Bug {
  const species = SPECIES[Math.floor(Math.random() * SPECIES.length)]!;
  const spot = freeSpot();
  return {
    id: nextId++,
    species,
    ...spot,
    angle: Math.random() * 360,
    travelMs: 0,
    arriveAt: 0,
    revealed: false,
    captured: false,
  };
}

/** Name of the panel nearest to a point, for the ticket title. */
function nearestPanel(x: number, y: number, fallback: string) {
  let best = fallback;
  let bestDist = Infinity;
  for (const frame of document.querySelectorAll<HTMLElement>(".sheet .frame")) {
    const r = frame.getBoundingClientRect();
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = frame.querySelector("h2")?.textContent?.trim() || fallback;
    }
  }
  return best;
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox={iconViewBox(name)} aria-hidden="true">
      {TREE_ICONS[name]?.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function BugHuntProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const notify = useToast();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const bugsRef = useRef(bugs);
  bugsRef.current = bugs;
  const bounty = useBounty();
  const [inspecting, setInspecting] = useState(false);
  const [effect, setEffect] = useState<{ kind: "scan" | "alarm" | "meeting"; n: number } | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketCount, setTicketCount] = usePersistentState("tickets", 0, (v): v is number => Number.isInteger(v));

  // First bug shows up a few seconds after load.
  useEffect(() => {
    const id = window.setTimeout(() => setBugs((b) => (b.length ? b : [spawnBug()])), 3500);
    return () => window.clearTimeout(id);
  }, []);

  // Crawl: whenever a bug arrives, it picks a new spot. Movement itself is a CSS transform transition.
  useEffect(() => {
    const id = window.setInterval(() => {
      // Nothing crawls while a dialog covers the page: no hidden work behind the popup.
      if (document.querySelector("dialog[open]")) return;
      const now = performance.now();
      setBugs((list) => {
        let changed = false;
        const next = list.map((bug) => {
          if (bug.captured || now < bug.arriveAt) return bug;
          if (bug.revealed && Math.random() < 0.6) return bug; // revealed bugs mostly hold still
          const spot = freeSpot();
          const dist = Math.hypot(spot.x - bug.x, spot.y - bug.y);
          // A Heisenbug moves faster while nobody is looking at it.
          const speed = bug.species.speed * (bug.species.id === "heisenbug" && !bug.revealed ? 2 : 1);
          const travelMs = Math.max(600, (dist / speed) * 1000);
          changed = true;
          return {
            ...bug,
            ...spot,
            angle: (Math.atan2(spot.y - bug.y, spot.x - bug.x) * 180) / Math.PI,
            travelMs,
            arriveAt: now + travelMs + 600 + Math.random() * 2400,
          };
        });
        return changed ? next : list;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const flash = (kind: "scan" | "alarm" | "meeting", ms: number) => {
    const n = Date.now();
    setEffect({ kind, n });
    window.setTimeout(() => setEffect((e) => (e?.n === n ? null : e)), ms);
  };

  const reveal = useCallback((id: number) => {
    setBugs((list) =>
      list.map((b) => (b.id === id ? { ...b, revealed: true, arriveAt: performance.now() + 4000 } : b)),
    );
  }, []);

  /** Where a bug actually is right now (mid-crawl), from its rendered position. */
  const livePosition = (bug: Bug) => {
    const el = document.querySelector<HTMLElement>(`[data-bug-id="${bug.id}"]`);
    const r = el?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: bug.x, y: bug.y };
  };

  const perform = useCallback(
    (skill: SkillId): SkillResult => {
      const live = bugsRef.current.filter((b) => !b.captured);
      switch (skill) {
        case "inspect":
          setInspecting(true);
          return { ok: true, message: t("hunt.inspectHint") };

        case "capture": {
          const target = live.find((b) => b.revealed);
          if (!target) return { ok: false, message: t("hunt.noTarget") };
          const at = livePosition(target);
          // Freeze it where it is, drop the net, then file the ticket.
          setBugs((list) => list.map((b) => (b.id === target.id ? { ...b, ...at, travelMs: 0, captured: true } : b)));
          const number = ticketCount + 1;
          setTicketCount(number);
          const made = buildTicket({
            species: target.species,
            number,
            panel: nearestPanel(at.x, at.y, t("app.title")),
            ...at,
            browser: browserName(navigator.userAgent),
            viewport: { w: window.innerWidth, h: window.innerHeight },
            locale,
          });
          window.setTimeout(() => {
            setBugs((list) => list.filter((b) => b.id !== target.id));
            setTicket(made);
          }, 900);
          // Another one always turns up.
          window.setTimeout(() => setBugs((list) => (list.length < MAX_BUGS ? [...list, spawnBug()] : list)), 7000);
          return { ok: true, message: t("hunt.captured", { key: made.key }) };
        }

        case "regression": {
          flash("scan", 1400);
          const hidden = live.filter((b) => !b.revealed);
          window.setTimeout(() => hidden.forEach((b) => reveal(b.id)), 1100);
          const passed = 380 + Math.floor(Math.random() * 60);
          return {
            ok: true,
            message: hidden.length
              ? t("hunt.regression", { passed, found: hidden.length })
              : t("hunt.regressionClean", { passed }),
          };
        }

        case "break-prod": {
          flash("alarm", 1800);
          const room = Math.max(0, MAX_BUGS - live.length);
          const n = Math.min(2, room);
          if (n) setBugs((list) => [...list, ...Array.from({ length: n }, spawnBug)]);
          return { ok: true, message: t("hunt.prodDown", { n }) };
        }

        case "teleport":
          // No timer: the meeting lasts until you leave it.
          setEffect({ kind: "meeting", n: Date.now() });
          return { ok: true, message: t("hunt.meeting") };
      }
    },
    [t, locale, ticketCount, setTicketCount, reveal],
  );

  const value = useMemo(() => ({ perform }), [perform]);

  return (
    <HuntContext.Provider value={value}>
      <div className="hunt-layer" aria-hidden="true">
        {bugs.map((bug) => (
          <div
            key={bug.id}
            data-bug-id={bug.id}
            className={`hunt-bug hunt-bug--${bug.species.id} ${bug.revealed ? "is-revealed" : ""} ${bug.captured ? "is-captured" : ""}`}
            style={{
              transform: `translate3d(${bug.x - BUG_SIZE / 2}px, ${bug.y - BUG_SIZE / 2}px, 0)`,
              transitionDuration: `${bug.travelMs}ms`,
            }}
          >
            <div className="hunt-bug__body" style={{ rotate: `${bug.angle + 90}deg` }}>
              <Icon name={bug.species.icon} className="hunt-bug__glitch hunt-bug__glitch--r" />
              <Icon name={bug.species.icon} className="hunt-bug__glitch hunt-bug__glitch--c" />
              <Icon name={bug.species.icon} className="hunt-bug__icon" />
            </div>
            {bug.revealed && !bug.captured && (
              <span className="hunt-bug__tag">
                <b>{bug.species.selector}</b> {BUG_SIZE}×{BUG_SIZE}
              </span>
            )}
            {bug.captured && <Icon name={HUNT_ICONS.netIcon} className="hunt-bug__net" />}
          </div>
        ))}
      </div>

      {children}

      {inspecting && (
        <InspectOverlay
          bugs={bugs}
          onDone={(found, info, planted) => {
            setInspecting(false);
            if (planted && bounty.report(planted)) return;
            if (found) {
              reveal(found.id);
              notify(t("hunt.found", { selector: found.species.selector }), "success");
            } else if (info) {
              notify(t("hunt.inspected", info));
            }
          }}
        />
      )}

      {effect?.kind === "scan" && <div key={effect.n} className="hunt-scan" aria-hidden="true" />}
      {effect?.kind === "alarm" && <div key={effect.n} className="hunt-alarm" aria-hidden="true" />}
      {effect?.kind === "meeting" && <Meeting key={effect.n} onLeave={() => setEffect(null)} />}

      {ticket && (
        <TicketCard
          ticket={ticket}
          onClose={() => setTicket(null)}
          onCopy={async () => {
            if (await copyToClipboard(ticketText(ticket, locale))) notify(t("ticket.copied"), "success");
          }}
        />
      )}
    </HuntContext.Provider>
  );
}

export function useBugHunt(): Hunt {
  const ctx = useContext(HuntContext);
  if (!ctx) throw new Error("useBugHunt must be used inside <BugHuntProvider>");
  return ctx;
}

/** DevTools-style element picker: highlights what's under the cursor; clicking a bug reveals it. */
/** What the keyboard inspector steps through: the sheet's visible pieces (planted bugs among them). */
const INSPECTABLE = [
  ".topbar__name",
  ".topbar__class span",
  ".frame__title",
  ".stat dd",
  ".attr",
  ".resist__label",
  ".equip .slot",
  ".item-grid .slot",
  ".stash-tabs__tab",
  ".stash-tabs__count",
  ".feature",
  ".skill",
].join(", ");

function InspectOverlay({
  bugs,
  onDone,
}: {
  bugs: Bug[];
  onDone: (found: Bug | null, info?: { selector: string; w: number; h: number }, planted?: string) => void;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number; label: string; bug: boolean } | null>(
    null,
  );

  const bugAt = (x: number, y: number) =>
    bugs.find((b) => {
      if (b.captured) return false;
      const r = document.querySelector(`[data-bug-id="${b.id}"]`)?.getBoundingClientRect();
      return r && x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12;
    }) ?? null;

  // Looks through the overlay and through transient UI (toasts, tooltips) to the page underneath.
  const elementAt = (x: number, y: number) =>
    (document.elementsFromPoint?.(x, y) ?? []).find(
      (el) =>
        !overlay.current?.contains(el) && el !== document.documentElement && !el.closest(".toasts, .tooltip-layer"),
    ) as HTMLElement | undefined;

  const describe = (el: HTMLElement) => {
    const cls = [...el.classList].filter((c) => !c.startsWith("is-")).slice(0, 1);
    return `${el.tagName.toLowerCase()}${cls.length ? "." + cls[0] : ""}`;
  };

  const inspect = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const info = { selector: describe(el), w: Math.round(r.width), h: Math.round(r.height) };
    onDone(null, info, el.closest<HTMLElement>("[data-planted-bug]")?.dataset.plantedBug);
  };

  // Keyboard: Tab / Shift+Tab walks the inspector through the page's elements (planted bugs are
  // just some of many), Enter inspects; with nothing selected, Enter targets the nearest crawling bug.
  const picked = useRef<HTMLElement | null>(null);
  useEffect(() => {
    let timeout = 0;
    const arm = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => onDone(null), 30000);
    };
    const show = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setBox({ x: r.left, y: r.top, w: r.width, h: r.height, label: describe(el), bug: false });
    };
    const onKey = (e: KeyboardEvent) => {
      arm();
      if (e.key === "Escape") onDone(null);
      if (e.key === "Tab") {
        e.preventDefault();
        const list = [...document.querySelectorAll<HTMLElement>(INSPECTABLE)].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.bottom > 0 && r.top < innerHeight && !el.closest("dialog");
        });
        if (!list.length) return;
        const i = picked.current ? list.indexOf(picked.current) : -1;
        const next = list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length]!;
        picked.current = next;
        show(next);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (picked.current) inspect(picked.current);
        else onDone(bugs.find((b) => !b.captured && !b.revealed) ?? bugs.find((b) => !b.captured) ?? null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    arm();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.clearTimeout(timeout);
    };
  }, [bugs, onDone]);

  return (
    <div
      ref={overlay}
      className="inspect-overlay"
      data-testid="inspect-overlay"
      onPointerMove={(e) => {
        const bug = bugAt(e.clientX, e.clientY);
        if (bug) {
          const r = document.querySelector(`[data-bug-id="${bug.id}"]`)!.getBoundingClientRect();
          setBox({ x: r.left, y: r.top, w: r.width, h: r.height, label: bug.species.selector, bug: true });
          return;
        }
        const el = elementAt(e.clientX, e.clientY);
        if (!el) return setBox(null);
        const r = el.getBoundingClientRect();
        setBox({ x: r.left, y: r.top, w: r.width, h: r.height, label: describe(el), bug: false });
      }}
      onClick={(e) => {
        const bug = bugAt(e.clientX, e.clientY);
        if (bug) return onDone(bug);
        const el = elementAt(e.clientX, e.clientY);
        if (!el) return onDone(null);
        inspect(el);
      }}
    >
      {box && (
        <div
          className={`inspect-box ${box.bug ? "is-bug" : ""}`}
          style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }}
        >
          <span className="inspect-box__label">
            {box.label}{" "}
            <small>
              {Math.round(box.w)}×{Math.round(box.h)}
            </small>
          </span>
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, onClose, onCopy }: { ticket: Ticket; onClose: () => void; onCopy: () => void }) {
  const { t, locale } = useI18n();
  const l = ticketLabels(locale);
  return (
    <section className="ticket" aria-labelledby="ticket-title" data-testid="ticket">
      <header className="ticket__header">
        <span className="ticket__type">
          <Icon name={ticket.icon} className="ticket__type-icon" />
          {t("ticket.type")}
        </span>
        <span className="ticket__key">{ticket.key}</span>
        <button type="button" className="ticket__close" onClick={onClose} aria-label={t("ticket.close")}>
          ×
        </button>
      </header>
      <h2 id="ticket-title" className="ticket__title">
        {ticket.title}
      </h2>
      <dl className="ticket__fields">
        <div>
          <dt>{l.priority}</dt>
          <dd className={`prio prio--${ticket.priority.toLowerCase()}`}>{ticket.priority}</dd>
        </div>
        <div>
          <dt>{l.severity}</dt>
          <dd>{ticket.severity}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className="ticket__status">{t("ticket.status")}</dd>
        </div>
      </dl>
      <p className="ticket__env">
        <b>{l.environment}:</b> {ticket.environment}
      </p>
      <h3>{l.steps}</h3>
      <ol>
        {ticket.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p>
        <b>{l.expected}:</b> {ticket.expected}
      </p>
      <p>
        <b>{l.actual}:</b> <code>{ticket.actual}</code>
      </p>
      <div className="ticket__actions">
        <button type="button" className="btn btn--sm" onClick={onCopy}>
          {t("ticket.copy")}
        </button>
      </div>
    </section>
  );
}

function Meeting({ onLeave }: { onLeave: () => void }) {
  const { t } = useI18n();
  const leave = useRef<HTMLButtonElement>(null);
  const people = [
    { name: t("meeting.po"), initials: "PO", hue: 210 },
    { name: t("meeting.lead"), initials: "TL", hue: 280 },
    { name: t("meeting.sm"), initials: "SM", hue: 150 },
    { name: t("meeting.you"), initials: "QA", hue: 30, you: true },
  ];
  // The only way out is the Leave button, so keyboard users start on it.
  useEffect(() => leave.current?.focus(), []);
  return (
    <div className="meeting" role="dialog" aria-modal="true" aria-labelledby="meeting-title">
      <div className="meeting__window">
        <p className="meeting__title" id="meeting-title">
          {t("meeting.title")}
        </p>
        <div className="meeting__grid">
          {people.map((p) => (
            <div
              key={p.initials}
              className={`meeting__tile ${p.you ? "is-you" : ""}`}
              style={{ "--hue": p.hue } as CSSProperties}
            >
              <span className="meeting__avatar">{p.initials}</span>
              <span className="meeting__name">
                {p.name}
                {p.you && <Icon name={HUNT_ICONS.muteIcon} className="meeting__mute" />}
              </span>
              {p.you && <span className="meeting__muted">{t("meeting.muted")}</span>}
            </div>
          ))}
        </div>
        <button ref={leave} type="button" className="btn btn--sm meeting__leave" onClick={onLeave}>
          {t("meeting.leave")}
        </button>
      </div>
    </div>
  );
}
