"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

/* Hero: an empty, vast, mysterious galaxy — Interstellar / Project Hail Mary.
   A deep field of galaxies recedes into black with a faint dust layer drifting
   nearer (parallax depth). On scroll you travel slowly forward into the deep,
   the name lifts away, the dark closes in. The figure lives in the rocket
   journey, not floating here. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-title .hchar");
      if (reduce) return;

      gsap.from(chars, { yPercent: 110, opacity: 0, stagger: 0.05, duration: 1, ease: "power3.out", delay: 0.3 });
      gsap.from(".hero-meta, .hero-cue", { opacity: 0, y: 16, duration: 0.9, delay: 0.9, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=170%",
          scrub: 0.9,
          pin: ".hero-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".hero-field", { scale: 1.16, ease: "none" }, 0)
        .to(".hero-dust", { scale: 1.42, xPercent: -5, ease: "none" }, 0)
        .to(".hero-deepen", { opacity: 0.78, ease: "none" }, 0)
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
        <img className="hero-field" src="/img/space/deepfield.jpg" alt="" aria-hidden="true" />
        <img className="hero-dust" src="/img/space/nebula.jpg" alt="" aria-hidden="true" />
        {/* eslint-enable @next/next/no-img-element */}
        <div className="hero-grade" aria-hidden="true" />
        <div className="hero-deepen" aria-hidden="true" />
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
