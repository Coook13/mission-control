"use client";

import { useEffect, useRef } from "react";

/* SpaceTransition — a brief monochrome hyperspace jump used to cover route swaps.
   A lightweight 2D-canvas radial warp: stars stream outward from centre as
   accelerating light-streaks while the panel fades in, peaks at white-out, then
   clears. ~0.9s total. No WebGL, no external deps. Reusable for every route
   change (home -> story -> work -> work/[slug]).

   prefers-reduced-motion: the canvas is skipped entirely; the parent panel just
   does a plain quick fade (see .space-warp / .space-warp--reduced in CSS). */

const DURATION = 900; // ms — full cover-then-clear cycle
const STAR_COUNT = 240;
const ACCENT = "#a9c6ff";

type Star = {
  angle: number;
  radius: number; // current distance from centre, 0..1 of half-diagonal
  speed: number; // per-frame radial velocity multiplier
  len: number; // streak length factor
};

export default function SpaceTransition() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // CSS handles the quick fade; no canvas work

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let maxR = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      maxR = Math.sqrt(cx * cx + cy * cy);
    };
    resize();

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 0.18, // start clustered near centre
      speed: 0.6 + Math.random() * 1.4,
      len: 0.04 + Math.random() * 0.16,
    }));

    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1); // 0..1
      // accel ramps up then the field whites out near the end
      const accel = 0.006 + t * t * 0.05;

      ctx.clearRect(0, 0, w, h);

      // streaks brighten through the jump
      const alpha = 0.25 + t * 0.75;
      ctx.lineCap = "round";

      for (const s of stars) {
        s.radius += s.speed * accel;
        if (s.radius > 1.25) {
          s.radius = Math.random() * 0.1;
          s.angle = Math.random() * Math.PI * 2;
        }
        const r1 = s.radius * maxR;
        const r0 = Math.max(0, (s.radius - s.len) * maxR);
        const ca = Math.cos(s.angle);
        const sa = Math.sin(s.angle);
        const x1 = cx + ca * r1;
        const y1 = cy + sa * r1;
        const x0 = cx + ca * r0;
        const y0 = cy + sa * r0;

        // mostly white streaks, a cool-accent tint on the leading edge
        const tint = s.radius > 0.7;
        ctx.strokeStyle = tint
          ? `rgba(169, 198, 255, ${alpha})`
          : `rgba(255, 255, 255, ${alpha * (0.4 + s.radius)})`;
        ctx.lineWidth = 0.6 + s.radius * 2.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      // central white-out bloom peaks mid-jump for the actual page swap
      const bloom = Math.sin(t * Math.PI); // 0 -> 1 -> 0
      if (bloom > 0.01) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.9);
        g.addColorStop(0, `rgba(255,255,255,${bloom * 0.9})`);
        g.addColorStop(0.4, `rgba(214,230,255,${bloom * 0.35})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      if (t < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="space-warp" aria-hidden="true" style={{ ["--warp-accent" as string]: ACCENT }}>
      <canvas ref={canvasRef} className="space-warp__canvas" />
    </div>
  );
}
