"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Rocket } from "./Rocket";

const PLANETS = [
  { key: "engineering", label: "Engineering", desc: "AI · CFD · computer vision · robotics", img: "mars" },
  { key: "trading", label: "Trading", desc: "Systematic FX & quant strategies", img: "jupiter" },
  { key: "venture", label: "Venture", desc: "Founder — ventures built and shipped", img: "saturn" },
  { key: "strategy", label: "Strategy", desc: "Growth, go-to-market, positioning", img: "neptune" },
  { key: "research", label: "Research", desc: "NECTEC graphene · ISSDC NASA finalist", img: "earth" },
];

/* The journey: after the hero's empty galaxy, the rocket travels through deep
   space and five skill-planets approach one at a time, each with its label.
   One long pinned, scrubbed scene. */
export function SpaceJourney() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=" + PLANETS.length * 100 + "%",
          scrub: 0.8,
          pin: ".journey-stage",
          anticipatePin: 1,
        },
      });
      tl.to(".journey-stars", { yPercent: -14, ease: "none", duration: PLANETS.length }, 0);
      tl.to(".journey-rocket", { yPercent: -6, ease: "none", duration: PLANETS.length }, 0);

      PLANETS.forEach((_, i) => {
        const p = `.journey-planet[data-i="${i}"]`;
        const info = `.journey-info[data-i="${i}"]`;
        tl.fromTo(p, { opacity: 0, scale: 0.35, xPercent: -50, yPercent: -64 }, { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, ease: "power1.out", duration: 0.5 }, i)
          .fromTo(`${info} > *`, { opacity: 0, y: 34 }, { opacity: 1, y: 0, ease: "power2.out", stagger: 0.08, duration: 0.45 }, i + 0.18)
          .to(p, { opacity: 0, scale: 1.5, xPercent: -50, yPercent: -34, ease: "power1.in", duration: 0.42 }, i + 0.62)
          .to(`${info} > *`, { opacity: 0, y: -22, ease: "power1.in", duration: 0.3 }, i + 0.64);
      });
    },
    { scope: root }
  );

  return (
    <section className="journey" ref={root} aria-label="What I work on">
      <div className="journey-stage">
        <div className="journey-cosmos" aria-hidden="true" />
        {/* eslint-disable @next/next/no-img-element */}
        <img className="journey-stars" src="/img/space/deepfield.jpg" alt="" aria-hidden="true" />
        {PLANETS.map((p, i) => (
          <img key={p.key} className="journey-planet" data-i={i} src={`/img/space/${p.img}.jpg`} alt="" aria-hidden="true" />
        ))}
        {/* eslint-enable @next/next/no-img-element */}

        {PLANETS.map((p, i) => (
          <div key={p.key} className="journey-info" data-i={i}>
            <span className="journey-info__idx">{String(i + 1).padStart(2, "0")} / 05</span>
            <h2 className="journey-info__label">{p.label}</h2>
            <p className="journey-info__desc">{p.desc}</p>
          </div>
        ))}

        <div className="journey-rocket"><Rocket /></div>
        <div className="journey-grain" aria-hidden="true" />
        <div className="journey-vignette" aria-hidden="true" />
      </div>
    </section>
  );
}
