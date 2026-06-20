"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { HeroStarfield } from "./HeroStarfield";

/* Deep-space backdrop: a screen-space starfield (even dust across the WHOLE
   frame) over pure black, with bloom for glow and only a whisper of vignette so
   the field reads to the edges. Points are placed in clip space → camera
   irrelevant, fills the viewport top-to-bottom. */
export function HeroBackdrop() {
  return (
    <Canvas
      flat
      className="bhx-stars"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      camera={{ position: [0, 0, 1], fov: 50, near: 0.1, far: 10 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <HeroStarfield count={3600} />
      </Suspense>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={0.7} radius={0.7} />
        <Vignette offset={0.5} darkness={0.28} eskil={false} />
        <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  );
}
