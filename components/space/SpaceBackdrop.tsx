"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "./rng";

/* SpaceBackdrop — the CHEAP fixed deep-space field behind the sub-pages
   (/story, /work, /work/[slug]). This is NOT the heavy WebGL fly-through: it is
   a single screen-space Canvas-2D layer (no three, no R3F, no extra WebGL
   context — the home page keeps the one and only <Canvas>). position:fixed,
   pointer-events:none, painted behind all content.

   Monochrome by contract: white stars on the pure-black void, with a faint cool
   accent (#a9c6ff) reserved for a small minority of the brightest points so the
   field reads cohesive with the fly-through register. Stars are laid out from a
   seeded PRNG (deterministic, no Math.random in the paint loop) and twinkle by a
   cheap per-star sine. Honours prefers-reduced-motion: paints one still frame
   and stops. */

type Star = {
  x: number; // normalised 0..1 across the viewport
  y: number; // normalised 0..1 down the viewport
  r: number; // base radius in CSS px
  base: number; // base alpha 0..1
  amp: number; // twinkle amplitude
  spd: number; // twinkle speed
  phase: number; // twinkle phase offset
  accent: boolean; // cool-accent tint (small minority)
};

export function SpaceBackdrop({
  count = 220,
  density = 0.00018,
}: {
  /** baseline star count at a reference viewport */
  count?: number;
  /** stars per CSS px² — scales count with viewport area (capped) */
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    const ACCENT = [169, 198, 255]; // #a9c6ff — the one permitted cool accent

    function build() {
      // area-scaled count so a wide monitor isn't sparse and a phone isn't a
      // soup of points; clamped so the paint stays cheap.
      const target = Math.min(
        520,
        Math.max(90, Math.round(Math.max(count, w * h * density)))
      );
      const rand = mulberry32(0x5eed_1234 ^ target);
      const next: Star[] = [];
      for (let i = 0; i < target; i++) {
        const rr = rand();
        next.push({
          x: rand(),
          y: rand(),
          r: 0.4 + rr * rr * 1.5, // mostly tiny, a few larger
          base: 0.18 + rand() * 0.55,
          amp: 0.1 + rand() * 0.4,
          spd: 0.4 + rand() * 1.3,
          phase: rand() * Math.PI * 2,
          // ~14% of the brighter stars carry the faint cool tint
          accent: rr > 0.78 && rand() > 0.5,
        });
      }
      stars = next;
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) paint(0); // single still frame for reduced-motion
    }

    function paint(t: number) {
      ctx!.clearRect(0, 0, w, h);
      // faint top-biased nebular wash so the void has depth without a photo
      const grad = ctx!.createRadialGradient(
        w * 0.5,
        h * 0.32,
        0,
        w * 0.5,
        h * 0.32,
        Math.max(w, h) * 0.9
      );
      grad.addColorStop(0, "rgba(20, 26, 44, 0.42)");
      grad.addColorStop(0.55, "rgba(8, 10, 20, 0.22)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      const time = t * 0.001;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const tw = reduce
          ? s.base
          : s.base + Math.sin(time * s.spd + s.phase) * s.amp;
        const a = Math.max(0, Math.min(1, tw));
        const px = s.x * w;
        const py = s.y * h;
        ctx!.beginPath();
        ctx!.arc(px, py, s.r, 0, Math.PI * 2);
        if (s.accent) {
          ctx!.fillStyle = `rgba(${ACCENT[0]}, ${ACCENT[1]}, ${ACCENT[2]}, ${a})`;
        } else {
          ctx!.fillStyle = `rgba(255, 255, 255, ${a})`;
        }
        ctx!.fill();
      }
    }

    function loop(t: number) {
      if (!running) return;
      paint(t);
      raf = requestAnimationFrame(loop);
    }

    resize();
    paint(performance.now()); // immediate first frame — never a blank canvas,
                              // even if rAF is throttled (backgrounded tab)
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count, density]);

  return <canvas ref={canvasRef} className="space-backdrop" aria-hidden="true" />;
}
