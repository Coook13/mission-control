"use client";

import { useEffect, useRef } from "react";
import { flightState } from "@/components/space/flightState";

/* SCROLL PROGRESS — a hairline monochrome indicator for the home fly-through.
   A thin fixed bar pinned to the very top edge whose scaleX tracks the journey
   (flightState.progress), plus a tiny dot-matrix percent readout in the corner.

   Driver: a single rAF loop that READS flightState.progress (== target; the
   Lenis callback in Flythrough is the only writer — this is a pure read, exactly
   like FlowPanels). It writes a --p CSS var (0..1) for the bar's scaleX and a
   --vis var that fades the whole indicator IN only after the hero clears, so it
   never competes with the wordmark / scroll cue in the near-still opening. No
   per-frame React state, allocation-free, and reversible because every value is
   a pure function of progress. Hidden entirely under reduced-motion (the static
   fallback has no scrubbed journey to track). Mounted on the home page only. */
export function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let lastPct = -1;

    const draw = () => {
      const root = rootRef.current;
      if (root) {
        const p = flightState.progress;

        // Bar fill: 0..1 across the whole journey → scaleX in CSS.
        root.style.setProperty("--p", p.toFixed(4));

        // FADE-IN AFTER THE HERO: the near-still opening (p<0.08) belongs to the
        // wordmark + the "scroll" cue, so the indicator stays invisible there and
        // eases in across the ENTER punch (p 0.08→0.18). Pure in p → on scroll-up
        // it fades back out as the hero re-forms. Eased (smoothstep) so the edge
        // arrival is soft, not a hard switch.
        const u = (p - 0.08) / (0.18 - 0.08);
        const c = u < 0 ? 0 : u > 1 ? 1 : u;
        const vis = c * c * (3 - 2 * c);
        root.style.setProperty("--vis", vis.toFixed(3));

        // Integer percent readout — only touch the DOM when it actually changes
        // (avoids a per-frame text-node write for ~99% of frames).
        const pct = Math.round(p * 100);
        if (pct !== lastPct && pctRef.current) {
          pctRef.current.textContent = String(pct).padStart(2, "0");
          lastPct = pct;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="scrollprog"
      ref={rootRef}
      aria-hidden="true"
      style={{ ["--p" as string]: 0, ["--vis" as string]: 0 }}
    >
      <span className="scrollprog__track">
        <span className="scrollprog__bar" />
      </span>
      <span className="scrollprog__pct">
        <span ref={pctRef}>00</span>
        <span className="scrollprog__pct-unit">%</span>
      </span>
    </div>
  );
}
