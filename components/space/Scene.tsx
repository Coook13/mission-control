"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { flightState } from "./flightState";
import { mouseState, initMouseParallax } from "./mouseParallax";
import { Starfield } from "./Starfield";
import { Nebula } from "./Nebula";
import { Planets } from "./Planets";
import { RocketModel } from "./RocketModel";
import { Effects } from "./Effects";

const FLIGHT_Z = 600; // total forward travel over the scroll (past 5 planets)

function Rig() {
  useEffect(() => { initMouseParallax(); }, []);
  useFrame((state, dt) => {
    const f = flightState;
    f.progress += (f.target - f.progress) * Math.min(1, dt * 3.2);
    const p = f.progress;
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const m = mouseState;
    m.x += (m.tx - m.x) * Math.min(1, dt * 3);
    m.y += (m.ty - m.y) * Math.min(1, dt * 3);
    cam.position.z = 12 - p * FLIGHT_Z;
    cam.position.x = Math.sin(t * 0.09) * 1.6 + m.x * 0.9;
    cam.position.y = Math.cos(t * 0.07) * 1.1 - m.y * 0.6;
    cam.lookAt(Math.sin(t * 0.05) * 2 + m.x * 0.5, Math.cos(t * 0.04) * 1.2 - m.y * 0.4, cam.position.z - 60);
  });
  return null;
}

export default function Scene() {
  return (
    <Canvas
      flat
      camera={{ position: [0, 0, 12], fov: 62, near: 0.1, far: 900 }}
      dpr={[1, 1.75]}
      resize={{ debounce: { scroll: 0, resize: 120 } }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#02030a"]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[8, 5, 10]} intensity={1.5} color="#d2e2ff" />
      <directionalLight position={[-8, -3, -4]} intensity={0.62} color="#3c4d86" />
      <Suspense fallback={null}>
        <Nebula />
        <Planets />
      </Suspense>
      <Starfield />
      <RocketModel />
      <Rig />
      <Effects />
    </Canvas>
  );
}
