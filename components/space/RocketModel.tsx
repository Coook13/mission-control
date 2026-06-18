"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { rocketLead, rocketPath } from "./phase";
import { PrimitiveRocket } from "./PrimitiveRocket";

/* Places + animates the rocket in WORLD space (decoupled from the camera in z),
   driven purely by flightState.progress. It starts behind the camera, swooshes
   past during the warp-in, then LEADS the journey from a low foreground spot
   (a small ship we follow toward each giant planet), and finally races ahead
   into the warp-out. The visual (PrimitiveRocket now, a GLB later) is a nose-up
   child; this owns placement / pose / scale / fade. */
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
    const p = flightState.progress;
    const lead = rocketLead(p);
    // fade in as it flies in from behind (lead 25 → 5); the physical fly-in is
    // the real anti-pop, the fade just softens the entry edge
    const op = THREE.MathUtils.clamp((25 - lead) / 20, 0, 1);
    o.visible = op > 0.002;
    if (!o.visible) return;
    setBaseOpacity(o, op);

    const [px, py] = rocketPath(p);
    const drift = Math.sin(t * 0.6) * 1.6; // gentle lateral life
    o.position.set(
      cam.position.x + px + drift,
      cam.position.y + py + Math.sin(t * 0.9) * 0.3,
      cam.position.z + lead,
    );

    // banking from lateral velocity (sampled, clamped)
    const pxPrev = rocketPath(Math.max(0, p - 0.01))[0];
    const bank = THREE.MathUtils.clamp((px - pxPrev) * 12 + Math.cos(t * 0.6) * 0.12, -0.5, 0.5);
    // nose toward -z (flying away/ahead); pitched down so we look onto its back,
    // a 3/4 yaw, and a banking roll
    o.rotation.set(
      -Math.PI / 2 - 0.16,
      0.42 + bank * 0.6 + Math.sin(t * 0.3) * 0.04,
      -bank + Math.sin(t * 0.5) * 0.05,
    );
  });

  return (
    <group ref={outer} scale={0.66} visible={false}>
      <PrimitiveRocket />
    </group>
  );
}
