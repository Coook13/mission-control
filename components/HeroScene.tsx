"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

/* Hero: a cinematic cut from Micky's world into deep space. At rest it's his
   photo, graded, with a cosmic shimmer in the sky. On scroll (pinned, scrub)
   the photo recedes and real NASA imagery — the Carina nebula and Earth —
   takes over while the name scatters. Hyperrealistic, continuous, no swap. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-title .hchar");
      if (reduce) return;

      gsap.from(chars, { yPercent: 120, opacity: 0, stagger: 0.05, duration: 0.9, ease: "power3.out", delay: 0.2 });
      gsap.from(".hero-meta, .hero-cue", { opacity: 0, y: 16, duration: 0.8, delay: 0.7, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=160%",
          scrub: 0.7,
          pin: ".hero-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".hero-photo", { scale: 1.12, opacity: 0.12, ease: "power1.in" }, 0)
        .to(".hero-cosmos-sky", { opacity: 0, ease: "none", duration: 0.4 }, 0)
        .to(".hero-nebula", { opacity: 1, scale: 1.08, ease: "none" }, 0)
        .fromTo(".hero-earth", { opacity: 0, scale: 0.62, yPercent: 16 }, { opacity: 1, scale: 1, yPercent: 0, ease: "power1.out" }, 0.22)
        .to(chars, {
          yPercent: () => gsap.utils.random(-260, -80),
          xPercent: () => gsap.utils.random(-140, 140),
          rotation: () => gsap.utils.random(-40, 40),
          opacity: 0,
          ease: "power1.in",
          stagger: { each: 0.02, from: "center" },
        }, 0)
        .to(".hero-meta, .hero-cue", { opacity: 0, y: -20, ease: "none", duration: 0.35 }, 0);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-cosmos" aria-hidden="true" />
        {/* eslint-disable @next/next/no-img-element */}
        <img className="hero-nebula" src="/img/space/nebula.jpg" alt="" aria-hidden="true" />
        <img className="hero-earth" src="/img/space/earth.jpg" alt="" aria-hidden="true" />
        <div className="hero-photo">
          <img src="/img/hero-micky.jpg" alt={profile.name} fetchPriority="high" />
        </div>
        <img className="hero-cosmos-sky" src="/img/space/nebula.jpg" alt="" aria-hidden="true" />
        {/* eslint-enable @next/next/no-img-element */}
        <div className="hero-vignette" aria-hidden="true" />

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
