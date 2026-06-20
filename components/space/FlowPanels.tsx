"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { flightState } from "./flightState";
import { BEATS, beatLocal } from "./phase";
import { SCENES } from "./scenes";

/* The five content beats, as a DOM overlay above the ONE <Canvas> (never inside
   it). Each panel is a pure, continuous function of scroll progress p: as the
   camera flies forward it APPROACHES from depth (scale up + slide in from its
   side + fade in), centres as the camera arrives, holds briefly, then recedes /
   passes the camera (scale up past 1 + slide further + fade out). This is a
   parallax fly-past, never an opacity-only reveal.

   Driver: a single rAF loop reads flightState.progress (== target; Lenis is the
   only smoother — no second lerp here) and writes transforms straight to refs.
   No per-frame React state, allocation-free, and exactly reversible on scroll-up
   because every value is f(beatLocal(i, p)). */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
// smoothstep — eased 0..1 over [a,b]
const smooth = (a: number, b: number, x: number) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/* Approach / hold / recede windows in beat-local distance l = p - BEATS[i].
   Camera arrives at l=0. Negative l = beat ahead (approaching); positive l =
   beat passing behind. */
const L_IN = -0.09; // start of approach
const L_HOLD = 0.02; // end of the centred hold
const L_OUT = 0.11; // fully receded / passed

type Frame = { vis: number; scale: number; tx: number; slot: number; active: boolean };

/* Continuous panel transform from beat-local distance l. */
function frameAt(l: number): Frame {
  if (l <= L_IN || l >= L_OUT) {
    return { vis: 0, scale: l <= L_IN ? 0.62 : 1.5, tx: l <= L_IN ? -1 : 1, slot: 0, active: false };
  }
  if (l < 0) {
    // APPROACH: emerge from depth, slide in from the side, fade up
    const t = smooth(L_IN, 0, l); // 0..1
    return { vis: t, scale: 0.62 + t * 0.38, tx: -(1 - t), slot: 1 - t, active: false };
  }
  if (l <= L_HOLD) {
    // HOLD: centred, fully present
    return { vis: 1, scale: 1, tx: 0, slot: 0, active: true };
  }
  // RECEDE: blow past the camera and dissolve
  const t = smooth(L_HOLD, L_OUT, l); // 0..1
  return { vis: 1 - t, scale: 1 + t * 0.5, tx: t, slot: t, active: false };
}

export function FlowPanels() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Defensive: this overlay only mounts on the WebGL path (reduced-motion uses
    // FlyStatic and never renders FlowPanels), but if motion is reduced we park
    // the panels and skip the loop so nothing animates.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    // Per-panel lateral travel (vw). Alternating sign comes from scene.side.
    const TRAVEL = 14; // label/panel slide distance
    const SLOT_TRAVEL = 9; // image-slot slides at a different (slower) rate

    const draw = () => {
      const p = flightState.progress;
      for (let i = 0; i < SCENES.length; i++) {
        const el = panelRefs.current[i];
        if (!el) continue;
        const sign = SCENES[i].side === "left" ? -1 : 1;
        const l = beatLocal(i, p);
        const f = frameAt(l);

        // translateX: side * parallax(l). tx∈[-1,1] across approach→recede.
        const x = sign * f.tx * TRAVEL;
        el.style.opacity = f.vis.toFixed(3);
        el.style.transform = `translate(-50%, -50%) translateX(${x.toFixed(2)}vw) scale(${f.scale.toFixed(3)})`;
        // pointer-events only on the centred (active) panel so links under a
        // faded/receding panel never intercept the cursor.
        el.style.pointerEvents = f.active ? "auto" : "none";
        el.style.zIndex = f.active ? "3" : "1";

        // inner image-slot parallaxes at a slightly different rate → depth.
        const slot = slotRefs.current[i];
        if (slot) {
          const sx = -sign * f.slot * SLOT_TRAVEL; // opposes the panel slightly
          slot.style.transform = `translateX(${sx.toFixed(2)}vw)`;
        }
      }
      raf = requestAnimationFrame(draw);
    };

    if (!reduce) {
      raf = requestAnimationFrame(draw);
    } else {
      // park: everything hidden, nothing interactive
      panelRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translate(-50%, -50%) scale(0.62)";
        el.style.pointerEvents = "none";
      });
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flowpanels" ref={rootRef} aria-hidden="false">
      {SCENES.map((s, i) => (
        <article
          key={s.key}
          className={`flowpanel flowpanel--${s.side}`}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          // start parked off-screen-in-depth so the first paint (before rAF) is
          // not a flash of a centred panel; the loop overwrites this immediately.
          style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.62)" }}
          data-beat={BEATS[i]}
        >
          <span className="flowpanel__idx">
            {s.idx} <span className="flowpanel__idx-dim">/ 05</span>
          </span>

          <h2 className="flowpanel__label">{s.label}</h2>

          <p className="flowpanel__desc">{s.desc}</p>

          <div
            className="flowpanel__slot"
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            aria-hidden="true"
          >
            <span className="flowpanel__slot-tag">image</span>
          </div>

          <ul className="flowpanel__work">
            {s.hotspots.map((h, j) => {
              const isWork = h.href.startsWith("/work");
              return (
                <li key={j}>
                  <Link className="flowpanel__link" href={h.href}>
                    <span className="flowpanel__link-title">{h.title}</span>
                    <span className="flowpanel__link-line">{h.oneLine}</span>
                    <span className="flowpanel__link-arrow">{isWork ? "→" : "↗"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
