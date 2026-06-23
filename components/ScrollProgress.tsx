"use client";

import { useEffect, useRef } from "react";
import { flightState } from "@/components/space/flightState";
import { BEATS, FINALE_START } from "@/components/space/phase";
import { SCENES } from "@/components/space/scenes";

const smooth = (a: number, b: number, x: number) => {
  const u = (x - a) / (b - a);
  const c = u < 0 ? 0 : u > 1 ? 1 : u;
  return c * c * (3 - 2 * c);
};

function activeChapter(p: number) {
  let active = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < BEATS.length; i++) {
    const distance = Math.abs(p - BEATS[i]);
    if (distance < best) {
      active = i;
      best = distance;
    }
  }
  return active;
}

/* Chapter map for the home fly-through. It only reads flightState.progress; the
   Lenis callback in Flythrough remains the single writer. */
export function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let lastChapter = -1;

    const draw = () => {
      const root = rootRef.current;
      if (root) {
        const p = flightState.progress;
        root.style.setProperty("--p", p.toFixed(4));

        const introVis = smooth(0.08, 0.18, p);
        const finaleFade = 1 - smooth(FINALE_START - 0.05, FINALE_START + 0.03, p);
        root.style.setProperty("--vis", (introVis * finaleFade).toFixed(3));

        const chapter = activeChapter(p);
        if (chapter !== lastChapter && chapterRef.current) {
          const scene = SCENES[chapter];
          chapterRef.current.textContent = `${scene.idx} / ${SCENES.length
            .toString()
            .padStart(2, "0")}  ${scene.label.toUpperCase()}`;
          root.dataset.active = String(chapter);
          lastChapter = chapter;
        }
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="scrollprog"
      ref={rootRef}
      aria-hidden="true"
      data-active="0"
      style={{ ["--p" as string]: 0, ["--vis" as string]: 0 }}
    >
      <span className="scrollprog__track">
        <span className="scrollprog__bar" />
        <span className="scrollprog__ticks">
          {BEATS.map((beat, i) => (
            <span
              className="scrollprog__tick"
              data-chapter={i}
              key={beat}
              style={{ ["--x" as string]: `${beat * 100}%` }}
            />
          ))}
        </span>
      </span>
      <span className="scrollprog__chapter">
        <span ref={chapterRef}>01 / 05  ENGINEERING</span>
      </span>
    </div>
  );
}
