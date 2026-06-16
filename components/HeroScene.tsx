"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

/* Hero: Interstellar-grade. Micky stands cut out against deep space — Saturn
   hanging, a star field, film grain, letterbox, heavy vignette. On scroll the
   cosmos drifts slowly past (weighty parallax), the name rises away, and he is
   left to the dark. Continuous; no jarring swaps. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-title .hchar");
      if (reduce) return;

      gsap.from(chars, { yPercent: 110, opacity: 0, stagger: 0.05, duration: 1, ease: "power3.out", delay: 0.25 });
      gsap.from(".hero-figure", { xPercent: 9, opacity: 0, duration: 1.5, ease: "power2.out", delay: 0.1 });
      gsap.from(".hero-meta, .hero-cue", { opacity: 0, y: 16, duration: 0.9, delay: 0.85, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=175%",
          scrub: 0.8,
          pin: ".hero-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".hero-stars", { scale: 1.16, ease: "none" }, 0)
        .to(".hero-neb", { scale: 1.24, xPercent: -4, ease: "none" }, 0)
        .to(".hero-planet", { yPercent: -10, scale: 1.12, ease: "none" }, 0)
        .to(".hero-figure", { yPercent: -7, scale: 1.05, ease: "none" }, 0)
        .to(".hero-figure", { opacity: 0, ease: "power1.in", duration: 0.28 }, 0.72)
        .to(chars, { yPercent: -70, opacity: 0, ease: "power2.in", stagger: { each: 0.03, from: "start" } }, 0)
        .to(".hero-meta, .hero-cue", { opacity: 0, y: -20, ease: "none", duration: 0.32 }, 0);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-cosmos" aria-hidden="true" />
        {/* eslint-disable @next/next/no-img-element */}
        <img className="hero-stars" src="/img/space/deepfield.jpg" alt="" aria-hidden="true" />
        <img className="hero-neb" src="/img/space/nebula.jpg" alt="" aria-hidden="true" />
        <img className="hero-planet" src="/img/space/saturn.jpg" alt="" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <img className="hero-figure" src="/img/hero-cutout.png" alt={profile.name} fetchPriority="high" />
        {/* eslint-enable @next/next/no-img-element */}
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-letterbox" aria-hidden="true" />

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
