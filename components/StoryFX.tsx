"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Scroll scenes for /story: facts pop in, timeline draws a growing spine with
   rows sliding in, portrait parallaxes. Targets DOM rendered by the page. */
export function StoryFX() {
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(".fact", {
      y: 48, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.07,
      scrollTrigger: { trigger: ".facts", start: "top 82%" },
    });
    gsap.from(".fact__n", {
      scale: 0.6, transformOrigin: "left bottom", duration: 0.9, ease: "back.out(1.6)", stagger: 0.07,
      scrollTrigger: { trigger: ".facts", start: "top 82%" },
    });

    const line = document.querySelector<HTMLElement>(".timeline__line");
    if (line) {
      gsap.from(line, {
        scaleY: 0, transformOrigin: "top", ease: "none",
        scrollTrigger: { trigger: ".timeline", start: "top 80%", end: "bottom 62%", scrub: true },
      });
    }
    gsap.from(".timeline__row", {
      x: -30, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".timeline", start: "top 80%" },
    });

    const frame = document.querySelector<HTMLElement>(".portrait__frame");
    if (frame) {
      gsap.to(frame, {
        yPercent: -12, ease: "none",
        scrollTrigger: { trigger: ".portrait", start: "top bottom", end: "bottom top", scrub: true },
      });
    }
  });
  return null;
}
