"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useLenis } from "lenis/react";
import { flightState } from "./flightState";
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

  useLenis(() => {
    const el = ref.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
    const p = total > 0 ? scrolled / total : 0;
    flightState.target = p;
    const fade = Math.max(0, 1 - p / 0.1);
    if (heroRef.current) heroRef.current.style.opacity = String(fade);
    if (cueRef.current) cueRef.current.style.opacity = String(fade);
  });

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
          <div className="fly__cue" ref={cueRef}><span>scroll</span></div>
        </div>
      </div>
    </section>
  );
}
