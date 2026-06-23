"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Scroll scenes for /story: facts resolve softly and the timeline spine draws.
   The portrait stays anchored in the editorial grid so the page scroll feels calm. */
export function StoryFX() {
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(".fact", {
      y: 22, opacity: 0, duration: 0.75, ease: "power2.out", stagger: 0.06,
      scrollTrigger: { trigger: ".facts", start: "top 82%" },
    });
    gsap.from(".fact__n", {
      scale: 0.9, transformOrigin: "left bottom", duration: 0.65, ease: "power2.out", stagger: 0.06,
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
      x: -10, opacity: 0, duration: 0.65, ease: "power2.out", stagger: 0.1,
      scrollTrigger: { trigger: ".timeline", start: "top 80%" },
    });
  });
  return null;
}
