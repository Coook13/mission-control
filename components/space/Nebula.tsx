"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

/* Faint cold nebula: a few large ADDITIVE billboards that always sit ahead of
   the camera (a distant backdrop). Additive over black only ADDS light, so the
   deep blacks can't be lifted to grey. Cold steel tint, drifting slowly. */
const PLANES = [
  { x: -34, y: 14, z: -40, s: 360, rot: 0.0, o: 0.11 },
  { x: 40, y: -12, z: -110, s: 560, rot: 1.1, o: 0.08 },
  { x: -10, y: 6, z: -180, s: 820, rot: 2.3, o: 0.05 },
];

export function Nebula() {
  const group = useRef<THREE.Group>(null);
  const tex = useTexture("/img/space/nebula.jpg");

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // keep the nebula a fixed distance ahead of the camera → always a backdrop
    g.position.z = state.camera.position.z - 220;
    g.position.x = Math.sin(state.clock.elapsedTime * 0.02) * 5;
    g.position.y = Math.cos(state.clock.elapsedTime * 0.015) * 3;
  });

  return (
    <group ref={group}>
      {PLANES.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, 0, p.rot]}>
          <planeGeometry args={[p.s, p.s * 0.6]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={p.o}
            color="#5a6aa8"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
