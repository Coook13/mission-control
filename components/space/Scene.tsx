"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { flightState } from "./flightState";
import { zOfP, warp } from "./phase";
import { mouseState, initMouseParallax } from "./mouseParallax";
import { Starfield } from "./Starfield";
import { WarpStreaks } from "./WarpStreaks";
import { Effects } from "./Effects";

function Rig() {
  useEffect(() => { initMouseParallax(); }, []);
  useFrame((state, dt) => {
    const f = flightState;
    // Lenis already smooths the scroll; track it 1:1 (no second lerp) so the
    // flight feels tightly scroll-driven, not a ~1s laggy follow. Pure in p →
    // still scrubs/reverses cleanly.
    f.progress = f.target;
    f.warp = warp(f.progress);
    const p = f.progress;
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const m = mouseState;
    m.x += (m.tx - m.x) * Math.min(1, dt * 3);
    m.y += (m.ty - m.y) * Math.min(1, dt * 3);
    cam.position.z = zOfP(p);
    // gentle drift + mouse parallax. Amplitudes kept modest so each planet's
    // framing at its peak stays consistent regardless of scroll timing/phase.
    cam.position.x = Math.sin(t * 0.09) * 1.0 + m.x * 0.9;
    cam.position.y = Math.cos(t * 0.07) * 0.7 - m.y * 0.6;
    cam.lookAt(Math.sin(t * 0.05) * 1.1 + m.x * 0.5, Math.cos(t * 0.04) * 0.7 - m.y * 0.4, cam.position.z - 60);
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
      <Suspense fallback={null}>
        <Starfield />
        <WarpStreaks />
      </Suspense>
      <Rig />
      <Effects />
    </Canvas>
  );
}
