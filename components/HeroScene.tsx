"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

/* Hero: full-bleed image, pinned. On scroll it pushes in (zoom) and the
   wordmark scatters, while the light page curtains UP over it — one image,
   a continuous handoff, no picture-swap. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-stage__title .hchar");
      if (reduce) return;

      gsap.from(chars, { yPercent: 120, opacity: 0, stagger: 0.04, duration: 0.95, ease: "power3.out", delay: 0.15 });
      gsap.from(".hero-stage__meta, .hero-stage__cue", { opacity: 0, y: 18, duration: 0.8, delay: 0.7, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=110%",
          scrub: 0.6,
          pin: ".hero-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".hero-stage__img img", { scale: 1.42, yPercent: -4, ease: "none" }, 0)
        .to(".hero-stage__veil", { opacity: 0.62, ease: "none" }, 0)
        .to(chars, {
          yPercent: () => gsap.utils.random(-240, -60),
          xPercent: () => gsap.utils.random(-120, 120),
          rotation: () => gsap.utils.random(-38, 38),
          opacity: 0,
          ease: "power1.in",
          stagger: { each: 0.02, from: "center" },
        }, 0)
        .to(".hero-stage__meta, .hero-stage__cue", { opacity: 0, y: -24, ease: "none", duration: 0.4 }, 0);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-stage__img hero-stage__layer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/hero.jpg"
            alt="Astronaut leaping through a field"
            fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}
          />
        </div>
        <div className="hero-stage__veil" aria-hidden="true" />
        <div className="hero-stage__mark">
          <h1 className="hero-stage__title" aria-label={profile.name}>
            {[...MARK].map((c, i) => (
              <span className="hchar" key={i}>{c}</span>
            ))}
          </h1>
          <div className="hero-stage__meta">
            <span>{profile.name}</span>
            <span className="hero-stage__sep">— founder · engineer · strategist</span>
          </div>
        </div>
        <div className="hero-stage__cue" aria-hidden="true"><span>scroll</span></div>
      </div>
    </section>
  );
}
