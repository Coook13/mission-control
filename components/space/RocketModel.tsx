"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { PrimitiveRocket } from "./PrimitiveRocket";

/* Places + animates the rocket. The visual (PrimitiveRocket now, a GLB later)
   is a nose-up child; this owns the world placement, pose, scale and fade. */
function setBaseOpacity(o: THREE.Object3D, factor: number) {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.Material & { opacity: number; userData: { base?: number } };
    if (!m) return;
    if (m.userData.base === undefined) m.userData.base = m.opacity;
    m.transparent = true;
    m.opacity = m.userData.base * factor;
  });
}

export function RocketModel() {
  const outer = useRef<THREE.Group>(null);

  useFrame((state) => {
    const o = outer.current;
    if (!o) return;
    const cam = state.camera;
    const t = state.clock.elapsedTime;
    const op = THREE.MathUtils.clamp((flightState.progress - 0.03) / 0.07, 0, 1);
    o.visible = op > 0.002;
    if (!o.visible) return;
    setBaseOpacity(o, op);
    o.position.set(
      cam.position.x + 0.7 + Math.sin(t * 0.5) * 0.16,
      cam.position.y - 3.5 + Math.sin(t * 0.9) * 0.13,
      cam.position.z - 12,
    );
    o.rotation.set(-Math.PI / 2 + 0.26, 0.6 + Math.sin(t * 0.3) * 0.05, Math.sin(t * 0.42) * 0.06);
  });

  return (
    <group ref={outer} scale={0.5} visible={false}>
      <PrimitiveRocket />
    </group>
  );
}
