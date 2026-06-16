"use client";

import { MotionConfig } from "framer-motion";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParallaxController } from "./Parallax";

/* Drive Lenis from gsap.ticker and keep ScrollTrigger in sync with the
   smoothed scroll position. One RAF loop, no fighting between libraries. */
function GsapLenisBridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    gsap.registerPlugin(ScrollTrigger);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { lenis?: unknown }).lenis = lenis;
    }
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
    };
  }, [lenis]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{ lerp: 0.08, smoothWheel: true, wheelMultiplier: 1, syncTouch: true, autoRaf: false }}
    >
      <GsapLenisBridge />
      <ParallaxController />
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  );
}
