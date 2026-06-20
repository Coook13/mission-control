"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { useLenis } from "lenis/react";
import { flightState, resetFlight } from "./flightState";
import { enter } from "./phase";
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
   ============================================================================ */
function FlythroughFull() {
  const ref = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
    if (heroRef.current) heroRef.current.style.opacity = String(1 - e);
    if (leftRef.current) {
      leftRef.current.style.transform = `translate3d(${(-e * 16).toFixed(2)}vw, 0, 0)`;
    }
    if (rightRef.current) {
      rightRef.current.style.transform = `translate3d(${(e * 16).toFixed(2)}vw, 0, 0)`;
    }
    // scroll cue lives only in the near-still hero window
    if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.08));
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
    if (heroRef.current) heroRef.current.style.opacity = "1";
    if (leftRef.current) leftRef.current.style.transform = "translate3d(0,0,0)";
    if (rightRef.current) rightRef.current.style.transform = "translate3d(0,0,0)";
    if (cueRef.current) cueRef.current.style.opacity = "1";
  }, [pathname]);

  return (
    <section className="fly" ref={ref} aria-label="Intro">
      <div className="fly__sticky">
        {/* THE one canvas: starfield + 3D black-hole O + effects + camera Rig */}
        <Scene />

        {/* DOM overlay: the 5 content beats fly past (continuous f(beatLocal)) */}
        <FlowPanels />

        {/* Hero wordmark — sits over the canvas; the {O} is a transparent gap so
            the real 3D black hole shows through from behind. Drifts apart +
            fades via enter(p). */}
        <div className="fly__overlay" aria-hidden="false">
          <div className="fly__hero" ref={heroRef}>
            <h1 className="fly__wordmark" aria-label="I build things that work">
              <span className="fly__wm-half fly__wm-half--l" ref={leftRef} aria-hidden="true">
                <span className="fly__wm-line">I BUILD</span>
                <span className="fly__wm-line">THINGS</span>
              </span>
              <span className="fly__wm-half fly__wm-half--r" ref={rightRef} aria-hidden="true">
                <span className="fly__wm-line">THAT</span>
                <span className="fly__wm-line">
                  W<span className="fly__wm-o" aria-hidden="true" />RK
                </span>
              </span>
            </h1>
            <p className="fly__kicker">{profile.name} — founder · engineer · strategist</p>
          </div>
          <div className="fly__cue" ref={cueRef}>
            <span>scroll</span>
          </div>
        </div>
      </div>
    </section>
  );
}

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
