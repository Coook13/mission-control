"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { HeroStarfield } from "./HeroStarfield";

/* PAGE-WIDE deep-space field. A single fixed, full-viewport canvas pinned
   BEHIND all content (z-index:-1) so the whole document — hero AND the
   editorial body below — sits on one continuous starfield over pure black.
   Same screen-space starfield as the hero (clip-space points, mouse-reactive,
   twinkle) so it MUST live inside a <Canvas>; bloom lifts only the brightest
   star cores and a whisper of vignette keeps the edges deep. This replaces the
   hero's own <HeroBackdrop/> — see pageEdits. */
export function PageBackdrop() {
  return (
    <Canvas
      flat
      aria-hidden="true"
      className="bhx-page-stars"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -1 }}
      camera={{ position: [0, 0, 1], fov: 50, near: 0.1, far: 10 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <HeroStarfield count={4200} />
      </Suspense>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={0.7} radius={0.7} />
        <Vignette offset={0.5} darkness={0.28} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
