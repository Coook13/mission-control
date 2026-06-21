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

/* `vis` = panel body opacity. `label` = the giant wordmark's own opacity, which
   peels away FASTER than the body as the beat leaves centre, so the title never
   collides off-centre with the next panel's body (sharper hierarchy through the
   transition). `scrim` = the contrast-floor backing opacity (0..1). All pure in
   beat-local l → scrub + reverse exactly. */
type Frame = {
  vis: number;
  label: number;
  scrim: number;
  scale: number;
  tx: number;
  slot: number;
  active: boolean;
};

/* Continuous panel transform from beat-local distance l. */
function frameAt(l: number): Frame {
  if (l <= L_IN || l >= L_OUT) {
    return {
      vis: 0,
      label: 0,
      scrim: 0,
      scale: l <= L_IN ? 0.62 : 1.5,
      tx: l <= L_IN ? -1 : 1,
      slot: 0,
      active: false,
    };
  }
  if (l < 0) {
    // APPROACH: emerge from depth, slide in from the side, fade up
    const t = smooth(L_IN, 0, l); // 0..1
    return {
      vis: t,
      // title enters LATER than the body now: it does not begin to resolve until
      // the body is ~40% in, so the giant wordmark never appears while the
      // PREVIOUS beat's (faster-peeling) title is still on its way out. Window
      // start raised from L_IN*0.82 (≈ body-onset) toward L_IN*0.55 so the title
      // onset trails the body — kills the p32/p52/p72 double-wordmark stacks.
      label: smooth(L_IN * 0.55, -0.01, l),
      scrim: t,
      scale: 0.62 + t * 0.38,
      tx: -(1 - t),
      slot: 1 - t,
      active: false,
    };
  }
  if (l <= L_HOLD) {
    // HOLD: centred, fully present
    return { vis: 1, label: 1, scrim: 1, scale: 1, tx: 0, slot: 0, active: true };
  }
  // RECEDE: blow past the camera and dissolve
  const t = smooth(L_HOLD, L_OUT, l); // 0..1
  // title peels FASTER + EARLIER than the body: it is fully gone by ~32% of the
  // recede window (was 50%), so the giant wordmark clears the frame well before
  // the next panel's title resolves in. With the later approach onset above this
  // guarantees only one giant wordmark on screen at a time (p32 ENGINEERING/nav,
  // p52 VENTURE/ghost, p72 STRATEGY/RESEARCH stacks fixed).
  const labelT = smooth(L_HOLD, L_HOLD + (L_OUT - L_HOLD) * 0.32, l);
  return {
    vis: 1 - t,
    label: 1 - labelT,
    scrim: 1 - t,
    scale: 1 + t * 0.5,
    tx: t,
    slot: t,
    active: false,
  };
}

export function FlowPanels() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const scrimRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

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

        // CONTRAST FLOOR — the scrim is a soft dark ellipse behind the text that
        // keeps the labels legible over whatever warp/debris/sun frame is behind
        // the canvas. Ramped purely by f.scrim (= panel visibility), so it fades
        // with the beat and never persists. Backing element only; z below text.
        const scrim = scrimRefs.current[i];
        if (scrim) scrim.style.opacity = f.scrim.toFixed(3);

        // HIERARCHY — the giant wordmark fades on its OWN faster ramp and drops a
        // touch behind the body as it recedes, so a passing title can't collide
        // off-centre with the next panel's copy.
        const label = labelRefs.current[i];
        if (label) {
          label.style.opacity = f.label.toFixed(3);
          // push the receding title behind the body (negative translateZ via a
          // tiny scale-down + lower opacity reads as depth without a new stacking
          // context fight); keep approach flush.
          label.style.zIndex = f.label >= f.vis ? "1" : "0";
        }

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
          {/* CONTRAST-FLOOR SCRIM — soft dark ellipse behind the type, above the
              canvas, below the text/links. Opacity driven per-frame (pure in
              beatLocal) by the rAF loop. Pure decoration → aria-hidden. */}
          <span
            className="flowpanel__scrim"
            ref={(el) => {
              scrimRefs.current[i] = el;
            }}
            aria-hidden="true"
          />

          <span className="flowpanel__idx">
            {s.idx} <span className="flowpanel__idx-dim">/ 05</span>
          </span>

          <h2
            className="flowpanel__label"
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
          >
            {s.label}
          </h2>

          <p className="flowpanel__desc">{s.desc}</p>

          {/* DEPTH PLATE — a procedural monochrome star-wash, parallaxed at its
              own (slower) rate by the JS so it sits "deeper" than the type. No
              border chrome, no placeholder tag: it reads as part of the deep-space
              grade, not a half-built image frame. Procedural only (anti-pattern
              #4). */}
          <div
            className="flowpanel__slot"
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            aria-hidden="true"
          />

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
