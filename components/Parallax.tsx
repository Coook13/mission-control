"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* -------------------------------------------------------------------------
   Multi-speed parallax — the danilodemarco-style "every layer at its own
   depth" feel. Mark any element with data-speed (1 = locked to scroll, >1
   drifts faster/up, <1 lags). One global controller caches each element's
   document-Y center ONCE (no per-frame layout reads = no thrash) and writes
   transform-only translateY on every Lenis scroll tick.

   Excluded: anything inside .hero-scene (it owns its own pinned timeline) and
   anything that already animates its own transform (images use ParallaxImg).
   Disabled entirely under reduced-motion or on touch / narrow viewports.
   ------------------------------------------------------------------------- */

const SCALE = 0.65; // drift intensity; keep subtle to avoid section gaps
const MAX = 150; // px clamp on either side

type Item = { speed: number; center: number; set: (v: number) => void };

export function ParallaxController() {
  const pathname = usePathname();
  const lenis = useLenis();
  const items = useRef<Item[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const enabled = !reduce && !coarse && window.innerWidth > 768;

    const update = () => {
      const vc = window.scrollY + window.innerHeight / 2;
      const list = items.current;
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        it.set(gsap.utils.clamp(-MAX, MAX, (it.center - vc) * (it.speed - 1) * SCALE));
      }
    };

    const build = () => {
      // reset any prior transforms before re-measuring
      items.current.forEach((it) => it.set(0));
      if (!enabled) {
        items.current = [];
        return;
      }
      const scrollY = window.scrollY;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]")).filter(
        (el) => !el.closest(".hero-scene")
      );
      items.current = els.map((el) => {
        const speed = parseFloat(el.getAttribute("data-speed") || "1") || 1;
        const rect = el.getBoundingClientRect();
        const set = gsap.quickSetter(el, "y", "px") as (v: number) => void;
        return { speed, center: rect.top + scrollY + rect.height / 2, set };
      });
      update();
    };

    // build after layout settles so getBoundingClientRect is accurate
    const raf = requestAnimationFrame(build);

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(build, 200);
    };
    window.addEventListener("resize", onResize);
    ScrollTrigger.addEventListener("refresh", build);

    const onScroll = () => update();
    lenis?.on("scroll", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.removeEventListener("refresh", build);
      lenis?.off("scroll", onScroll);
      items.current.forEach((it) => it.set(0));
      items.current = [];
    };
  }, [pathname, lenis]);

  return null;
}

/* Thin wrapper so JSX reads cleanly: <Parallax speed={1.12} className="…"> */
export function Parallax({
  speed = 1.1,
  as: Tag = "div",
  className,
  children,
}: {
  speed?: number;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag data-speed={speed} className={className}>
      {children}
    </Tag>
  );
}
