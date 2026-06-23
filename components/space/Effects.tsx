"use client";

import { EffectComposer } from "@react-three/postprocessing";
import {
  BlendFunction,
  ChromaticAberrationEffect,
  BloomEffect,
  VignetteEffect,
  NoiseEffect,
} from "postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { warpAt, flashAt } from "./phase";

/* Cinematic post — MONOCHROME, pure in p (anti-pattern #10/#11 safe).

   Static stack (always on):
     • Bloom — blooms ONLY the brightest cores (high luminance threshold →
       blacks stay black) so the star/black-hole/sun shaders that push >1 read
       as light, not a grey wash. Its INTENSITY is driven per-frame from a pure-
       in-p envelope (see bloomOfP): it SPIKES on flashAt(p) for 1–2 frames of
       genuine over-bright RELEASE at the punch + the climax break, and DUCKS on
       the quiet HOLD windows (when no set-piece/flash is active) for Interstellar
       restraint — widening the dynamic range so the impacts actually read as
       impacts. Pure in p → scrubs + reverses.
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

   ALL effects here are built IMPERATIVELY (new …Effect() in useMemo + adopted
   via <primitive>), NOT via the @react-three/postprocessing JSX wrappers
   (<Bloom>/<Vignette>/<Noise>/<ChromaticAberration>). Every one of those
   wrappers goes through wrapEffect, which memoises the effect on
   JSON.stringify(props) and re-pushes props onto the live instance through
   r3f's prop pipeline. Under Next 16 + React 19 the props bag carries r3f's
   circular __r3f.parent/children graph, so JSON.stringify(props) throws
   "Converting circular structure to JSON" during the EffectComposer commit and
   tears down the WebGL Canvas. Constructing each effect ourselves sets every
   define/uniform in the ctor, so r3f only ADOPTS the finished object and never
   serialises or re-applies props. (Same pattern the lib uses for
   ColorAverage / DepthOfField.) The blendFunction default for an Effect is
   already NORMAL, but we set CA's explicitly to pin intent.

   Order: bloom → chromatic aberration → vignette → grain. */

// peak per-axis colour offset at full warp (UV space — sub-pixel, tasteful)
const WARP_CA = 0.0026;

/* Bloom intensity envelope, pure in p. Three regimes, all blended continuously:
   - BASE     the working intensity through the cruise/beats (0.54, trimmed from
     0.62 so the black-hole/sun glow reads as light, not a blown-out wash).
   - DUCK     on the quiet HOLD windows (no warp, no flash) lean DOWN toward 0.44
     for Interstellar restraint — blacks deepen, the field calms.
   - SPIKE    on flashAt(p) lift toward ~0.92 for a frame or two of genuine
     over-bright RELEASE on the punch + climax break. Dropped from 1.25 so the
     punch-into-light reads as over-bright RELEASE WITHOUT flooding the frame —
     paired with the tamed warpAt crest (climax now caps at 0.9, crest 0.18), the
     two together keep the climax a blinding CREST with the edges still visible
     rather than a full white-out.
   The duck only applies where neither warp NOR flash is active, so it can never
   fight the spike. Pure fn of p → scrubs + reverses with everything else. */
const BLOOM_BASE = 0.54;
const BLOOM_DUCK = 0.44;
const BLOOM_SPIKE = 0.92;
function bloomOfP(p: number): number {
  const f = flashAt(p); // 0..1 tight blowout on the two impacts
  const w = warpAt(p); // 0..1 in the two warp windows (suppresses the duck)
  // quiet = how "at rest" we are: 1 when no warp/flash, 0 when either is hot.
  const quiet = 1 - Math.min(1, w + f);
  // base ducks toward DUCK on the quiet holds, then the flash spike rides on top
  const rest = BLOOM_BASE + (BLOOM_DUCK - BLOOM_BASE) * quiet;
  return rest + (BLOOM_SPIKE - rest) * f;
}

export function Effects() {
  const gl = useThree((state) => state.gl);
  const canRunPost = gl.getContext().getContextAttributes() !== null;

  // the Bloom effect instance — owned in useMemo so we can mutate its intensity
  // per-frame (allocation-free) from the pure-in-p envelope above.
  const bloom = useMemo(
    () =>
      new BloomEffect({
        mipmapBlur: true,
        // threshold lifted 0.9→0.92 so only the very brightest cores bloom — the
        // black-hole rim/sun read as light, not a blown-out wash; blacks stay black.
        luminanceThreshold: 0.92,
        luminanceSmoothing: 0.25,
        intensity: BLOOM_BASE,
        radius: 0.78,
      }),
    [],
  );

  // edge-darkening vignette → the field reads as a tunnel
  const vignette = useMemo(
    () => new VignetteEffect({ offset: 0.3, darkness: 0.62 }),
    [],
  );

  // a whisper of film grain over OVERLAY (luminance dither, no colour)
  const noise = useMemo(() => {
    const n = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY });
    n.blendMode.opacity.value = 0.018;
    return n;
  }, []);

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
    const p = flightState.progress;
    const w = warpAt(p); // 0..1, spikes only mid-warp
    // diagonal smear, scaled by warp; squared so it ramps in late & snaps off
    const m = WARP_CA * w * w;
    off.set(m, m * 0.6);
    ca.offset = off;

    // bloom intensity rides the pure-in-p envelope: spike on the flash impacts,
    // duck on the quiet holds. Mutating the live instance is allocation-free and
    // never re-renders the React tree (same pattern as the CA offset above).
    bloom.intensity = bloomOfP(p);
  });

  if (!canRunPost) return null;

  return (
    <EffectComposer multisampling={0}>
      <primitive object={bloom} dispose={null} />
      <primitive object={ca} dispose={null} />
      <primitive object={vignette} dispose={null} />
      <primitive object={noise} dispose={null} />
    </EffectComposer>
  );
}
