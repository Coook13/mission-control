"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* Faint cold nebula: a few large ADDITIVE billboards that always sit ahead of
   the camera (a distant backdrop). Additive over black only ADDS light, so the
   deep blacks can't be lifted to grey. Cold steel tint, drifting slowly.
   A radial alpha falloff fades each plane's edges to nothing so the rectangular
   billboard seam never shows. */
const PLANES = [
  { x: -34, y: 14, z: -40, s: 360, rot: 0.0, o: 0.11 },
  { x: 40, y: -12, z: -110, s: 560, rot: 1.1, o: 0.08 },
  { x: -10, y: 6, z: -180, s: 820, rot: 2.3, o: 0.05 },
];

/* Soft circular alpha mask (white centre → transparent edge). Generated once;
   used as alphaMap so additive contribution tapers smoothly at the plane edge. */
function makeRadialAlpha() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.6)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export function Nebula() {
  const group = useRef<THREE.Group>(null);
  const tex = useTexture("/img/space/nebula.jpg");
  const alpha = useMemo(() => makeRadialAlpha(), []);

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
            alphaMap={alpha}
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
