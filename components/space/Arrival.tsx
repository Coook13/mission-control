"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { zOfP } from "./phase";

/* ARRIVAL — the destination payload. As the flight exits the climax warp and the
   camera enters the long arrival settle (p ≈ 0.86 → 1.00), a GRAND form takes
   shape dead-ahead and grows to fill the frame: the black-hole {O} RETURNING at
   massive scale. This is the structural callback to the hero — the same ring that
   framed the "W{O}RK" wordmark at the start re-forms, now colossal, so the journey
   rhymes (Group 1's wordmark {O} re-aligns over this returned hole at the finale).

   Built to match BlackHole3D EXACTLY in spirit: a billboarded disc plane carrying
   a bright event-horizon rim + a sharp photon ring + a soft accretion glow + a
   pure-black core, additive over the void so only the rim/ring blooms. Monochrome
   (the one cool accent on the cool side, a warm Doppler bias on the other), nothing
   grey, no full sphere, no raymarch — a stylised bloomed ring (anti-patterns #2/#5).

   PURE-IN-P (anti-pattern #10): every per-frame value — the lead distance ahead of
   the camera, the swell scale, the master opacity, and the ring/flare shaping — is
   a pure function of flightState.progress via arriveOfP(p). Nothing integrates
   state. Scroll forward and the hole forms and grows; scroll back up and it shrinks
   and dissolves back into the warp, identically. uTime drives only the cosmetic
   accretion shimmer; it never touches the scrub.

   It anchors a fixed lead AHEAD of the camera along the view axis (like BlackHole3D
   and SunFlare reference zOfP), so it is always dead-centre on the flight path
   regardless of how the Rig drifts/banks. Outside the arrival window the group is
   hidden (visible=false) → zero cost across the whole earlier flight. */

/* Arrival window. phase.ts spends p0.85–1.00 on the slow settle; we start the
   reveal a hair into that (after the climax warp has bloomed down, warpAt's climax
   window ends at 0.87) and grow it to fill frame by p1.0. Local to this file —
   phase.ts exports no arrival constant and must not be edited. */
const ARRIVE_LO = 0.86;
const ARRIVE_HI = 1.0;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};
/* smootherstep — flatter ends, matches phase.ts's heavy arrival decel feel so the
   hole's growth eases to a calm hold as the camera settles. */
const smootherstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* Single normalized arrival progress 0..1 across the window, eased. Drives lead,
   scale and reveal so they all move together and reverse together. */
function arriveOfP(p: number): number {
  if (p <= ARRIVE_LO) return 0;
  if (p >= ARRIVE_HI) return 1;
  return smootherstep((p - ARRIVE_LO) / (ARRIVE_HI - ARRIVE_LO));
}

/* Master opacity: fade up fast as the form emerges from the dissipating warp, then
   hold solid through the rest of the settle so the finale lands on a steady hole
   (the wordmark {O} re-aligns over it). Pure in p. */
function arrivalOpacity(p: number): number {
  if (p <= ARRIVE_LO || p >= ARRIVE_HI + 0.001) return 0;
  const u = (p - ARRIVE_LO) / (ARRIVE_HI - ARRIVE_LO);
  return smoothstep(u / 0.22); // 0→1 over the first ~22% of the window, then hold
}

/* How far ahead of the camera the returned hole sits. It starts deep ahead (a
   distant point emerging out of the warp) and the lead CLOSES as the camera glides
   in, so perspective does most of the "growing to fill the frame" — the same trick
   BlackHole3D uses on ENTER, run in reverse-direction (approach, never overtaken,
   so it holds dead-ahead and dominant at the finale). Pure in p. */
const LEAD_FAR = 200; // distant emergent point at the start of arrival
const LEAD_NEAR = 46; // close + colossal at the finale (still ahead — never passed)
function leadOfP(a: number): number {
  return LEAD_FAR + (LEAD_NEAR - LEAD_FAR) * a;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Same ring/disc field family as BlackHole3D, tuned grander: a wide soft glow, a
   broad event-horizon rim, and a tight bright photon ring, all dying to EXACTLY 0
   well inside the quad (radial edge-fade) so the additive falloff never paints a
   square — the disc reads as a clean CIRCLE at every scale. uArrive sharpens the
   photon ring + lifts the flare as the hole closes in for the climactic reveal. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uArrive;  // 0..1 across the arrival window (pure fn of p)
  uniform float uFade;    // master opacity (pure fn of p)
  void main() {
    // quad is oversized vs the disc; p spans [-1.7,1.7]^2 so corners (r≈2.4) sit
    // far outside the ring and the edge-fade reaches 0 before any quad edge.
    vec2 p = (vUv - 0.5) * 3.4;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = uTime * 0.2;

    // grand ring: a touch wider than the hero hole, photon ring tightens on arrive
    float r0 = 0.66 + uArrive * 0.04;
    float rimW = 0.06 + uArrive * 0.03;
    float rim = exp(-pow((r - r0) / rimW, 2.0));
    float photon = exp(-pow((r - (r0 - 0.08)) / 0.014, 2.0)) * (0.9 + uArrive * 0.9);
    float glow = exp(-pow((r - r0) / (0.30 + uArrive * 0.10), 2.0));

    // slow Doppler-bright side + faint shimmer (cosmetic; uTime only)
    float side = 0.5 + 0.5 * cos(ang - t * 1.6);
    float dopp = 0.66 + 0.5 * side;
    float shim = 0.92 + 0.08 * sin(ang * 4.0 - t * 2.4);

    vec3 cool = vec3(0.72, 0.84, 1.0);   // the one cool accent (#b8d6ff)
    vec3 warm = vec3(1.0, 0.86, 0.66);   // warm accretion bias on the bright side
    vec3 col = mix(cool, warm, side * 0.5);

    float core = smoothstep(0.30, 0.54, r);          // pure black inside the ring
    float flare = 1.0 + uArrive * 1.1;                // overall reveal gain
    float intensity = (rim * 1.7 + photon * 1.6 + glow * 0.55) * dopp * shim * core * flare;
    // radial edge-fade: kill intensity to exactly 0 across r∈[1.35,1.55], far
    // inside the quad edges (r≈1.7) → no box ever shows, even filling the frame.
    float edgeFade = smoothstep(1.55, 1.35, r);
    intensity *= edgeFade;
    intensity *= uFade;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col * intensity, a);
  }
`;

export function Arrival() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uArrive: { value: 0 }, uFade: { value: 0 } }),
    []
  );
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;

    const p = flightState.progress; // == target (single source; no 2nd lerp)
    const fade = arrivalOpacity(p);
    g.visible = fade > 0.001;
    if (!g.visible) return;

    const a = arriveOfP(p);
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uArrive.value = a;
    m.uniforms.uFade.value = fade;

    const cam = state.camera;
    // billboard so the flat ring always faces us as it fills the frame
    g.quaternion.copy(cam.quaternion);

    // sit `lead` units dead ahead along the view axis (pure in p) — the lead
    // closes as `a` rises so perspective grows it; the swell below adds the
    // stylised final bloom so it reads as colossal, not merely "near".
    cam.getWorldDirection(fwd);
    g.position.copy(cam.position).addScaledVector(fwd, leadOfP(a));

    // GRAND swell: large to begin with, far larger at the finale so it dominates
    // the frame. Combined with the closing lead, the {O} grows to fill the view.
    const s = 24 + a * 150;
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} visible={false}>
      <mesh frustumCulled={false}>
        {/* oversized quad (3.4 vs unit) → generous transparent margin for the
            additive glow; the shader's radial edge-fade keeps it a clean circle. */}
        <planeGeometry args={[3.4, 3.4]} />
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
