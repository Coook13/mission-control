"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { flightState } from "./flightState";
import { zOfP, driftXY, rollOfP } from "./phase";
import { mouseState, initMouseParallax } from "./mouseParallax";
import { Starfield } from "./Starfield";
import { BlackHole3D } from "./BlackHole3D";
import { WarpJump } from "./WarpJump";
import { Shockwave } from "./Shockwave"; // P2-B set-piece: concussive impact ring
import { DebrisField } from "./DebrisField";
import { SunFlare } from "./SunFlare"; // P2-B set-piece: distant additive sun pass
import { PlanetLimb } from "./PlanetLimb"; // scale anchor: colossal lit limb at a mid beat
import { MegaStructure } from "./MegaStructure"; // grandeur lever: frame-filling megastructure the camera threads past in the breathe gap
import { Arrival } from "./Arrival"; // finale payload: the {O} returns, massive, dead-ahead
import { Nebula } from "./Nebula";
import { Effects } from "./Effects";

/* The Rig is the camera. Single source of truth: flightState.progress is set
   equal to flightState.target every frame (Lenis already smooths the scroll —
   no SECOND lerp here, anti-pattern #8), so the whole fly-through is a pure
   function of scroll progress p and scrubs + reverses exactly (anti-pattern #10).

   Position + orientation come straight from the phase module:
     z   = zOfP(p)     — eased forward travel (decel onto beats, accel between)
     x,y = driftXY(p)  — gentle lateral S-curve drift
     roll = rollOfP(p) — camera BANK (rotation.z), leans into the drift / warp
   The only NON-p input is an optional, tiny pointer-parallax offset (disabled on
   touch / reduced-motion); it nudges the camera a fraction of a unit and never
   touches p, so it can't break the scrub.

   Order matters: lookAt() resets the camera basis (and zeroes roll) every frame,
   so the bank from rollOfP must be applied AFTER lookAt — we rotate the camera
   about its own forward axis by `roll`, which leaves the flight direction intact
   and only banks the horizon. */
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
    // bank: roll about the camera's own forward axis (pure in p). rotateZ acts
    // in local space, so it tilts the horizon without bending the flight path.
    cam.rotateZ(rollOfP(p));
  });

  return null;
}

/* The ONE <Canvas> for the entire experience (anti-pattern #7: never more than
   one). Flat (no tone-mapping — the star / black-hole / sun shaders push values
   >1 for the bloom themselves), dpr capped at 1.75 for perf, opaque pure-black
   clear. Children, back-to-front in spirit:
     Starfield   — the deep depth field the camera flies THROUGH (reverse-safe)
     Nebula      — faint cold ADDITIVE wisps far ahead (a backdrop, never grey)
     SunFlare    — a distant additive sun + streak pass for the escalation/climax
     DebrisField — instanced shards drifting past (reverse-safe like the stars)
     PlanetLimb  — colossal dark body's lit edge looming at a mid beat (scale anchor)
     MegaStructure — monstrous frame-filling silhouette the camera threads PAST in the breathe gap
     BlackHole3D — the {O} ring the hero centres on; the camera punches through it
     WarpJump    — light-speed streaks driven by warpAt(p), zero outside its windows
     Shockwave   — concussive additive ring blasting out on the punch + climax (shockAt)
     Arrival     — the {O} RETURNS, massive + dead-ahead, growing to fill the finale
     Effects     — bloom + warp-coupled chromatic aberration + vignette + grain
   Every child is a pure function of p, so the whole scene scrubs AND reverses. */
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
        {/* dark cold wisps far ahead — additive, can only add light to the void */}
        <Nebula />
        {/* distant additive sun + streak pass — the escalation/climax beat */}
        <SunFlare />
        {/* instanced shards drifting past, reverse-safe like the starfield */}
        <DebrisField />
        {/* SCALE ANCHOR — colossal dark body's lit limb looms at a mid beat */}
        <PlanetLimb />
        {/* GRANDEUR LEVER — monstrous megastructure; camera threads its gap in the breathe stretch (p~0.30–0.40) */}
        <MegaStructure />
        {/* the {O} ring — hero centres on it, camera punches through on ENTER */}
        <BlackHole3D />
        {/* light-speed streaks — intensity is warpAt(p), exactly 0 between windows */}
        <WarpJump />
        {/* concussive impact ring — blasts out on the punch + climax (shockAt) */}
        <Shockwave />
        {/* FINALE PAYLOAD — the {O} returns, massive, dead-ahead, fills the frame */}
        <Arrival />
      </Suspense>
      <Rig />
      <Effects />
    </Canvas>
  );
}
