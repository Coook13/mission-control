"use client";

import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction, ChromaticAberrationEffect } from "postprocessing";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
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

       Built IMPERATIVELY (new ChromaticAberrationEffect + <primitive>) rather
       than via the <ChromaticAberration> JSX wrapper. That wrapper (wrapEffect)
       memoises on JSON.stringify(props) and re-pushes radialModulation/offset
       onto the live instance through r3f's prop pipeline; under Next 16 +
       React 19 that path stringifies an instance carrying r3f's circular
       __r3f.parent/children state → "Converting circular structure to JSON" →
       the Canvas loses its WebGL context. Constructing it ourselves sets every
       define/uniform in the ctor, so r3f only ADOPTS the finished object and
       never serialises or re-applies props. (Same pattern the lib uses for
       ColorAverage / DepthOfField.) The blendFunction default for an Effect is
       already NORMAL, but we set it explicitly to pin intent.

   Order: bloom → chromatic aberration → vignette → grain. */

// peak per-axis colour offset at full warp (UV space — sub-pixel, tasteful)
const WARP_CA = 0.0026;

export function Effects() {
  // the chromatic-aberration effect, owned here so we can mutate its offset
  // per-frame without rebuilding the React tree (allocation-free below)
  const ca = useMemo(() => {
    const e = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0, 0),
      radialModulation: true,
      modulationOffset: 0.4,
    });
    e.blendMode.blendFunction = BlendFunction.NORMAL;
    return e;
  }, []);

  // reused every frame; never reallocated
  const off = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame(() => {
    // pure in p: progress = target (single source of truth, no 2nd lerp)
    const w = warpAt(flightState.progress); // 0..1, spikes only mid-warp
    // diagonal smear, scaled by warp; squared so it ramps in late & snaps off
    const m = WARP_CA * w * w;
    off.set(m, m * 0.6);
    ca.offset = off;
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
      <primitive object={ca} dispose={null} />
      <Vignette offset={0.3} darkness={0.62} eskil={false} />
      <Noise opacity={0.018} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
