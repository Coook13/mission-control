"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";

/* The hand-built rocket VISUAL — nose-up (+Y) around the local origin. The
   parent (RocketModel) owns placement / pose / scale / fade; this component
   owns only the geometry and its own flame (flicker + warp-stretch). Also the
   fallback rendered when the GLB fails to load. */
const FINS = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
const BODY = "#eaeef6";
const ACCENT = "#c0473b";
const DARK = "#252b39";

export function PrimitiveRocket() {
  const flame = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // flicker, plus a longer plume during warp
    const warp = flightState.warp;
    const f = 1 + Math.sin(t * 30) * 0.13 + Math.sin(t * 17.3) * 0.09 + warp * 1.6;
    if (flame.current) flame.current.scale.set(1, f, 1);
    if (flame2.current) flame2.current.scale.set(1, 0.8 + (f - 1) * 0.6, 1);
  });

  return (
    <group>
      {/* body — slim, elegant */}
      <mesh>
        <cylinderGeometry args={[0.4, 0.5, 3.8, 32]} />
        <meshStandardMaterial color={BODY} metalness={0.55} roughness={0.32} toneMapped={false} />
      </mesh>
      {/* nose cone — long + sharp */}
      <mesh position={[0, 2.65, 0]}>
        <coneGeometry args={[0.4, 1.5, 32]} />
        <meshStandardMaterial color={ACCENT} metalness={0.4} roughness={0.42} toneMapped={false} />
      </mesh>
      {/* upper accent band */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.505, 0.505, 0.24, 32]} />
        <meshStandardMaterial color={DARK} metalness={0.55} roughness={0.4} toneMapped={false} />
      </mesh>
      {/* porthole */}
      <mesh position={[0, 1.2, 0.44]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#0a1e38" emissive="#6fc0ff" emissiveIntensity={0.7} metalness={0.2} roughness={0.3} toneMapped={false} />
      </mesh>
      {/* fins */}
      {FINS.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.5, -1.65, Math.cos(a) * 0.5]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.06, 1.15, 0.78]} />
          <meshStandardMaterial color={ACCENT} metalness={0.4} roughness={0.42} toneMapped={false} />
        </mesh>
      ))}
      {/* nozzle */}
      <mesh position={[0, -2.1, 0]}>
        <cylinderGeometry args={[0.36, 0.26, 0.5, 24]} />
        <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.5} toneMapped={false} />
      </mesh>
      {/* flame — additive, points -Y (trails behind in the cruising pose) */}
      <mesh ref={flame} position={[0, -2.85, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 1.7, 24]} />
        <meshBasicMaterial color="#ff9a3c" transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flame2} position={[0, -2.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.17, 0.95, 20]} />
        <meshBasicMaterial color="#cfe9ff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
