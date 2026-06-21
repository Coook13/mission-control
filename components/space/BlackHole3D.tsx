"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import * as phase from "./phase";
import { enter } from "./phase";

/* engulfAt(p): a TIGHT bump in [0.14,0.18] (peak 0.16) — the dramatic threshold
   frame where the photon ring BLAZES past the lens edges, screen rimmed in cool-
   white light around a dark throat, the instant before the whip-past punches to
   warp. Group 1 owns this in phase.ts; if it hasn't landed yet we fall back to a
   local raised-cosine on the same window so the punch-through still choreographs.
   The window is deliberately the SAME as flashAt's punch (0.14–0.18) and inside
   shockAt's punch (0.135–0.185) so the rim blaze, the bloom blowout and the
   shockwave all fire on the same frame. Pure in p → scrubs + reverses. */
function engulfAt(p: number): number {
  const fn = (phase as Record<string, unknown>).engulfAt;
  if (typeof fn === "function") return (fn as (x: number) => number)(p);
  // fallback: raised-cosine bump, 0 at edges, 1 at centre, flat-ended.
  const lo = 0.14;
  const hi = 0.18;
  if (p <= lo || p >= hi) return 0;
  const u = (p - lo) / (hi - lo);
  return 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
}

/* The black hole as ONE in-scene 3D object — a billboarded disc mesh that lives
   dead ahead on the flight path and reads as the {O} of "W{O}RK" in the hero.
   Ported from HeroBlackHole's fullscreen-quad GLSL onto a real plane: bright
   event-horizon rim + photon ring + warm Doppler-bright accretion glow + a pure
   black core, additive over the starfield so the bloom pass lights only the rim.

   Everything that defines the JOURNEY is a pure function of scroll progress p
   (flightState.progress) via enter(p) from ./phase:
     - p < 0.10  HERO  — the disc sits dead ahead, framing the O. enter=0.
     - p 0.10–0.20 ENTER — the camera flies toward/through it: the disc's lead
       distance collapses to zero (the camera passes through the ring), it grows
       large in frame, the photon ring flares, then it whips past the camera.
       enter: 0 -> 1 (smoothstep, owned by phase.ts).
     - p > ~0.22 — fully behind the camera; faded out so it never re-enters the
       cruise. Because position/scale/opacity are pure in p, this scrubs AND
       reverses exactly — scroll back up and the camera flies back out through it.

   The disc billboards to the camera (copies its orientation) so the flat ring
   always faces us through the punch-through, regardless of how the Rig aims the
   camera. uTime drives only the cosmetic accretion rotation/shimmer; it does not
   touch the scrub, so reversibility is intact. */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Same ring/disc field as HeroBlackHole, lifted onto the plane's local uv
   (centred at 0.5). uEnter widens + brightens the flare during the punch-through
   so the camera "tears through" the photon ring rather than crossfading; uFade
   is the master pure-in-p opacity. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uEnter;  // 0..1 across the ENTER window (pure fn of p)
  uniform float uEngulf; // 0..1 TIGHT threshold bump (peak 0.16) — the rim blaze
  uniform float uFade;   // master opacity (pure fn of p)
  void main() {
    // The quad is oversized vs the disc (geometry is ~2.0×2.0, world scale
    // divided to compensate) so there is generous transparent margin around the
    // ring. p is scaled to span [-2.0,2.0]^2 → edge-midpoints sit at r=2.0 and
    // corners at r≈2.83, so the radial edge-fade below can fully reach 0 — in
    // EVERY direction, including the diagonals — well before any quad boundary.
    // This is what guarantees a clean CIRCLE at every scale (no box/clip).
    vec2 p = (vUv - 0.5) * 4.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = uTime * 0.25;

    // THRESHOLD ENGULF: at the punch-through frame the photon ring scales OUT so
    // its rim races toward — and past — the frame edges; the screen is rimmed in
    // cool-white light wrapped around a DARK CORE (the throat). We push the rim
    // radius outward (so the bright annulus expands past r≈1) and widen it, while
    // the core (below) is forced blacker so the centre stays a void as the rim
    // blazes. This is the dramatic threshold moment, gone in 1–2 frames.
    float r0 = 0.62 + uEnter * 0.05 + uEngulf * 0.95;   // rim races outward on engulf
    float rimW = 0.045 + uEnter * 0.05 + uEngulf * 0.16; // and broadens to a blaze
    float rim = exp(-pow((r - r0) / rimW, 2.0));
    float photon = exp(-pow((r - (r0 - 0.07)) / (0.016 + uEngulf * 0.05), 2.0)) * (0.85 + uEnter * 0.7 + uEngulf * 2.2);
    float glow = exp(-pow((r - r0) / (0.22 + uEnter * 0.12 + uEngulf * 0.30), 2.0));

    float side = 0.5 + 0.5 * cos(ang - t * 2.0);
    float dopp = 0.62 + 0.5 * side;                 // brighter approaching side
    float shim = 0.9 + 0.1 * sin(ang * 5.0 - t * 3.0);

    // Temperature contrast: the core stays white-hot, but the surrounding halo is
    // pushed COOLER toward #a9c6ff/#d6e6ff so the bloomed rim reads as cold
    // starlight against the warm accretion bias — real temperature, not grey.
    vec3 coolGlow = vec3(0.66, 0.78, 1.0);          // colder halo (#a9c6ff-ward)
    vec3 coolRim  = vec3(0.84, 0.90, 1.0);          // near-white cool rim (#d6e6ff)
    vec3 warm = vec3(1.0, 0.82, 0.58);              // warm accretion
    // rim/photon biased to the cool near-white; broad glow biased coldest.
    vec3 ringCol = mix(coolRim, warm, side * 0.42);
    vec3 glowCol = mix(coolGlow, warm, side * 0.30);

    // pure black inside; engulf DEEPENS + widens the throat so the centre is a
    // dark void even as the rim blazes past the lens (rim of light, dark core).
    float core = smoothstep(0.30 + uEngulf * 0.30, 0.52 + uEngulf * 0.46, r);
    // Resting brightness dialled DOWN modestly (the lighting was good, just a hair
    // blown out): base flare 1.0→0.82, rim/photon/glow multipliers trimmed ~12-15%.
    // The engulf terms are LEFT INTACT so the punch-through still BLAZES hard.
    float flare = 0.82 + uEnter * 1.3 + uEngulf * 3.2; // engulf BLAZES the rim hard
    float ringI = (rim * 1.55 + photon * 1.3) * dopp * shim;
    float glowI = glow * 0.42 * dopp;
    float intensity = (ringI + glowI) * core * flare;
    vec3 col = (ringCol * ringI + glowCol * glowI) * core * flare;
    // RADIAL edge-fade — the guarantee that the disc is a clean CIRCLE at every
    // scroll position + scale. p spans [-2,2]^2 (edges r=2.0, corners r≈2.83), so
    // we can fade the additive field to EXACTLY 0 by r≈1.45 — far inside every
    // quad boundary in every direction (edges AND diagonals) — and the glow tail
    // is already near-zero there, so there is no hard radial cutoff for the bloom
    // pass to amplify into a visible ring or box. During the ENGULF blaze the rim
    // is pushed outward (r0→~1.6) on purpose; we slide the fade window outward by
    // the same amount so the blaze can still race past the frame edges, while the
    // cutoff stays well inside the quad (no square ever appears). Pure in p.
    float fadeOut = 1.45 + uEngulf * 0.9;
    float fadeIn  = 1.05 + uEngulf * 0.9;
    float edgeFade = smoothstep(fadeOut, fadeIn, r);
    intensity *= edgeFade;
    col *= edgeFade;
    intensity *= uFade;
    col *= uFade;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

/* Pure-in-p master opacity: solid through the hero, holds through the punch,
   then fades right after pass-through so it never haunts the cruise. */
function fadeOfP(p: number): number {
  if (p <= 0.18) return 1;
  if (p >= 0.24) return 0;
  return 1 - (p - 0.18) / 0.06;
}

/* How far ahead of the camera the disc sits, in world units, as a pure fn of p.
   Anchoring to the camera (rather than a hard world-z) keeps the disc dead ahead
   regardless of how phase.ts tunes zOfP. enter(p) collapses the lead to ~0 so the
   camera literally reaches and passes through the ring across p 0.10–0.20. */
const LEAD_FAR = 30;  // resting distance ahead during the hero (frames the O)
const LEAD_NEAR = -6; // pushed just behind the camera once we've punched through

function leadOfP(p: number, e: number): number {
  // before ENTER, hold steady ahead; during/after, ease the lead toward/past 0
  const base = p < 0.1 ? LEAD_FAR : LEAD_FAR + (LEAD_NEAR - LEAD_FAR) * e;
  return base;
}

export function BlackHole3D() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnter: { value: 0 },
      uEngulf: { value: 0 },
      uFade: { value: 1 },
    }),
    []
  );
  // scratch vectors — allocation-free render loop
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;

    const p = flightState.progress; // progress = target (single source; no 2nd lerp)
    const e = enter(p);             // 0..1 across p∈[0.10,0.20], owned by phase.ts
    const eng = engulfAt(p);        // 0..1 tight threshold blaze (peak 0.16)
    const fade = fadeOfP(p);

    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uEnter.value = e;
    m.uniforms.uEngulf.value = eng;
    m.uniforms.uFade.value = fade;

    const cam = state.camera;

    // billboard: face the camera through the entire punch-through
    g.quaternion.copy(cam.quaternion);

    // sit `lead` units ahead of the camera along its view direction (pure in p),
    // so it's dead ahead in the hero and the camera flies through it on ENTER.
    cam.getWorldDirection(fwd);
    const lead = leadOfP(p, e);
    g.position.copy(cam.position).addScaledVector(fwd, lead);

    // grow in frame as we approach + punch through; pure fn of enter(p). The
    // perspective approach does most of the work; this adds the stylised swell.
    // The quad is 4.0× the unit plane (oversized so the radial edge-fade reaches
    // 0 well inside every boundary → clean circle), so the scale here is scaled
    // by 3.4/4.0 vs the old 3.4 quad to preserve the on-screen framing exactly.
    // The engulf term lifts the scale envelope HARD on the threshold frame so the
    // ring physically engulfs the lens (rim past the frame edges) before the
    // fade/whip-past punches to warp. Pure in p → reverses exactly.
    const s = (4.5 + e * 13 + eng * 34) * 0.85;
    g.scale.setScalar(s);

    // hide outright once faded so it can't catch the cruise (cheap + exact)
    g.visible = fade > 0.001;
  });

  return (
    <group ref={group}>
      <mesh frustumCulled={false}>
        {/* Oversized quad (4.0 vs unit) gives the additive glow generous
            transparent margin; the shader's radial edge-fade kills intensity to
            exactly 0 by r≈1.45 (relaxing outward only during the engulf blaze),
            far inside the quad edges (r=2.0) and corners (r≈2.83) in EVERY
            direction, so the disc reads as a clean CIRCLE at every scale. */}
        <planeGeometry args={[4.0, 4.0]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
