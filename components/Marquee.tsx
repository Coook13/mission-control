"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

/* Infinite horizontal band. Drifts at a base speed and accelerates / shifts
   with scroll velocity (Lenis). Reduced-motion → static. */
export function Marquee({
  items,
  outline = false,
  base = 46,
}: {
  items: string[];
  outline?: boolean;
  base?: number;
  /** legacy, ignored */
  duration?: number;
}) {
  const line = items.join("  ·  ") + "  ·  ";
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const vel = useRef(0);
  const half = useRef(1);

  useLenis((lenis) => {
    vel.current = lenis.velocity;
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const measure = () => {
      half.current = track.scrollWidth / 2 || 1;
    };
    measure();
    window.addEventListener("resize", measure);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      x.current -= (base + vel.current * 6) * dt;
      const h = half.current;
      if (x.current <= -h) x.current += h;
      if (x.current > 0) x.current -= h;
      track.style.transform = `translate3d(${x.current}px,0,0)`;
      vel.current *= 0.9;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [base]);

  return (
    <div className={`marquee ${outline ? "marquee--outline" : ""}`} aria-hidden="true">
      <div className="marquee__track marquee__track--js" ref={trackRef}>
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
