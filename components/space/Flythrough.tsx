"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { useLenis } from "lenis/react";
import { flightState, resetFlight } from "./flightState";
import { enter, warpAt } from "./phase";
import { FlowPanels } from "./FlowPanels";
import { SCENES } from "./scenes";
import { profile } from "@/lib/site-data";

/* The ONE WebGL canvas (starfield + black-hole O + post FX + camera Rig) is
   loaded client-only — it relies on browser/GPU APIs, so we skip SSR. While the
   chunk loads we show the same deep-void backdrop the canvas resolves into, so
   there's no flash. */
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="fly__fallback" aria-hidden="true" />,
});

/* ============================================================================
   FLYTHROUGH — the sticky shell for the continuous, scroll-scrubbed fly-through.

   A tall .fly section gives the scroll its length; a position:sticky .fly__sticky
   pins the single <Scene/> canvas for the whole journey. A Lenis scroll callback
   writes flightState.target = the .fly section's scroll progress (0..1) — the
   single source the camera + black hole read. The hero wordmark overlay
   ("I BUILD THINGS / THAT W{O}RK") drifts apart and fades via enter(p) — the {O}
   is a transparent gap so the real 3D black hole renders THROUGH it from the
   canvas behind. FlowPanels is a DOM overlay (not in the canvas) that flies the
   5 content beats past. Everything is a pure function of p, so it scrubs and
   reverses exactly.

   On top of the scrubbed flight, three DRAMATIC-ARC layers (this file owns them):
     · IGNITION  — a one-shot pre-roll that REPLACES the loader: black → a point
       of light ignites → the field rushes out + the wordmark/hole power up
       ("systems online"). A pure CSS timeline gated by a `lit` flag; it never
       touches p, so the journey underneath is scrollable the instant it clears.
     · LETTERBOX — cinematic bars that breathe IN during the warp/set-piece
       windows (driven by warpAt(p)) and breathe OUT otherwise. Pure in p.
     · FINALE    — near p=1 the contact line resolves grandly as the camera bursts
       into a vast bright field. Driven by an arrival ramp on progress. Pure in p.
   ============================================================================ */
function FlythroughFull() {
  const ref = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // IGNITION: the pre-roll plays once per mount on "/". `lit` flips true a frame
  // after mount so the CSS keyframes (which are paused in the unlit state) fire
  // the ignition timeline. `done` lets us drop the overlay from the a11y tree +
  // pointer path once the burst has cleared, so it never blocks scroll/clicks.
  const [lit, setLit] = useState(false);
  const [ignitionDone, setIgnitionDone] = useState(false);

  useLenis(() => {
    const el = ref.current;
    if (!el) return;
    // scroll progress THROUGH the .fly section, clamped 0..1
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = -el.getBoundingClientRect().top;
    const p = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;

    // SINGLE source of truth. No second lerp — progress mirrors target; only
    // Lenis smooths the underlying scroll (anti-pattern #8).
    flightState.target = p;
    flightState.progress = p;

    // Hero wordmark: as enter() drives 0→1 across p∈[0.10,0.20], the two halves
    // drift apart (we fly between them) and the whole mark fades out. Pure in p.
    const e = enter(p);
    if (heroRef.current) {
      heroRef.current.style.opacity = String(1 - e);
      // The {O} gap opens as the 3D black hole swells (scale 9+e*26 ≈ ×3.9) so
      // the window keeps framing the hole through the punch. Pure in p → reverses.
      heroRef.current.style.setProperty("--o-scale", String(1 + e * 2.9));
    }
    if (leftRef.current) {
      leftRef.current.style.transform = `translate3d(${(-e * 16).toFixed(2)}vw, 0, 0)`;
    }
    if (rightRef.current) {
      rightRef.current.style.transform = `translate3d(${(e * 16).toFixed(2)}vw, 0, 0)`;
    }
    // scroll cue lives only in the near-still hero window
    if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.08));

    // LETTERBOX bars breathe IN on the warp/set-piece windows. warpAt(p) is 0
    // except in the two acceleration surges → bars are invisibly thin on the
    // beats and clamp down hard mid-warp. Pure in p, so it reverses exactly.
    if (barsRef.current) {
      barsRef.current.style.setProperty("--bar", warpAt(p).toFixed(3));
    }

    // FINALE: an ARRIVAL ramp over p∈[0.9,1]. The contact line resolves and the
    // screen blooms into a vast bright field as the camera settles. Pure in p:
    // scrub up past 0.9 and it fades back out, scrub down and it lands again.
    if (finaleRef.current) {
      const a = clamp01((p - 0.9) / 0.1); // 0 → 1 across the last 10% of scroll
      const arrive = a * a * (3 - 2 * a); // smoothstep
      finaleRef.current.style.setProperty("--arrive", arrive.toFixed(3));
    }
  });

  // On home mount / route-return: never leave the flight + wordmark stranded
  // mid-scroll after a reload or nav-back. Reset state, snap to top, restore the
  // hero overlay. Scoped to "/" so /story and /work are untouched.
  useEffect(() => {
    // dev-only: drive the flight from the console (window.flightState.target =
    // 0.5) without scrolling the DOM — the sticky canvas stays pinned at scroll 0
    // for clean screenshots of mid-flight states.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { flightState?: typeof flightState }).flightState = flightState;
    }
    if (pathname !== "/") return;
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    resetFlight();
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: number, o?: { immediate?: boolean }) => void } }).lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    if (heroRef.current) {
      heroRef.current.style.opacity = "1";
      heroRef.current.style.setProperty("--o-scale", "1");
    }
    if (leftRef.current) leftRef.current.style.transform = "translate3d(0,0,0)";
    if (rightRef.current) rightRef.current.style.transform = "translate3d(0,0,0)";
    if (cueRef.current) cueRef.current.style.opacity = "1";
    if (barsRef.current) barsRef.current.style.setProperty("--bar", "0");
    if (finaleRef.current) finaleRef.current.style.setProperty("--arrive", "0");
  }, [pathname]);

  // IGNITION trigger: arm the timeline one frame after mount (so the unlit
  // first paint is pure black, then the point of light ignites). Reduced-motion
  // skips the show entirely and lands straight on "online". Two timers drive the
  // CSS phases; we tear them down on unmount so a fast route-change can't leak.
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLit(true);
      setIgnitionDone(true);
      return;
    }
    const t0 = window.setTimeout(() => setLit(true), 60);
    // the CSS timeline runs ~2.4s; drop the overlay from the tree just after.
    const t1 = window.setTimeout(() => setIgnitionDone(true), 2600);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, []);

  return (
    <section className="fly" ref={ref} aria-label="Intro">
      <div className="fly__sticky">
        {/* THE one canvas: starfield + 3D black-hole O + effects + camera Rig */}
        <Scene />

        {/* DOM overlay: the 5 content beats fly past (continuous f(beatLocal)) */}
        <FlowPanels />

        {/* Hero wordmark — sits over the canvas; the {O} is a transparent gap so
            the real 3D black hole shows through from behind. Drifts apart +
            fades via enter(p). The `is-online` class (set once ignition powers
            up) triggers the kinetic arrival: the mark scales + un-blurs into
            place, synced to the field rushing out. */}
        <div className="fly__overlay" aria-hidden="false">
          <div
            className={`fly__hero${lit ? " is-online" : ""}`}
            ref={heroRef}
          >
            <h1 className="fly__wordmark" aria-label="I build things that work">
              <span className="fly__wm-half fly__wm-half--l" ref={leftRef} aria-hidden="true">
                <span className="fly__wm-line">I BUILD</span>
                <span className="fly__wm-line">THINGS</span>
              </span>
              <span className="fly__wm-half fly__wm-half--r" ref={rightRef} aria-hidden="true">
                <span className="fly__wm-line">THAT</span>
                {/* W{O}RK laid out so the {O} gap is the flex centre: equal-basis
                    flanks push the gap to the line's exact midpoint, which the
                    wordmark shift parks at screen centre = the black hole's core.
                    Metric-independent, so it stays aligned across the clamp. */}
                <span className="fly__wm-line fly__wm-line--work">
                  <span className="fly__wm-flank fly__wm-flank--l">W</span>
                  <span className="fly__wm-o" aria-hidden="true" />
                  <span className="fly__wm-flank fly__wm-flank--r">RK</span>
                </span>
              </span>
            </h1>
            <p className="fly__kicker">{profile.name} — founder · engineer · strategist</p>
          </div>
          <div className="fly__cue" ref={cueRef}>
            <span>scroll</span>
          </div>
        </div>

        {/* LETTERBOX — top/bottom cinematic bars that breathe IN during the warp
            windows (height driven by --bar = warpAt(p)) and OUT otherwise. Pure
            in p. Sits above the canvas + panels but below the finale. */}
        <div className="fly__bars" ref={barsRef} aria-hidden="true">
          <span className="fly__bar fly__bar--t" />
          <span className="fly__bar fly__bar--b" />
        </div>

        {/* FINALE — the arrival. Hidden (opacity 0) for the whole journey; over
            p∈[0.9,1] (--arrive) the screen blooms to a vast bright field and the
            contact line resolves. Pure in p → fully reversible on scroll-up. */}
        <div className="fly__finale" ref={finaleRef} aria-hidden="true">
          <div className="fly__finale-bloom" />
          <p className="fly__finale-line">
            LET&rsquo;S BUILD SOMETHING THAT <em>works</em>
          </p>
        </div>

        {/* IGNITION pre-roll — replaces the loader. Pure CSS timeline gated by
            `lit`; removed from the tree once `ignitionDone`. While present it
            covers the stage in black, ignites a point of light, then rushes the
            field outward and reads "systems online" as it clears. */}
        {!ignitionDone && (
          <div
            className={`fly__ignition${lit ? " is-lit" : ""}`}
            aria-hidden="true"
          >
            <span className="fly__ignition-spark" />
            <span className="fly__ignition-flash" />
            <span className="fly__ignition-status">systems online</span>
          </div>
        )}
      </div>
    </section>
  );
}

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/* Static fallback — no WebGL, no scroll-scrub. Shown for reduced-motion or small
   touch screens: the wordmark + a clean stacked list of the 5 beats. The heavy
   <Scene>/<FlowPanels> are never mounted in this mode. */
function FlyStatic() {
  return (
    <section className="fly-static" aria-label="Intro">
      <div className="fly-static__inner">
        <div className="fly-static__hero">
          <h1 className="fly__wordmark" aria-label="I build things that work">
            <span className="fly__wm-half" aria-hidden="true">
              <span className="fly__wm-line">I BUILD</span>
              <span className="fly__wm-line">THINGS</span>
            </span>
            <span className="fly__wm-half" aria-hidden="true">
              <span className="fly__wm-line">THAT</span>
              <span className="fly__wm-line">W&#x25EF;RK</span>
            </span>
          </h1>
          <p className="fly__kicker">{profile.name} — founder · engineer · strategist</p>
        </div>
        <ol className="fly-static__skills">
          {SCENES.map((s, i) => (
            <li className="fly-static__skill" key={s.key}>
              <span className="fly-static__skill-idx">
                {String(i + 1).padStart(2, "0")} / 05
              </span>
              <h2 className="fly-static__skill-label">{s.label}</h2>
              <p className="fly-static__skill-desc">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Picks the experience. Defaults to the full WebGL fly-through (the showcase,
   and what SSR renders → no hydration mismatch). After mount, switches to the
   static fallback for reduced-motion or small touch screens, so the WebGL Scene
   is never run there. A `?static` query param forces it in dev for verification. */
export function Flythrough(): JSX.Element {
  const [mode, setMode] = useState<"full" | "static" | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchSmall = window.matchMedia("(pointer: coarse) and (max-width: 768px)");
    const devForce =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("static");
    const decide = () =>
      setMode(reduce.matches || touchSmall.matches || devForce ? "static" : "full");
    decide();
    reduce.addEventListener("change", decide);
    touchSmall.addEventListener("change", decide);
    return () => {
      reduce.removeEventListener("change", decide);
      touchSmall.removeEventListener("change", decide);
    };
  }, []);

  return mode === "static" ? <FlyStatic /> : <FlythroughFull />;
}
