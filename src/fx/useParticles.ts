import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export interface BurstOptions {
  colors: string[];
  count?: number;
  speed?: number;
  /** Upward drift for ember-like bursts. */
  gravity?: number;
}

/**
 * Lightweight canvas particle bursts. The animation loop only runs while particles are alive,
 * and bursts are skipped entirely when the user prefers reduced motion.
 */
export function useParticles(disabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    particles.current = particles.current.filter((p) => p.life > 0);
    for (const p of particles.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy = p.vy * 0.96 + 0.04;
      p.life--;
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    raf.current = particles.current.length ? requestAnimationFrame(loop) : 0;
  }, []);

  const burst = useCallback(
    ({ colors, count = 40, speed = 4, gravity = 0 }: BurstOptions) => {
      const canvas = canvasRef.current;
      if (disabled || !canvas || !canvas.getContext) return;
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(width * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = (0.4 + Math.random()) * speed * dpr;
        const max = 30 + Math.random() * 40;
        particles.current.push({
          x: cx + (Math.random() - 0.5) * width * 0.5 * dpr,
          y: cy + (Math.random() - 0.5) * height * 0.4 * dpr,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v - gravity * dpr,
          life: max,
          max,
          size: (1.5 + Math.random() * 2.5) * dpr,
          color: colors[i % colors.length]!,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    },
    [disabled, loop],
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { canvasRef, burst };
}
