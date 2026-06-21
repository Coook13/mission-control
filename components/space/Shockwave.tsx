"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { shockAt } from "./phase";

/* SHOCKWAVE — the concussive impact. A single billboarded additive RING that
   blasts out from the {O} centre and races OUTWARD past the camera at the two
   impact moments (shockAt(p): the ENTER punch-through ~p0.16 and the climactic
   break ~p0.85). It is the kinetic punctuation the arc was missing: not a glow
   that dwells, but a wave that expands and is gone.

   Built to match BlackHole3D / Arrival EXACTLY in spirit — a billboarded disc
   plane carrying a single bright ring that dies to EXACTLY 0 well inside the quad
   (radial edge-fade), so the additive falloff never paints a square. Cold-white
   monochrome, additive over the void so only the ring blooms. No raymarch, no
   sphere (anti-patterns #2/#5). Built-in <shaderMaterial>, not drei extend.

   PURE-IN-P (anti-pattern #10): the master intensity is shockAt(p) and the wave's
   expansion phase is derived from the local position WITHIN each shock window
   (also pure in p) — so the ring expands as you scroll into the impact and
   collapses back as you scroll out, identically. uTime is unused for the scrub;
   nothing integrates state. Outside the two windows the group is hidden
   (visible=false) → zero cost across the whole rest of the flight. */

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/* Local 0..1 expansion phase for whichever shock window p sits in. Each window
   matches shockAt's: the ring's radius is small at the leading edge of the
   window and races to the rim at the trailing edge, so the wave visibly expands
   THROUGH the impact. Pure in p; returns -1 when outside both windows. */
function wavePhase(p: number): number {
  if (p > 0.135 && p < 0.185) return clamp01((p - 0.135) / (0.185 - 0.135));
  if (p > 0.825 && p < 0.875) return clamp01((p - 0.825) / (0.875 - 0.825));
  return -1;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* A single expanding RING. uPhase (0..1) drives the ring radius outward; the
   ring thins + brightens as it expands (a real shock front sharpens). The radial
   edge-fade kills intensity to EXACTLY 0 across r∈[1.35,1.55], far inside the
   quad edge (r≈1.7), so the front reads as a clean CIRCLE at every scale and no
   square ever shows even as it overruns the frame. uShock is the master pure-in-p
   intensity (shockAt). Monochrome cold-white. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uShock;  // 0..1 master intensity (pure fn of p)
  uniform float uPhase;  // 0..1 expansion phase within the active window
  void main() {
    vec2 q = (vUv - 0.5) * 3.4;     // same uv mapping family as BlackHole3D/Arrival
    float r = length(q);

    // ring radius races from near-centre out to the rim as the wave expands.
    float rad = mix(0.06, 1.25, uPhase);
    // the front THINS as it expands (sharper shock) but never vanishes.
    float w = mix(0.16, 0.05, uPhase);
    float ring = exp(-pow((r - rad) / w, 2.0));
    // a faint leading glow just ahead of the front for body (not a hard line).
    float glow = exp(-pow((r - rad) / (w * 2.6), 2.0)) * 0.35;

    // the wave brightens at mid-expansion then eases as it overruns the lens, so
    // the leading + trailing edges of the window don't pop a full-bright ring.
    float life = sin(uPhase * 3.14159265);   // 0→1→0 across the expansion
    vec3 col = vec3(0.84, 0.91, 1.0);          // cold-white accent, monochrome
    float intensity = (ring * 1.9 + glow) * uShock * life;

    // radial edge-fade → exactly 0 well inside the quad (clean circle, no box).
    float edgeFade = smoothstep(1.55, 1.35, r);
    intensity *= edgeFade;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col * intensity, a);
  }
`;

export function Shockwave() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uShock: { value: 0 }, uPhase: { value: 0 } }),
    []
  );
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;

    const p = flightState.progress; // == target (single source; no 2nd lerp)
    const s = shockAt(p);
    const phase = wavePhase(p);
    g.visible = s > 0.001 && phase >= 0;
    if (!g.visible) return;

    m.uniforms.uShock.value = s;
    m.uniforms.uPhase.value = phase;

    const cam = state.camera;
    // billboard so the flat ring always faces us as it overruns the frame
    g.quaternion.copy(cam.quaternion);

    // anchor the wave a short, FIXED lead ahead of the camera (it expands from
    // the {O} the camera is punching through / arriving at) so it always races
    // outward dead-centre on the flight path regardless of Rig drift/bank.
    cam.getWorldDirection(fwd);
    g.position.copy(cam.position).addScaledVector(fwd, 14);

    // scale grows with the expansion phase so the ring also physically races out
    // past the lens (perspective + radius both push it off-frame at full extent).
    const scale = 10 + phase * 46;
    g.scale.setScalar(scale);
  });

  return (
    <group ref={group} visible={false}>
      <mesh frustumCulled={false}>
        {/* oversized quad → transparent margin for the additive front; the
            shader's radial edge-fade keeps it a clean circle at any scale. */}
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
