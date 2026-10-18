/** Frame-time statistics, the numbers a game's debug overlay and performance tests report. */
export interface FrameSummary {
  frames: number;
  /** Average frames per second over the window. */
  fps: number;
  avgMs: number;
  /** 99th-percentile frame time: only 1 frame in 100 is slower. */
  p99Ms: number;
  /** "1% low" FPS: the frame rate of the slowest 1% of frames, the stutter you feel. */
  low1Fps: number;
  maxMs: number;
}

export const EMPTY_SUMMARY: FrameSummary = { frames: 0, fps: 0, avgMs: 0, p99Ms: 0, low1Fps: 0, maxMs: 0 };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Nearest-rank percentile of an ascending list. */
export function percentile(sorted: readonly number[], p: number): number {
  if (!sorted.length) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]!;
}

/** Summarizes frame times in milliseconds. Non-positive or non-finite samples are ignored. */
export function summarize(frameTimes: readonly number[]): FrameSummary {
  const times = frameTimes.filter((t) => Number.isFinite(t) && t > 0);
  if (!times.length) return EMPTY_SUMMARY;
  const sorted = [...times].sort((a, b) => a - b);
  const total = times.reduce((a, b) => a + b, 0);
  const avgMs = total / times.length;
  const p99Ms = percentile(sorted, 99);
  return {
    frames: times.length,
    fps: round1(1000 / avgMs),
    avgMs: round1(avgMs),
    p99Ms: round1(p99Ms),
    low1Fps: round1(1000 / p99Ms),
    maxMs: round1(sorted[sorted.length - 1]!),
  };
}

/** Fixed-size ring of the most recent frame times, oldest first when read. */
export class FrameRing {
  private readonly data: number[] = [];
  private next = 0;

  constructor(readonly size: number) {}

  push(ms: number): void {
    if (this.data.length < this.size) this.data.push(ms);
    else this.data[this.next] = ms;
    this.next = (this.next + 1) % this.size;
  }

  values(): number[] {
    return this.data.length < this.size
      ? [...this.data]
      : [...this.data.slice(this.next), ...this.data.slice(0, this.next)];
  }

  clear(): void {
    this.data.length = 0;
    this.next = 0;
  }
}
