"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { flightState } from "./flightState";
import { Starfield } from "./Starfield";

const FLIGHT_Z = 320; // total forward travel over the scroll

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
      resize={{ debounce: { scroll: 0, resize: 120 } }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#02030a"]} />
      <Starfield />
      <Rig />
    </Canvas>
  );
}
