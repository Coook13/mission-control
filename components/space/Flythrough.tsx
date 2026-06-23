"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type JSX } from "react";
import { useLenis } from "lenis/react";
import { flightState, resetFlight } from "./flightState";
import { enter, warpAt, flashAt, pulseAt, FINALE_START } from "./phase";
import { FlowPanels } from "./FlowPanels";
import { SCENES } from "./scenes";
import { facts, profile } from "@/lib/site-data";

/* The ONE WebGL canvas (starfield + black-hole O + post FX + camera Rig) is
   loaded client-only — it relies on browser/GPU APIs, so we skip SSR. While the
   chunk loads we show the same deep-void backdrop the canvas resolves into, so
   there's no flash. */
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="fly__fallback" aria-hidden="true" />,
});

const heroIdentity = [
  profile.nickname.toUpperCase(),
  "BANGKOK -> MANCHESTER",
];

const heroRoles = ["FOUNDER", "STRATEGIST", "ENGINEER"];
const heroThesis = "Technical builder with commercial judgment.";
const heroLanes = "Five proof lanes: technical depth, market thinking, ventures, strategy, research.";
const heroProofs = [
  { n: facts[0].n, k: "predicted First" },
  { n: facts[2].n, k: "raised for AirfoilLearner" },
  { n: facts[4].n, k: "CV model accuracy" },
];

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
       into a vast bright field. Driven by an arrival ramp on progress, plus a
       COUPLED --finale-bright var lifted by flashAt(p) so the climax warp crest
       and the arrival bloom blowout read as ONE punch into light. Pure in p.
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

  // SCROLL → SINGLE SOURCE OF TRUTH. The Lenis callback does ONE thing: write
  // flightState.target = flightState.progress = scroll progress p. No second
  // lerp (anti-pattern #8) — Lenis is the only smoother. It writes NO overlay
  // styles, so the overlay can never be stranded when progress is driven from a
  // source other than this callback (e.g. the console dev-hook setting
  // window.flightState.target without any DOM scroll).
  useLenis(() => {
    const el = ref.current;
    if (!el) return;
    // scroll progress THROUGH the .fly section, clamped 0..1
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = -el.getBoundingClientRect().top;
    const p = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
    flightState.target = p;
    flightState.progress = p;
  });

  // OVERLAY DRIVER — a single rAF loop that reads flightState.progress DIRECTLY
  // (mirrors FlowPanels exactly) and writes every pure-in-p overlay value. This
  // is what makes the hero / cue / letterbox / finale true functions of
  // flightState.progress: they scrub AND reverse whether progress comes from
  // real Lenis scroll OR the console dev-hook. The loop is allocation-free and
  // cancelled on unmount.
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const p = flightState.progress;

      // Hero wordmark: as enter() drives 0→1 across p∈[0.10,0.20], the two halves
      // drift apart (we fly between them) and the whole mark fades out by p≈0.20
      // and STAYS out (enter saturates at 1). Pure in p.
      const e = enter(p);
      const hero = heroRef.current;
      if (hero) {
        hero.style.opacity = (1 - e).toFixed(3);
        // The {O} gap opens as the 3D black hole swells so the window keeps
        // framing the hole through the punch. Pure in p → reverses.
        hero.style.setProperty("--o-scale", (1 + e * 2.9).toFixed(3));
      }
      const left = leftRef.current;
      if (left) left.style.transform = `translate3d(${(-e * 16).toFixed(2)}vw, 0, 0)`;
      const right = rightRef.current;
      if (right) right.style.transform = `translate3d(${(e * 16).toFixed(2)}vw, 0, 0)`;

      // scroll cue lives only in the near-still hero window
      const cue = cueRef.current;
      if (cue) cue.style.opacity = Math.max(0, 1 - p / 0.08).toFixed(3);

      // LETTERBOX bars breathe IN on the warp/set-piece windows. warpAt(p) is 0
      // except in the two acceleration surges → bars are invisibly thin on the
      // beats and clamp down hard mid-warp. The mid-act pulseAt(p) adds a FAINT
      // half-weight breath in the calm TRADING/STRATEGY stretch (0.355–0.405) so
      // that quiet middle gets a build without widening either warp window into
      // the re-windowed debris/sun. Pure in p, so it reverses exactly.
      const bars = barsRef.current;
      if (bars) {
        const bar = Math.min(1, warpAt(p) + pulseAt(p) * 0.5);
        bars.style.setProperty("--bar", bar.toFixed(3));
      }

      // FINALE: an ARRIVAL ramp from FINALE_START → 1 (shared with phase.ts, so
      // there's no flat-drift dead zone: the ramp starts as the climax warp peaks
      // and the dist surge lands). The contact line resolves and the screen blooms
      // into a vast bright field as the camera settles. Pure in p → fully
      // reversible: scrub up and it lands, scrub down and it dissolves.
      const finale = finaleRef.current;
      if (finale) {
        const a = clamp01((p - FINALE_START) / (1 - FINALE_START));
        const arrive = a * a * (3 - 2 * a); // smoothstep
        finale.style.setProperty("--arrive", arrive.toFixed(3));
        // COUPLE the climax warp crest to the finale bloom flash so the warp peak
        // and the arrival flash read as ONE continuous event: --finale-bright is
        // the arrival ramp LIFTED by flashAt(p) (the same pure-in-p blowout the
        // Bloom pass spikes on at the climax break). It rides above `arrive` for
        // the 1–2 frames of the punch-into-light, then settles back to it. The CSS
        // group consumes this for the finale colour ramp (brighter crest at the
        // exact moment the WebGL bloom blows out). Pure in p → reverses exactly.
        const bright = clamp01(arrive + flashAt(p) * (1 - arrive));
        finale.style.setProperty("--finale-bright", bright.toFixed(3));
        // the contact link inside becomes clickable only once the arrival has
        // largely resolved (pure in p → reverses: scroll back up and it's inert)
        finale.style.setProperty("--finale-hit", arrive > 0.85 ? "auto" : "none");
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

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
    if (finaleRef.current) {
      finaleRef.current.style.setProperty("--arrive", "0");
      finaleRef.current.style.setProperty("--finale-bright", "0");
      finaleRef.current.style.setProperty("--finale-hit", "none");
    }
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

        {/* HEADER SCRIM — a short, subtle dark gradient pinned to the very top of
            the stage. The fixed Header (white text, mix-blend) rides above the
            moving WebGL field; when a BRIGHT region rises into the top strip — the
            galaxy arm through the cruise beats, and especially the sun-flare blaze
            (~p0.71, where the top ~half of the strip blows to white) — a
            difference-blend header inverts toward black and the bar reads as
            "gone". This floors the backdrop luminance under the header so the white
            header stays legible the WHOLE journey. Monochrome, fades to nothing by
            ~9vh so it never reads as a UI bar; below the header (z<50) and inert. */}
        <div className="fly__topscrim" aria-hidden="true" />

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
            <div className="fly__identity" aria-hidden="true">
              {heroIdentity.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            {/* Two natural lines — "I BUILD THINGS THAT" over "W{O}RK" — read as
                confident type, not a spaced-out 4-word list. W{O}RK is alone on
                the lower line so its {O} gap can sit at the exact viewport centre
                (where the camera-centred hole renders) AND keep natural word
                spacing — the only layout where BOTH hold. The two halves are the
                two LINES (top/bottom) so the enter(p) drift still parts them and
                the camera flies BETWEEN them toward the hole on the W{O}RK line. */}
            <h1 className="fly__wordmark" aria-label="I build things that work">
              <span className="fly__wm-half fly__wm-half--l" ref={leftRef} aria-hidden="true">
                <span className="fly__wm-line">I BUILD THINGS THAT</span>
              </span>
              <span className="fly__wm-half fly__wm-half--r" ref={rightRef} aria-hidden="true">
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
            <p className="fly__kicker">{profile.name}</p>
            <div className="fly__brief">
              <div className="fly__rolemark" aria-hidden="true">
                {heroRoles.map((role) => (
                  <span key={role}>{role}</span>
                ))}
              </div>
              <p className="fly__thesis">{heroThesis}</p>
              <p className="fly__lanes">{heroLanes}</p>
            </div>
            <div className="fly__proofs" aria-hidden="true">
              {heroProofs.map((fact) => (
                <span className="fly__proof" key={fact.n}>
                  <span className="fly__proof-n">{fact.n}</span>
                  <span className="fly__proof-k">{fact.k}</span>
                </span>
              ))}
            </div>
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

        {/* FINALE — the arrival, and the STRUCTURAL CALLBACK to the hero. Hidden
            (opacity 0) for the whole journey; over p∈[FINALE_START,1] (--arrive)
            the screen blooms to a vast bright field and the wordmark RE-FORMS:
            the hero opened on "...THAT W{O}RK" with a transparent {O} gap framing
            the 3D hole; the journey flew THROUGH that hole; the finale re-aligns
            the very same {O} gap dead-centre on 50/50 (where the returned Arrival
            hole renders) and resolves to the contact CTA "LET'S MAKE IT W{O}RK".
            Pure in p → fully reversible on scroll-up. The whole line is the
            contact link, so the arrival lands on the actual CTA. */}
        <div className="fly__finale" ref={finaleRef} aria-hidden="true">
          <div className="fly__finale-bloom" />
          <div className="fly__finale-recap">
            {heroProofs.map((fact) => (
              <span key={fact.n}>
                {fact.n} {fact.k}
              </span>
            ))}
          </div>
          <a className="fly__finale-line" href="/contact" aria-label="Let's make it work — get in touch">
            <span className="fly__finale-word">LET&rsquo;S MAKE IT</span>
            {/* same W{O}RK construction as the hero wordmark: equal-basis flanks
                pin the transparent {O} gap to the exact line centre, so it
                re-aligns over the hole the journey opened on. */}
            <span className="fly__finale-work" aria-hidden="true">
              <span className="fly__finale-flank fly__finale-flank--l">W</span>
              <span className="fly__finale-o" />
              <span className="fly__finale-flank fly__finale-flank--r">RK</span>
            </span>
          </a>
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
          <div className="fly__identity" aria-hidden="true">
            {heroIdentity.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <h1 className="fly__wordmark" aria-label="I build things that work">
            <span className="fly__wm-half" aria-hidden="true">
              <span className="fly__wm-line">I BUILD THINGS THAT</span>
            </span>
            <span className="fly__wm-half" aria-hidden="true">
              <span className="fly__wm-line">W&#x25EF;RK</span>
            </span>
          </h1>
          <p className="fly__kicker">{profile.name}</p>
          <div className="fly__brief">
            <div className="fly__rolemark" aria-hidden="true">
              {heroRoles.map((role) => (
                <span key={role}>{role}</span>
              ))}
            </div>
            <p className="fly__thesis">{heroThesis}</p>
            <p className="fly__lanes">{heroLanes}</p>
          </div>
          <div className="fly__proofs" aria-hidden="true">
            {heroProofs.map((fact) => (
              <span className="fly__proof" key={fact.n}>
                <span className="fly__proof-n">{fact.n}</span>
                <span className="fly__proof-k">{fact.k}</span>
              </span>
            ))}
          </div>
        </div>
        <ol className="fly-static__skills">
          {SCENES.map((s, i) => (
            <li className="fly-static__skill" key={s.key}>
              <span className="fly-static__skill-idx">
                {String(i + 1).padStart(2, "0")} / 05
              </span>
              <h2 className="fly-static__skill-label">{s.label}</h2>
              <p className="fly-static__skill-proof">{s.proofLine}</p>
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
