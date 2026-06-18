"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { SKILLS, type Skill } from "./skills";

/* A planet is invisible until the camera approaches it, fully opaque at its
   hero distance, then sweeps past. This keeps each beat focused on ONE planet
   instead of the whole line bunching at the vanishing point (the clump). */
const FADE_FAR = 150; // units ahead: beyond this → invisible
const FADE_NEAR = 100; // units ahead: within this → fully opaque
const GROW_NEAR = 18; // units ahead at which the approach-growth tops out

function Planet({ s }: { s: Skill }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useTexture(s.tex);

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y += dt * 0.04;
    // "units ahead" of the camera (camera looks toward -z, planet.z < cam.z)
    const ahead = state.camera.position.z - s.z;
    const op = THREE.MathUtils.clamp((FADE_FAR - ahead) / (FADE_FAR - FADE_NEAR), 0, 1);
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.opacity = op;
    m.visible = op > 0.002;
    // grow as we fly toward it (on top of natural perspective growth) so each
    // planet "rushes up" at its beat rather than just fading in
    const g = THREE.MathUtils.clamp((FADE_FAR - ahead) / (FADE_FAR - GROW_NEAR), 0, 1);
    m.scale.setScalar(0.92 + g * 0.18);
  });

  return (
    <mesh ref={ref} position={[s.x, s.y, s.z]} rotation={[0.2, 0, 0.1]} visible={false}>
      <sphereGeometry args={[s.radius, 64, 64]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={s.glow}
        roughness={1}
        metalness={0}
        toneMapped={false}
        transparent
        opacity={0}
        depthWrite
      />
    </mesh>
  );
}

/* Five textured planets along the flight path. Opaque (depth-writing) spheres
   → naturally occlude the additive starfield (no star-through-planet bleed).
   Lit by a cool key light in the scene; faint emissive keeps the dark side
   from going pure black. Each fades in on approach (see Planet). */
export function Planets() {
  return (
    <>
      {SKILLS.map((s) => (
        <Planet key={s.key} s={s} />
      ))}
    </>
  );
}
