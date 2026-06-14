"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"
// where the helmet visor sits in the cover-cropped hero — the portal origin
const ORIGIN_X = 62;
const ORIGIN_Y = 26;

/* Match-cut portal hero: scroll pushes into the helmet visor; a circle opens
   from that exact point and the eye emerges to fill the frame; then it
   releases into the story. The wordmark scatters early. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-stage__title .hchar");
      if (reduce) return;

      gsap.set(".hero-stage__astro img", { transformOrigin: `${ORIGIN_X}% ${ORIGIN_Y}%` });

      // intro
      gsap.from(chars, { yPercent: 120, opacity: 0, stagger: 0.04, duration: 0.95, ease: "power3.out", delay: 0.15 });
      gsap.from(".hero-stage__meta, .hero-stage__cue", { opacity: 0, y: 18, duration: 0.8, delay: 0.7, ease: "power2.out" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=220%",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1) wordmark scatters, gentle push toward the visor
      tl.to(chars, {
        yPercent: () => gsap.utils.random(-260, -60),
        xPercent: () => gsap.utils.random(-130, 130),
        rotation: () => gsap.utils.random(-40, 40),
        opacity: 0,
        ease: "power1.in",
        stagger: { each: 0.02, from: "center" },
      }, 0)
        .to(".hero-stage__meta, .hero-stage__cue", { opacity: 0, y: -24, ease: "none", duration: 0.4 }, 0)
        .to(".hero-stage__astro img", { scale: 1.7, ease: "power1.in", duration: 0.45 }, 0)
        // 2) deep zoom into the visor + fade, while the eye portal opens from the same point
        .to(".hero-stage__astro img", { scale: 8, ease: "power2.in", duration: 0.6 }, 0.4)
        .to(".hero-stage__astro", { opacity: 0, ease: "power2.in", duration: 0.35 }, 0.62)
        .fromTo(".hero-stage__eye", { "--r": "0%" }, { "--r": "165%", ease: "power2.out", duration: 0.55 }, 0.42)
        .fromTo(".hero-stage__eye img", { scale: 1.35 }, { scale: 1.0, ease: "power2.out", duration: 0.6 }, 0.42)
        // 3) settle
        .to(".hero-stage__eye img", { scale: 1.08, ease: "none", duration: 0.2 }, 0.85);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-stage__astro hero-stage__layer">
          <Image src="/img/hero.jpg" alt="Astronaut leaping through a field" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 35%" }} />
        </div>
        <div className="hero-stage__veil" aria-hidden="true" />
        <div
          className="hero-stage__eye hero-stage__layer"
          aria-hidden="true"
          style={{ ["--r" as string]: "0%", clipPath: `circle(var(--r) at ${ORIGIN_X}% ${ORIGIN_Y}%)` }}
        >
          <Image src="/img/eye.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "58% 42%" }} />
        </div>
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
