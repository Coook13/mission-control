"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { flightState, resetFlight } from "./flightState";
import { SKILLS } from "./skills";
import { SCENES, HERO_IMG } from "./scenes";
import { profile } from "@/lib/site-data";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="fly__fallback" aria-hidden="true" />,
});

const MARK = profile.nickname.toUpperCase();

/* The cinematic journey — REAL imagery. A tall sticky section; scroll drives a
   crossfade between a deep-field hero and five real-planet beats (each a large
   graded object over a moving starfield), with a push-in on approach, bold
   work hotspots, and a warp-out that bleaches into the cream content. */
function FlythroughFull() {
  const ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const lenis = useLenis(() => {
    const el = ref.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
    const p = total > 0 ? scrolled / total : 0;
    flightState.target = p;
    // hero (deep field + name) owns the opening, fades by ~p0.12
    const fade = Math.max(0, 1 - p / 0.12);
    if (heroRef.current) heroRef.current.style.opacity = String(fade);
    if (heroImgRef.current) heroImgRef.current.style.opacity = String(Math.max(0, 1 - p / 0.16));
    if (cueRef.current) cueRef.current.style.opacity = String(fade);
    // warp-out: cream veil bleaches the warp into the content (full by ~p0.99)
    if (endRef.current) endRef.current.style.opacity = String(Math.max(0, Math.min(1, (p - 0.93) / 0.06)));
    // each beat: crossfade its scene + push the planet in on approach, and
    // reveal its label on a tighter window. Pure functions of p → reverse cleanly.
    el.querySelectorAll<HTMLElement>(".cine-scene").forEach((scene) => {
      const peak = parseFloat(scene.dataset.peak || "0");
      const op = Math.max(0, 1 - Math.abs(p - peak) / 0.14);
      scene.style.opacity = String(op);
      scene.style.pointerEvents = op > 0.85 ? "auto" : "none";
      const planet = scene.querySelector<HTMLElement>(".cine-planet");
      if (planet) {
        const grow = Math.max(0, Math.min(1, (0.14 - (p - peak)) / 0.2)); // grows as we arrive + pass
        planet.style.transform = `translate(-50%, -50%) scale(${(0.82 + grow * 0.3).toFixed(3)})`;
      }
    });
    // beat labels live in the overlay (crisp, above the grade); tighter window
    el.querySelectorAll<HTMLElement>(".fly__plabel").forEach((lbl) => {
      const peak = parseFloat(lbl.dataset.peak || "0");
      const lop = Math.max(0, 1 - Math.abs(p - peak) / 0.08);
      lbl.style.opacity = String(lop);
      lbl.style.transform = `translateY(${(1 - lop) * 28}px)`;
    });
  });

  // On home mount / route-return: don't let a reload or nav-back leave the
  // flight + name mid-scroll. Reset state and snap to the top. Scoped to "/"
  // so /story and /work are untouched.
  useEffect(() => {
    // dev-only: drive the flight from the console without scrolling the DOM
    // (window.flightState.target = 0.5) so mid-flight states are screenshot-able
    // — the sticky canvas stays pinned at scroll 0, which CDP captures cleanly.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { flightState?: typeof flightState }).flightState = flightState;
    }
    if (pathname !== "/") return;
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    resetFlight();
    flightState.target = 0;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    if (heroRef.current) heroRef.current.style.opacity = "1";
    if (heroImgRef.current) heroImgRef.current.style.opacity = "1";
    if (cueRef.current) cueRef.current.style.opacity = "1";
  }, [pathname, lenis]);

  return (
    <section className="fly" ref={ref} aria-label="Intro">
      <div className="fly__sticky">
        <Scene />
        {/* hero deep-field (full-bleed, graded) — fades to reveal the starfield */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cine-hero" ref={heroImgRef} src={HERO_IMG} alt="" aria-hidden="true" />
        {/* the five real-planet beats */}
        <div className="cine-scenes" aria-hidden="true">
          {SCENES.map((s) => (
            <div className="cine-scene" data-peak={s.peak} key={s.key}>
              <div className="cine-tint" style={{ background: `radial-gradient(60% 60% at 50% 45%, ${s.tint}55, transparent 70%)` }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cine-planet" src={s.img} alt="" style={{ height: `${s.scale}vh` }} />
              {s.hotspots.map((h, j) => (
                <span className="cine-hot" key={j} style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                  <span className="cine-hot__dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="cine-grade" aria-hidden="true" />
        <div className="fly__overlay" aria-hidden="false">
          <div className="fly__hero" ref={heroRef}>
            <h1 className="fly__title" aria-label={profile.name}>
              {MARK}
              <span className="fly__sub">THANAWAROTHON</span>
            </h1>
            <div className="fly__meta">
              <span>{profile.name}</span>
              <span>— founder · engineer · strategist</span>
            </div>
          </div>
          {SCENES.map((s) => (
            <div className={`fly__plabel fly__plabel--${s.side}`} data-peak={s.peak} key={s.key}>
              <span className="fly__plabel__idx">{s.idx} / 05</span>
              <h2 className="fly__plabel__label">{s.label}</h2>
              <p className="fly__plabel__desc">{s.desc}</p>
            </div>
          ))}
          <div className="fly__cue" ref={cueRef}><span>scroll</span></div>
        </div>
        <div className="cine-bars" aria-hidden="true" />
        <div className="fly__exit" ref={endRef} aria-hidden="true" />
      </div>
    </section>
  );
}

/* Static fallback — no WebGL. Shown for reduced-motion or small touch devices:
   a graded deep-field hero + the name + the 5 skills as a clean stacked list.
   The heavy <Scene> is never mounted in this mode. */
function FlyStatic() {
  return (
    <section className="fly-static" aria-label="Intro">
      <div className="fly-static__inner">
        <div className="fly-static__hero">
          <h1 className="fly__title" aria-label={profile.name}>
            {MARK}
            <span className="fly__sub">THANAWAROTHON</span>
          </h1>
          <div className="fly__meta">
            <span>{profile.name}</span>
            <span>— founder · engineer · strategist</span>
          </div>
        </div>
        <ol className="fly-static__skills">
          {SKILLS.map((s, i) => (
            <li className="fly-static__skill" key={s.key}>
              <span className="fly__plabel__idx">{String(i + 1).padStart(2, "0")} / 05</span>
              <h2 className="fly-static__skill-label">{s.label}</h2>
              <p className="fly__plabel__desc">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* Picks the experience. Defaults to the full WebGL flythrough (the showcase,
   and what SSR renders → no hydration mismatch). After mount, switches to the
   static fallback for reduced-motion or small touch screens, so the WebGL
   Scene is never run there. A `?static` query param forces it in dev for
   verification. */
export function Flythrough() {
  const [mode, setMode] = useState<"full" | "static" | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchSmall = window.matchMedia("(pointer: coarse) and (max-width: 768px)");
    const devForce =
      process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("static");
    const decide = () => setMode(reduce.matches || touchSmall.matches || devForce ? "static" : "full");
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
