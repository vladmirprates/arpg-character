/**
 * Crafting-bench sound effects, synthesized with the Web Audio API — no audio files to download.
 * The AudioContext is created lazily on the first sound (always after a user gesture).
 */
export type SfxName = "click" | "orbMagic" | "orbRare" | "orbNeutral" | "corrupt" | "brick" | "error" | "save";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSfxEnabled(value: boolean) {
  enabled = value;
}

let suspended = false;

/** Suspend / resume: a hidden tab stops all audio, and nothing new plays until it's back. */
export function setAudioSuspended(value: boolean) {
  suspended = value;
  if (!ctx) return;
  if (value && ctx.state === "running") void ctx.suspend();
  else if (!value && ctx.state === "suspended") void ctx.resume();
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended" && !suspended) void ctx.resume();
  return { ctx, out: master! };
}

interface ToneOpts {
  freq: number;
  to?: number;
  type?: OscillatorType;
  dur: number;
  vol?: number;
  delay?: number;
}

function tone({ freq, to, type = "sine", dur, vol = 0.3, delay = 0 }: ToneOpts) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + delay;
  const osc = a.ctx.createOscillator();
  const gain = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol = 0.2, filterFreq = 800, delay = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + delay;
  const buffer = a.ctx.createBuffer(1, Math.ceil(a.ctx.sampleRate * dur), a.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.ctx.createBufferSource();
  src.buffer = buffer;
  const filter = a.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = a.ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(a.out);
  src.start(t0);
}

const SOUNDS: Record<SfxName, () => void> = {
  click: () => tone({ freq: 600, to: 400, dur: 0.06, vol: 0.12, type: "triangle" }),
  // Glassy "clink" of an orb hitting an item, pitched by tier.
  orbMagic: () => {
    tone({ freq: 1320, dur: 0.25, vol: 0.18 });
    tone({ freq: 1980, dur: 0.18, vol: 0.08, delay: 0.02 });
  },
  orbRare: () => {
    tone({ freq: 880, dur: 0.35, vol: 0.2 });
    tone({ freq: 1320, dur: 0.3, vol: 0.12, delay: 0.04 });
    tone({ freq: 1760, dur: 0.25, vol: 0.08, delay: 0.08 });
  },
  orbNeutral: () => tone({ freq: 700, to: 500, dur: 0.2, vol: 0.15, type: "triangle" }),
  corrupt: () => {
    tone({ freq: 110, to: 55, dur: 0.6, vol: 0.35, type: "sawtooth" });
    noise(0.5, 0.25, 400);
  },
  brick: () => {
    tone({ freq: 220, to: 40, dur: 0.9, vol: 0.35, type: "square" });
    noise(0.8, 0.3, 300);
  },
  error: () => {
    tone({ freq: 160, dur: 0.12, vol: 0.2, type: "square" });
    tone({ freq: 120, dur: 0.15, vol: 0.2, type: "square", delay: 0.1 });
  },
  save: () => {
    tone({ freq: 523, dur: 0.12, vol: 0.15 });
    tone({ freq: 784, dur: 0.2, vol: 0.15, delay: 0.08 });
  },
};

export function playSfx(name: SfxName) {
  if (!enabled) return;
  try {
    SOUNDS[name]();
  } catch {
    // Audio is decorative — never let it break the UI.
  }
}
