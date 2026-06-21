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
   cheap per-star sine.

   The field is alive at rest: TWO depth layers drift slowly across the viewport
   on pure time (the near layer faster than the far layer — a parallax that reads
   as gentle motion through space), plus one faint monochrome nebula wisp that
   eases with the far layer so /story and /work feel like the same void, paused.
   The drift wraps by modulo so the offset never accumulates and the paint stays
   cheap. Honours prefers-reduced-motion: paints one still frame and stops, with
   the drift offset pinned to zero.

   It also BREATHES with the reader: a small scroll-coupled offset is added to
   each layer's drift (the near layer reacts more than the far — same parallax
   law as the time drift), so moving down /story or /work nudges the field as if
   the void is sliding past. Scroll is read from the smoothed Lenis position when
   present (window.lenis, exposed by Providers) and falls back to window.scrollY;
   it is normalised by viewport height and wrapped by fract() so it can never
   accumulate or pop. Pinned to zero under prefers-reduced-motion alongside the
   time drift. No new listeners, no WebGL — the read happens inside the existing
   paint loop, so the home page keeps the one and only <Canvas>. */

type Star = {
  x: number; // normalised 0..1 across the viewport
  y: number; // normalised 0..1 down the viewport
  r: number; // base radius in CSS px
  base: number; // base alpha 0..1
  amp: number; // twinkle amplitude
  spd: number; // twinkle speed
  phase: number; // twinkle phase offset
  accent: boolean; // cool-accent tint (small minority)
  depth: number; // 0 = far (slow), 1 = near (fast) — drives parallax rate
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
        // ~38% near layer (bigger, brighter, drifts faster); rest far layer.
        const near = rand() > 0.62;
        next.push({
          x: rand(),
          y: rand(),
          r: (near ? 0.6 : 0.4) + rr * rr * (near ? 1.7 : 1.2), // mostly tiny
          base: (near ? 0.24 : 0.16) + rand() * 0.52,
          amp: 0.1 + rand() * 0.4,
          spd: 0.4 + rand() * 1.3,
          phase: rand() * Math.PI * 2,
          // ~14% of the brighter stars carry the faint cool tint
          accent: rr > 0.78 && rand() > 0.5,
          depth: near ? 1 : 0,
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
      const time = t * 0.001;
      const fract = (v: number) => v - Math.floor(v);

      // scroll-coupled offset so the field breathes as the reader moves down the
      // page. prefer the smoothed Lenis position (Providers exposes it in dev as
      // window.lenis; .actualScroll is the eased px value) and fall back to the
      // native scroll. normalise by viewport height so the rate is resolution-
      // independent, then keep it as a small additional NORMALISED drift — the
      // near layer reacts more than the far, the same parallax law as the time
      // drift. reduced-motion pins it to zero. fract() downstream prevents any
      // accumulation, so this can never wrap-pop or run away.
      const lenisScroll = (
        window as unknown as { lenis?: { actualScroll?: number } }
      ).lenis?.actualScroll;
      const scrollPx =
        typeof lenisScroll === "number" ? lenisScroll : window.scrollY || 0;
      const scrollN = reduce ? 0 : (scrollPx / Math.max(1, h)) * 0.08;

      // pure-time drift, normalised (0..1). reduced-motion pins it to zero.
      // far layer creeps; near layer drifts ~2.4x faster — a parallax that reads
      // as gentle motion through the field. fract() so it never accumulates.
      const driftFar = reduce ? 0 : fract(time * 0.0042 + scrollN * 0.5);
      const driftNear = reduce ? 0 : fract(time * 0.0102 + scrollN * 1.25);

      // faint top-biased nebular wash — eases laterally with the far layer so the
      // void has slow depth without a photo. centre wanders a few % of the width.
      const sway = reduce ? 0 : Math.sin(time * 0.05) * 0.04;
      const grad = ctx!.createRadialGradient(
        w * (0.5 + sway),
        h * 0.32,
        0,
        w * (0.5 + sway),
        h * 0.32,
        Math.max(w, h) * 0.9
      );
      grad.addColorStop(0, "rgba(20, 26, 44, 0.42)");
      grad.addColorStop(0.55, "rgba(8, 10, 20, 0.22)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // one faint monochrome nebula wisp (the cool-accent reserve), drifting with
      // the far layer — a soft off-centre cold radial wash, ADDITIVE-feeling over
      // the black so the deep void stays black, never lifted to grey.
      const wx = w * (0.74 - driftFar * 0.18);
      const wy = h * 0.66;
      const wr = Math.max(w, h) * 0.5;
      const wisp = ctx!.createRadialGradient(wx, wy, 0, wx, wy, wr);
      wisp.addColorStop(0, "rgba(169, 198, 255, 0.07)");
      wisp.addColorStop(0.5, "rgba(120, 150, 220, 0.03)");
      wisp.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = wisp;
      ctx!.fillRect(0, 0, w, h);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const tw = reduce
          ? s.base
          : s.base + Math.sin(time * s.spd + s.phase) * s.amp;
        const a = Math.max(0, Math.min(1, tw));
        // toroidal drift: wrap normalised x by the layer rate so a star leaving
        // the left edge reappears on the right — an endless field, no popping.
        const drift = s.depth === 1 ? driftNear : driftFar;
        const px = fract(s.x - drift) * w;
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
