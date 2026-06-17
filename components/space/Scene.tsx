"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";

const FLIGHT_Z = 320; // total forward travel over the scroll

/* deterministic PRNG — stable star positions, and pure (no Math.random in render) */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A layer of stars filling a long box ahead of the camera. As the camera flies
   forward, stars that fall behind are recycled to the far end → an endless
   field. sizeAttenuation gives near-big / far-small depth. */
function StarLayer({ count, spread, depth, size, color, opacity }: {
  count: number; spread: number; depth: number; size: number; color: string; opacity: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = mulberry32(count * 2654435761);
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (rand() - 0.5) * spread;
      a[i * 3 + 1] = (rand() - 0.5) * spread * 0.62;
      a[i * 3 + 2] = 12 - rand() * depth;
    }
    return a;
  }, [count, spread, depth]);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const camZ = state.camera.position.z;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 2; i < arr.length; i += 3) {
      if (arr[i] > camZ + 8) arr[i] -= depth;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rig() {
  useFrame((state, dt) => {
    const f = flightState;
    f.progress += (f.target - f.progress) * Math.min(1, dt * 3.2);
    const p = f.progress;
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    cam.position.z = 12 - p * FLIGHT_Z;
    cam.position.x = Math.sin(t * 0.09) * 1.6;
    cam.position.y = Math.cos(t * 0.07) * 1.1;
    cam.lookAt(Math.sin(t * 0.05) * 2, Math.cos(t * 0.04) * 1.2, cam.position.z - 60);
  });
  return null;
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 62, near: 0.1, far: 700 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 220, 360]} />
      <StarLayer count={5000} spread={170} depth={340} size={0.5} color="#aebbe0" opacity={0.9} />
      <StarLayer count={1200} spread={150} depth={340} size={1.05} color="#ffffff" opacity={1} />
      <StarLayer count={900} spread={180} depth={340} size={0.34} color="#8a93b8" opacity={0.7} />
      <Rig />
    </Canvas>
  );
}
