"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";
import { PixelMicky } from "./PixelMicky";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

// fixed starfield — fades in as the planet swallows the frame
const STARS: [number, number, number][] = [
  [6, 10, 0.3], [14, 26, 0.18], [22, 8, 0.22], [31, 18, 0.16], [38, 33, 0.28],
  [47, 12, 0.2], [54, 27, 0.15], [62, 7, 0.26], [69, 21, 0.18], [77, 14, 0.3],
  [85, 30, 0.2], [92, 18, 0.16], [9, 44, 0.22], [18, 54, 0.16], [27, 47, 0.26],
  [36, 60, 0.18], [44, 50, 0.2], [52, 63, 0.15], [60, 46, 0.24], [68, 57, 0.18],
  [75, 49, 0.28], [83, 61, 0.16], [90, 52, 0.22], [4, 70, 0.2], [25, 76, 0.18],
  [42, 82, 0.24], [58, 74, 0.16], [72, 84, 0.22], [88, 78, 0.18], [12, 88, 0.26],
];

// pixel rocket — N/B/F cream, W ink window, E orange flame
const ROCKET = [
  "....N....",
  "...NNN...",
  "...NNN...",
  "..BBBBB..",
  "..BWWWB..",
  "..BWWWB..",
  "..BBBBB..",
  "..BBBBB..",
  ".FBBBBBF.",
  "FFBBBBBFF",
  "..BBBBB..",
  "...EEE...",
  "....E....",
];
const RCOLOR: Record<string, string> = { N: "#F5F4F0", B: "#F5F4F0", F: "#F5F4F0", W: "#111110", E: "#FF7A3C" };
const U = 5;

/* Hero: a cream world with a dark planet. On scroll the planet grows and
   swallows the frame, the name scatters, the starfield surfaces, and pixel
   Micky launches in a rocket up into the dark. One pinned, scrubbed move —
   light → dark, continuous, no swap. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-title .hchar");
      if (reduce) return;

      gsap.from(chars, { yPercent: 120, opacity: 0, stagger: 0.05, duration: 0.9, ease: "power3.out", delay: 0.15 });
      gsap.from(".hero-title__sub, .hero-meta, .hero-cue, .hero-figure", {
        opacity: 0, y: 16, duration: 0.8, delay: 0.6, ease: "power2.out", stagger: 0.06,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=150%",
          scrub: 0.6,
          pin: ".hero-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".hero-planet", { scale: 18, ease: "power1.in" }, 0)
        .to(".hero-stars", { opacity: 0.9, ease: "none" }, 0.12)
        .to(chars, {
          yPercent: () => gsap.utils.random(-260, -80),
          xPercent: () => gsap.utils.random(-140, 140),
          rotation: () => gsap.utils.random(-40, 40),
          opacity: 0,
          ease: "power1.in",
          stagger: { each: 0.02, from: "center" },
        }, 0)
        .to(".hero-title__sub, .hero-meta, .hero-cue", { opacity: 0, y: -20, ease: "none", duration: 0.35 }, 0)
        .to(".hero-figure", { opacity: 0, ease: "none", duration: 0.25 }, 0.32)
        .set(".hero-rocket", { opacity: 1 }, 0.34)
        .to(".hero-rocket", { y: () => -window.innerHeight * 1.2, xPercent: 26, ease: "power2.in", duration: 0.62 }, 0.34)
        .to(".hero-rocket", { opacity: 0, duration: 0.12 }, 0.92);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-planet" aria-hidden="true" />
        <div className="hero-stars" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {STARS.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill="#fff" />
            ))}
          </svg>
        </div>

        <div className="hero-figure">
          <PixelMicky height={56} />
        </div>

        <div className="hero-rocket" aria-hidden="true">
          <svg width={9 * U} height={ROCKET.length * U} viewBox={`0 0 ${9 * U} ${ROCKET.length * U}`} shapeRendering="crispEdges">
            {ROCKET.flatMap((row, y) =>
              [...row].map((c, x) =>
                c === "." ? null : <rect key={`${x}-${y}`} x={x * U} y={y * U} width={U} height={U} fill={RCOLOR[c]} />
              )
            )}
          </svg>
        </div>

        <div className="hero-mark">
          <h1 className="hero-title" aria-label={profile.name}>
            {[...MARK].map((c, i) => (
              <span className="hchar" key={i}>{c}</span>
            ))}
            <span className="hero-title__sub">THANAWAROTHON</span>
          </h1>
          <div className="hero-meta">
            <span>{profile.name}</span>
            <span>— founder · engineer · strategist</span>
          </div>
        </div>

        <div className="hero-cue" aria-hidden="true"><span>scroll</span></div>
      </div>
    </section>
  );
}
