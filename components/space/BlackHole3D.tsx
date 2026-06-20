"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { enter } from "./phase";

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
  uniform float uEnter; // 0..1 across the ENTER window (pure fn of p)
  uniform float uFade;  // master opacity (pure fn of p)
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = uTime * 0.25;

    // the ring blooms a touch wider + the photon ring sharpens as we punch in
    float r0 = 0.62 + uEnter * 0.05;
    float rimW = 0.045 + uEnter * 0.05;
    float rim = exp(-pow((r - r0) / rimW, 2.0));
    float photon = exp(-pow((r - (r0 - 0.07)) / 0.016, 2.0)) * (0.85 + uEnter * 0.7);
    float glow = exp(-pow((r - r0) / (0.22 + uEnter * 0.12), 2.0));

    float side = 0.5 + 0.5 * cos(ang - t * 2.0);
    float dopp = 0.62 + 0.5 * side;                 // brighter approaching side
    float shim = 0.9 + 0.1 * sin(ang * 5.0 - t * 3.0);

    vec3 cool = vec3(0.72, 0.84, 1.0);              // the one cool accent (#b8d6ff)
    vec3 warm = vec3(1.0, 0.83, 0.6);               // warm accretion
    vec3 col = mix(cool, warm, side * 0.55);

    float core = smoothstep(0.30, 0.52, r);         // pure black inside
    float flare = 1.0 + uEnter * 1.4;               // overall punch-through gain
    float intensity = (rim * 1.8 + photon * 1.5 + glow * 0.5) * dopp * shim * core * flare;
    intensity *= uFade;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col * intensity, a);
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
    () => ({ uTime: { value: 0 }, uEnter: { value: 0 }, uFade: { value: 1 } }),
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
    const fade = fadeOfP(p);

    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uEnter.value = e;
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
    const s = 9 + e * 26;
    g.scale.setScalar(s);

    // hide outright once faded so it can't catch the cruise (cheap + exact)
    g.visible = fade > 0.001;
  });

  return (
    <group ref={group}>
      <mesh frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
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
