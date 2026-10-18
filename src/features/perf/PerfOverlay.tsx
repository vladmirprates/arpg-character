import { useEffect, useRef, useState } from "react";
import { EMPTY_SUMMARY, FrameRing, summarize, type FrameSummary } from "../../game/perf";
import { useTopLayer } from "../../components/useTopLayer";
import { useI18n } from "../../i18n/I18nProvider";
import "./PerfOverlay.css";

/** Frames kept for the graph and the live numbers: ~4 s at 60 fps. */
const WINDOW = 240;
/** A gap this long means the tab was hidden or the machine slept, not a slow frame. */
const GAP_MS = 1000;
/** Cap for the since-reset recording read by the performance test (~10 min at 60 fps). */
const MAX_RECORDED = 36_000;
const BUDGET_60 = 1000 / 60;
const BUDGET_30 = 1000 / 30;

interface Readout extends FrameSummary {
  dom: number;
  heapMb: number | null;
  longTasks: number;
}

/** What the Playwright performance test reads: frames since the last reset. */
export interface PerfProbe {
  reset: () => void;
  summary: () => FrameSummary & { longTasks: number };
}

declare global {
  interface Window {
    __perf?: PerfProbe;
  }
}

function draw(canvas: HTMLCanvasElement, times: number[]) {
  const g = canvas.getContext("2d");
  if (!g) return;
  const { width: w, height: h } = canvas;
  const scale = h / (BUDGET_30 * 2); // 0–66 ms tall
  g.clearRect(0, 0, w, h);
  const barW = w / WINDOW;
  times.forEach((ms, i) => {
    g.fillStyle = ms <= BUDGET_60 * 1.2 ? "#74d68f" : ms <= BUDGET_30 ? "#f0c35a" : "#ff6a6a";
    const bh = Math.min(h, ms * scale);
    g.fillRect(i * barW, h - bh, Math.max(1, barW - 0.5), bh);
  });
  // Budget lines: 60 fps and 30 fps.
  g.fillStyle = "rgb(255 255 255 / 0.35)";
  for (const budget of [BUDGET_60, BUDGET_30]) g.fillRect(0, Math.round(h - budget * scale), w, 1);
}

/**
 * A game-style debug overlay: FPS, frame time, 1% lows, a frame-time graph, DOM size and JS heap.
 * Measured with requestAnimationFrame, so it shows what the player actually gets.
 * It stays on top of open dialogs (useTopLayer), so it can be read while using the tree or bench.
 */
export function PerfOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [readout, setReadout] = useState<Readout>({ ...EMPTY_SUMMARY, dom: 0, heapMb: null, longTasks: 0 });

  useTopLayer(root);

  useEffect(() => {
    const ring = new FrameRing(WINDOW);
    let recorded: number[] = [];
    let longTasks = 0;
    let last = 0;
    let raf = 0;

    const frame = (now: number) => {
      const dt = now - last;
      if (last && dt < GAP_MS) {
        ring.push(dt);
        if (recorded.length < MAX_RECORDED) recorded.push(dt);
      }
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // A hidden tab gets no frames: restart the clock so the pause isn't counted as one long frame.
    const onVisibility = () => {
      last = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      observer = new PerformanceObserver((list) => {
        longTasks += list.getEntries().length;
      });
      observer.observe({ type: "longtask" });
    }

    // Numbers and graph refresh 4× a second; repainting every frame would cost frames itself.
    const tick = window.setInterval(() => {
      const times = ring.values();
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      setReadout({
        ...summarize(times),
        dom: document.getElementsByTagName("*").length,
        heapMb: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
        longTasks,
      });
      if (canvas.current) draw(canvas.current, times);
    }, 250);

    window.__perf = {
      reset: () => {
        recorded = [];
        longTasks = 0;
      },
      summary: () => ({ ...summarize(recorded), longTasks }),
    };

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      delete window.__perf;
    };
  }, []);

  const band = readout.fps >= 55 ? "good" : readout.fps >= 30 ? "ok" : "bad";
  return (
    <div
      ref={root}
      popover="manual"
      className="perf"
      role="region"
      aria-label={t("perf.title")}
      data-testid="perf-overlay"
    >
      <header className="perf__head">
        <strong>{t("perf.title")}</strong>
        <button type="button" className="perf__close" onClick={onClose} aria-label={t("perf.close")}>
          ×
        </button>
      </header>
      {/* FPS, DOM, ms and MB are units and acronyms, the same in every language. */}
      <dl className="perf__grid">
        <dt translate="no">FPS</dt>
        <dd className={`perf__fps perf__fps--${band}`} data-testid="perf-fps">
          {readout.fps.toFixed(0)}
        </dd>
        <dt>{t("perf.frame")}</dt>
        <dd translate="no">{readout.avgMs.toFixed(1)} ms</dd>
        <dt>{t("perf.low")}</dt>
        <dd>{readout.low1Fps.toFixed(0)}</dd>
        <dt>{t("perf.max")}</dt>
        <dd translate="no">{readout.maxMs.toFixed(1)} ms</dd>
        <dt>{t("perf.longTasks")}</dt>
        <dd>{readout.longTasks}</dd>
        <dt translate="no">DOM</dt>
        <dd>{readout.dom.toLocaleString()}</dd>
        {readout.heapMb !== null && (
          <>
            <dt>{t("perf.heap")}</dt>
            <dd translate="no">{readout.heapMb} MB</dd>
          </>
        )}
      </dl>
      <canvas ref={canvas} className="perf__graph" width={240} height={48} aria-hidden="true" />
    </div>
  );
}
