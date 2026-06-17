"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { flightState, resetFlight } from "./flightState";
import { SKILLS } from "./skills";
import { profile } from "@/lib/site-data";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="fly__fallback" aria-hidden="true" />,
});

const MARK = profile.nickname.toUpperCase();

/* The cinematic flythrough. A tall section provides scroll distance; the canvas
   sticks to the viewport while you scroll it (no GSAP pin — avoids the old
   pin-measurement bug). Scroll progress drives the 3D flight; DOM overlays
   (name now, skill labels next) sit crisply over the WebGL. */
export function Flythrough() {
  const ref = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const lenis = useLenis(() => {
    const el = ref.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
    const p = total > 0 ? scrolled / total : 0;
    flightState.target = p;
    const fade = Math.max(0, 1 - p / 0.1);
    if (heroRef.current) heroRef.current.style.opacity = String(fade);
    if (cueRef.current) cueRef.current.style.opacity = String(fade);
    // skill-planet labels: reveal each near its planet's flight peak (pure
    // function of p → reverses cleanly on scroll-up).
    el.querySelectorAll<HTMLElement>(".fly__plabel").forEach((lbl) => {
      const peak = parseFloat(lbl.dataset.peak || "0");
      const op = Math.max(0, 1 - Math.abs(p - peak) / 0.08);
      lbl.style.opacity = String(op);
      lbl.style.transform = `translateY(${(1 - op) * 26}px)`;
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
    if (cueRef.current) cueRef.current.style.opacity = "1";
  }, [pathname, lenis]);

  return (
    <section className="fly" ref={ref} aria-label="Intro">
      <div className="fly__sticky">
        <Scene />
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
          {SKILLS.map((s, i) => (
            <div className="fly__plabel" data-peak={s.peak} key={s.key}>
              <span className="fly__plabel__idx">{String(i + 1).padStart(2, "0")} / 05</span>
              <h2 className="fly__plabel__label">{s.label}</h2>
              <p className="fly__plabel__desc">{s.desc}</p>
            </div>
          ))}
          <div className="fly__cue" ref={cueRef}><span>scroll</span></div>
        </div>
      </div>
    </section>
  );
}
