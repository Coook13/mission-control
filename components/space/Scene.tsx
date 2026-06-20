"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { flightState } from "./flightState";
import { zOfP, driftXY } from "./phase";
import { mouseState, initMouseParallax } from "./mouseParallax";
import { Starfield } from "./Starfield";
import { BlackHole3D } from "./BlackHole3D";
import { Effects } from "./Effects";

/* The Rig is the camera. Single source of truth: flightState.progress is set
   equal to flightState.target every frame (Lenis already smooths the scroll —
   no SECOND lerp here), so the whole fly-through is a pure function of scroll
   progress p and scrubs + reverses exactly.

   Position comes straight from the phase module:
     z = zOfP(p)        — eased forward travel (decel onto beats, accel between)
     x,y = driftXY(p)   — gentle lateral S-curve drift
   The only NON-p input is an optional, tiny pointer-parallax offset (disabled on
   touch / reduced-motion); it nudges the camera a fraction of a unit and never
   touches p, so it can't break the scrub. lookAt aims slightly AHEAD down the
   same drift line → the motion always reads as flying forward through the field
   and toward the black-hole O. */
function Rig() {
  useEffect(() => {
    initMouseParallax();
  }, []);

  useFrame((_state, dt) => {
    const f = flightState;
    f.progress = f.target; // no second lerp — Lenis is the only smoother
    const p = f.progress;

    const cam = _state.camera;
    const [dx, dy] = driftXY(p);

    // smooth the pointer parallax toward its target, frame-rate independent
    const m = mouseState;
    const k = Math.min(1, dt * 3);
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    const px = m.x * 0.9; // sub-unit nudges only
    const py = -m.y * 0.6;

    cam.position.set(dx + px, dy + py, zOfP(p));
    // look down the flight axis, biased to the same drift a little further out,
    // so the horizon glides with the camera instead of snapping side to side
    cam.lookAt(dx + px * 0.5, dy + py * 0.5, cam.position.z - 60);
  });

  return null;
}

/* The ONE <Canvas> for the entire experience (anti-pattern #7: never more than
   one). Flat (no tone-mapping — the star/black-hole shaders push values >1 for
   the bloom themselves), dpr capped at 1.75 for perf, opaque pure-black clear.
   Children: the depth Starfield the camera flies through, the in-scene
   BlackHole3D ring, and the bloom/vignette/grain post stack. */
export default function Scene() {
  return (
    <Canvas
      flat
      camera={{ position: [0, 0, 12], fov: 62, near: 0.1, far: 1600 }}
      dpr={[1, 1.75]}
      resize={{ debounce: { scroll: 0, resize: 120 } }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        {/* rich, deep field the camera travels THROUGH (recycles behind cam) */}
        <Starfield count={9000} spread={200} depth={420} />
        <BlackHole3D />
      </Suspense>
      <Rig />
      <Effects />
    </Canvas>
  );
}
