"use client";

import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction, ChromaticAberrationEffect } from "postprocessing";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { warpAt } from "./phase";

/* Cinematic post — MONOCHROME, pure in p (anti-pattern #10/#11 safe).

   Static stack (always on):
     • Bloom — blooms ONLY the brightest cores (high luminance threshold →
       blacks stay black) so the star/black-hole/sun shaders that push >1 read
       as light, not a grey wash.
     • Vignette — keeps the frame edges deep so the field reads as a tunnel.
     • Noise (grain) — a whisper of film grain over OVERLAY (no colour, just
       luminance dither).

   Warp-coupled (zero at rest):
     • ChromaticAberration — its RGB offset is driven entirely by warpAt(p) and
       is EXACTLY (0,0) outside the two warp windows, so colour fringing only
       appears as the light-speed streaks rip past. radialModulation pushes the
       smear to the edges (centre stays crisp) → reads as speed, not a filter.
       Monochrome-safe: on a #000/#fff field the R/G/B sub-pixel split only
       resolves to faint cool/warm edges on the brightest streaks, never tints
       the blacks.

   Order: bloom → chromatic aberration → vignette → grain. */

// peak per-axis colour offset at full warp (UV space — sub-pixel, tasteful)
const WARP_CA = 0.0026;

export function Effects() {
  // hold the underlying effect so we can mutate its offset per-frame without
  // rebuilding the React tree (allocation-free; the Vector2 is reused)
  const ca = useRef<ChromaticAberrationEffect>(null);
  const off = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame(() => {
    const e = ca.current;
    if (!e) return;
    // pure in p: progress = target (single source of truth, no 2nd lerp)
    const w = warpAt(flightState.progress); // 0..1, spikes only mid-warp
    // diagonal smear, scaled by warp; squared so it ramps in late & snaps off
    const m = WARP_CA * w * w;
    off.set(m, m * 0.6);
    e.offset = off;
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.9}
        luminanceSmoothing={0.25}
        intensity={0.62}
        radius={0.82}
      />
      <ChromaticAberration
        ref={ca}
        blendFunction={BlendFunction.NORMAL}
        offset={off}
        radialModulation
        modulationOffset={0.4}
      />
      <Vignette offset={0.3} darkness={0.62} eskil={false} />
      <Noise opacity={0.018} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
