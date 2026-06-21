"use client";

import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/* Cinematic post: bloom ONLY on the brightest star cores (high luminance
   threshold → blacks stay black), a soft vignette to keep the edges deep, and
   a whisper of grain. Order: bloom → vignette → grain. */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.62} radius={0.82} />
      <Vignette offset={0.3} darkness={0.62} eskil={false} />
      <Noise opacity={0.018} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
