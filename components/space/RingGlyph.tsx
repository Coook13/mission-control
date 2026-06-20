"use client";

import { useEffect, useRef } from "react";

/* The signature glyph: a glowing ring of fine particles that stands in for a
   letter (the "O" in WORK) — a black hole built into the wordmark. Canvas-2D,
   DPR-aware so it stays crisp at any size, sized to fill its inline square slot.
   Slow rotation + per-dot twinkle; a faint dark core. Respects reduced motion. */
export function RingGlyph({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // particle ring — deterministic so it doesn't reshuffle on re-render.
    // tight radius spread → a clean glowing circle, not a flower.
    const COUNT = 210;
    const dots = Array.from({ length: COUNT }, (_, i) => {
      const a = (i / COUNT) * Math.PI * 2;
      const jitter = Math.sin(i * 12.9898) * 0.5 + 0.5; // pseudo-random 0..1
      const j2 = Math.sin(i * 78.233) * 0.5 + 0.5;
      return {
        a,
        r: 0.95 + (jitter - 0.5) * 0.07, // radius factor (thin ring)
        size: 0.5 + j2 * 1.35,
        bright: 0.5 + j2 * 0.5,
        seed: jitter * 6.283,
      };
    });

    let raf = 0;
    let w = 0,
      h = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.3;
      const rot = reduce ? 0 : t * 0.00006;

      // faint dark core + thin inner glow rim (the event horizon)
      const grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.05);
      grad.addColorStop(0, "rgba(0,0,0,0.9)");
      grad.addColorStop(0.62, "rgba(0,0,0,0.5)");
      grad.addColorStop(0.86, "rgba(150,196,255,0.10)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "lighter";
      // bright continuous event-horizon rim with a soft outer glow halo
      ctx.beginPath();
      ctx.lineWidth = Math.max(1.5, R * 0.05);
      ctx.strokeStyle = "rgba(214,230,255,0.85)";
      ctx.shadowBlur = R * 0.4;
      ctx.shadowColor = "rgba(150,196,255,0.9)";
      ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      // a second, wider, fainter halo for bloom-like falloff
      ctx.beginPath();
      ctx.lineWidth = Math.max(1, R * 0.02);
      ctx.strokeStyle = "rgba(170,200,255,0.22)";
      ctx.shadowBlur = R * 0.7;
      ctx.shadowColor = "rgba(150,196,255,0.6)";
      ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < COUNT; i++) {
        const d = dots[i];
        const a = d.a + rot;
        const tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * 0.0018 + d.seed);
        const x = cx + Math.cos(a) * R * d.r;
        const y = cy + Math.sin(a) * R * d.r;
        const b = d.bright * tw;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${b.toFixed(3)})`;
        ctx.shadowBlur = d.size * 4;
        ctx.shadowColor = "rgba(180,205,255,0.9)";
        ctx.arc(x, y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";

      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    if (reduce) draw(0);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
