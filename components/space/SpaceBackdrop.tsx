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

   The field is alive at rest: THREE depth layers (far / mid / near, each with a
   distinct radius, base brightness and drift rate that increase toward the near
   layer) drift slowly across the viewport on pure time — the increasing rate
   reads as parallax, gentle motion through space. A small minority of brighter
   ANCHOR stars (slightly larger, higher base alpha) give the eye focal points so
   the field reads layered rather than flat. Plus one faint monochrome nebula
   wisp that eases with the far layer so /story and /work feel like the same
   void, paused. The drift wraps by fract() so the offset never accumulates and
   the paint stays cheap. Honours prefers-reduced-motion: paints one still frame
   and stops, with the drift offset pinned to zero.

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
  depth: number; // 0 = far (slow) · 1 = mid · 2 = near (fast) — parallax layer
  anchor: boolean; // a brighter, slightly larger focal point (small minority)
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
        // THREE depth layers, biased toward the far field so the eye reads
        // recession: ~46% far, ~34% mid, ~20% near. Each layer has its own
        // radius floor/span and base-alpha floor (rFloor/rSpan/baseFloor below)
        // and its own drift rate (LAYER_DRIFT in paint) — increasing radius,
        // brightness and drift speed from far → near give the parallax depth
        // without any new cost. A small minority become ANCHOR stars: slightly
        // larger and brighter focal points the eye can rest on, across layers.
        const dq = rand();
        const depth = dq < 0.46 ? 0 : dq < 0.8 ? 1 : 2;
        // ~7% are brighter anchors (kept rare so they stay focal, not a clump).
        const anchor = rand() > 0.93;
        const rFloor = depth === 2 ? 0.6 : depth === 1 ? 0.5 : 0.4;
        const rSpan = depth === 2 ? 1.7 : depth === 1 ? 1.3 : 1.0;
        const baseFloor = depth === 2 ? 0.24 : depth === 1 ? 0.2 : 0.14;
        next.push({
          x: rand(),
          y: rand(),
          // mostly tiny (rr² biases small); anchors get a flat radius bump.
          r: rFloor + rr * rr * rSpan + (anchor ? 1.1 : 0),
          base: Math.min(
            1,
            baseFloor + rand() * 0.5 + (anchor ? 0.28 : 0)
          ),
          amp: 0.1 + rand() * 0.4,
          spd: 0.4 + rand() * 1.3,
          phase: rand() * Math.PI * 2,
          // the faint cool tint stays a small minority — favour the brightest
          // points (anchors + bright far/mid stars) so it reads as a focal hue.
          accent: (anchor || rr > 0.8) && rand() > 0.6,
          depth,
          anchor,
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

      // pure-time drift per depth layer, normalised (0..1). reduced-motion pins
      // it to zero. far creeps; mid is ~1.6x; near is ~2.4x — increasing drift
      // rate from far → near is the parallax that reads as gentle motion through
      // the field. scroll couples in with the same law (near reacts most).
      // fract() so each layer's offset never accumulates or pops.
      const LAYER_DRIFT = reduce
        ? [0, 0, 0]
        : [
            fract(time * 0.0042 + scrollN * 0.5),
            fract(time * 0.0068 + scrollN * 0.85),
            fract(time * 0.0102 + scrollN * 1.25),
          ];

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
      const wx = w * (0.74 - LAYER_DRIFT[0] * 0.18);
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
        const px = fract(s.x - LAYER_DRIFT[s.depth]) * w;
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
