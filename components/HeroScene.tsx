"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/site-data";

const MARK = profile.nickname.toUpperCase(); // "MICKY"

/* Pinned, scroll-scrubbed hero. The image pushes in (zoom), the wordmark
   scatters and blows apart, the veil deepens — then it unpins into the story. */
export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chars = gsap.utils.toArray<HTMLElement>(".hero-stage__title .hchar");
      if (reduce) return;

      // intro: chars rise in, meta fades up
      gsap.from(chars, {
        yPercent: 120,
        opacity: 0,
        stagger: 0.035,
        duration: 0.95,
        ease: "power3.out",
        delay: 0.15,
      });
      gsap.from(".hero-stage__meta, .hero-stage__cue", {
        opacity: 0,
        y: 18,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out",
      });

      // scrubbed zoom-in scene
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=150%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
      tl.to(".hero-stage__img img", { scale: 1.55, ease: "none" }, 0)
        .to(".hero-stage__veil", { opacity: 0.85, ease: "none" }, 0)
        .to(
          chars,
          {
            yPercent: () => gsap.utils.random(-280, -70),
            xPercent: () => gsap.utils.random(-140, 140),
            rotation: () => gsap.utils.random(-45, 45),
            opacity: 0,
            ease: "power1.in",
            stagger: { each: 0.012, from: "center" },
          },
          0
        )
        .to(".hero-stage__meta, .hero-stage__cue", { opacity: 0, y: -30, ease: "none" }, 0);
    },
    { scope: root }
  );

  return (
    <section className="hero-scene" ref={root}>
      <div className="hero-stage">
        <div className="hero-stage__img">
          <Image
            src="/img/hero.jpg"
            alt="Astronaut leaping through a field"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
        </div>
        <div className="hero-stage__veil" aria-hidden="true" />
        <div className="hero-stage__mark">
          <h1 className="hero-stage__title" aria-label={profile.name}>
            {[...MARK].map((c, i) => (
              <span className="hchar" key={i}>
                {c}
              </span>
            ))}
          </h1>
          <div className="hero-stage__meta">
            <span>{profile.name}</span>
            <span className="hero-stage__sep">— founder · engineer · strategist</span>
          </div>
        </div>
        <div className="hero-stage__cue" aria-hidden="true">
          <span>scroll</span>
        </div>
      </div>
    </section>
  );
}
