"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { zOfP } from "./phase";

/* SUN FLARE — a distant additive WHITE sun the camera sweeps past in one late
   p-window, with an anamorphic horizontal streak and a couple of lens-flare
   ghosts. Monochrome (pure white, the locked accent only on its faint halo),
   additive over black so it only ADDS light and the bloom pass lights the core.
   Procedural deep-space only — no photo wallpaper (anti-pattern #4), no
   film-grade raymarch (anti-pattern #5); just a stylised bloomed disc + streak.

   Pure-in-p + reverse-safe (anti-pattern #10): the sun lives at a FIXED world
   position (off to one side, deep along the flight axis). The camera's z is a
   pure function of p (zOfP), so the sun naturally rises into frame, blazes as
   the camera draws level, and falls behind — purely from the camera geometry,
   no animation state. A master opacity window (SUN_LO..SUN_HI) gates the whole
   group so it only costs anything in its window and can't haunt the rest of the
   cruise. uTime drives only a faint corona shimmer; it never touches the scrub.

   The group BILLBOARDS to the camera so the flat sprites always face us. The
   anamorphic streak and ghosts are children offset in the group's local screen
   plane, so they track the sun the way a real lens flare does. */

/* Late-cruise window pulled into the GAP between beats 3 (0.66) and 4 (0.78):
   the blaze now PEAKS at ~0.71 and is fully faded by ~0.74 — before beat 4's
   FlowPanel reaches HOLD (0.76–0.80) — so the flare crests in the dark stretch
   and clears the frame before content lands, instead of washing out a panel. */
const SUN_LO = 0.6;
const SUN_HI = 0.74;
const SUN_PEAK = 0.71; // p where the camera is level with the sun (max blaze)

/* World position of the sun. The camera flies from camZ≈-888 (SUN_LO) toward
   camZ≈-1164 (SUN_HI) down -z; we plant the sun a fixed ~140u AHEAD of the peak
   camera z and slightly off the upper-left axis, so across the window it reads
   as a distant point that grows, BLAZES as the camera draws level, then sweeps
   to the side and behind as the camera overtakes it — a real fly-PAST, not a
   crossfade. Lateral offset ≈ tan(12°)·lead keeps it inside the fov at peak (it
   would shoot off-screen if placed far off-axis but only a little ahead). */
const SUN_LEAD = 52; // world units the sun sits ahead of the peak camera z —
// closer than before so the body LOOMS large and sweeps fast (blinding flyby)
const SUN_OFFSET_X = -22; // upper-left bias so it sweeps hard across frame, not dead-centre
const SUN_OFFSET_Y = 12;
const SUN_Z = zOfP(SUN_PEAK) - SUN_LEAD; // fixed world z, ahead of the peak

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* Master opacity window: fade up, hold across the blaze, fade out. Pure in p. */
function sunOpacity(p: number): number {
  if (p <= SUN_LO || p >= SUN_HI) return 0;
  const u = (p - SUN_LO) / (SUN_HI - SUN_LO);
  const up = smoothstep(u / 0.25);
  const down = 1 - smoothstep((u - 0.75) / 0.25);
  return up * down;
}

/* CREST envelope — the EVENT. A sharp raised-cosine bump peaking at the window
   centre (the moment the camera crests the sun): 0 at the edges, 1 mid, flat
   ends. Fed to the shaders as uCrest to spike the core intensity (the blaze
   over-bloom that flares past the frame edges) and to WIDEN the anamorphic
   streak as the camera sweeps level. Pure in p → scrubs and reverses exactly;
   uTime never touches this. The exponent sharpens the peak so the blaze is a
   transient SWEEP, not a constant bar. */
function sunCrest(p: number): number {
  if (p <= SUN_LO || p >= SUN_HI) return 0;
  const u = (p - SUN_LO) / (SUN_HI - SUN_LO); // 0..1 across the window
  const bump = 0.5 - 0.5 * Math.cos(u * Math.PI * 2); // 0→1→0, flat ends
  return bump * bump; // sharpen → a fast crest at the level-pass, not a plateau
}

/* Radial sun-core shader: blazing white centre → faint cool halo → 0, with a
   slow corona shimmer. Built-in <shaderMaterial>, matches the project style. */
const coreVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const coreFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uCrest;
  uniform vec3 uHalo;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    // blazing core pushed hard >1 so it blooms HARD; at the CREST it over-bloows:
    // the core radius widens and its peak intensity spikes so the white blaze
    // flares OUTWARD past the frame edges as the camera draws level, then relaxes.
    // Intensity dialled DOWN AGAIN so the Strategy (beat 04) WHITE text stays fully
    // legible while the sun still reads as a restrained distant flare: core peak
    // 3.0→1.8 (+4.2→+2.5 crest, ~-40%), halo 0.62→0.37 (~-40%). It blooms and
    // looms faintly, but no longer competes with the beat text.
    float coreR = 0.20 + 0.18 * uCrest;       // blaze swells at the crest (tightened)
    // Intensity cut HARD again (core 1.8→0.55, crest 2.5→0.65; halo 0.37→0.14,
    // ~-65%): user wants deep dark space, no bright sun in-frame. It now reads as
    // a faint distant glow that never washes the Strategy/Venture transition.
    float core = exp(-pow(r / coreR, 2.0)) * (0.55 + 0.65 * uCrest);
    float halo = exp(-pow(r / 0.66, 2.0)) * 0.14;
    // faint shimmering corona rays (cosmetic; uTime only — never touches p)
    float rays = (0.85 + 0.15 * sin(ang * 12.0 + uTime * 0.6)) ;
    float intensity = (core + halo * rays);
    // die to 0 inside the quad so no square edge ever shows; at the crest the
    // cutoff relaxes outward so the blaze can reach the frame edges (still inside
    // the quad → no hard square ever appears).
    float edge = mix(0.7, 0.92, uCrest);
    intensity *= smoothstep(1.0, edge, r);
    intensity *= uOpacity;
    // COLD STARLIGHT — NO warm tint. The over-bright core is PURE WHITE (#fff) so
    // the bloom pass reads it as cold blinding light; the surrounding halo carries
    // the locked cool accent (uHalo, #a9c6ff). The warmest pixel in the whole
    // sprite is therefore pure white — nothing drifts warm.
    vec3 col = vec3(1.0) * core + uHalo * halo * rays; // pure-white core, cool halo
    gl_FragColor = vec4(col * uOpacity, clamp(intensity, 0.0, 1.0));
  }
`;

/* Anamorphic streak shader: a wide thin horizontal bar of light through the sun
   — the classic lens-flare blue-white smear. Soft Gaussian falloff both axes. */
const streakFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uOpacity;
  uniform float uCrest;
  uniform vec3 uColor;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    // tight on y (thin bar), broad on x (long smear). A hotter narrow spine sits
    // inside a softer wide flare so the streak both blooms bright AND reaches
    // far across the frame — the anamorphic light-speed smear. At the CREST the
    // smear WIDENS (x-falloff broadens) and brightens, so the streak SWEEPS out
    // across the frame as the camera crests the sun, then snaps back thin.
    float xWide = 0.85 + 0.8 * uCrest; // smear reaches farther at the crest
    float spine = exp(-pow(p.y / 0.045, 2.0)) * exp(-pow(p.x / xWide, 2.0));
    float wide  = exp(-pow(p.y / 0.11, 2.0)) * exp(-pow(p.x / (xWide * 0.74), 2.0));
    // streak amplitude trimmed AGAIN (spine 1.05→0.68, wide 0.46→0.30, ~-35%)
    // so the anamorphic smear reads as a faint lens flare, not a bar that washes the frame.
    float bar = (spine * 0.22 + wide * 0.10) * (1.0 + 0.6 * uCrest);
    float a = bar * uOpacity;
    gl_FragColor = vec4(uColor * (1.0 + bar) * uOpacity, a);
  }
`;

export function SunFlare() {
  const group = useRef<THREE.Group>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const streakMat = useRef<THREE.ShaderMaterial>(null);
  const ghostsRef = useRef<THREE.Group>(null);

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uCrest: { value: 0 },
      uHalo: { value: new THREE.Color("#a9c6ff") }, // locked cool accent on halo
    }),
    []
  );
  const streakUniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uCrest: { value: 0 },
      uColor: { value: new THREE.Color("#bcd2ff") }, // cooler anamorphic smear (cold lens flare)
    }),
    []
  );

  // lens-flare ghosts: small additive discs strung along the sun→centre axis in
  // the group's local plane. Offsets are static; opacity rides the master window.
  const ghosts = useMemo(
    () => [
      { d: 0.45, s: 1.4, o: 0.18 },
      { d: -0.7, s: 2.2, o: 0.12 },
      { d: -1.5, s: 1.0, o: 0.16 },
    ],
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const p = flightState.progress; // == target (no 2nd lerp)
    const op = sunOpacity(p);
    g.visible = op > 0.001;
    if (!g.visible) return;

    // crest envelope — the bloom-up + streak-sweep at the level-pass (pure in p)
    const crest = sunCrest(p);

    // fixed world position; billboard to the camera so sprites face us
    g.position.set(SUN_OFFSET_X, SUN_OFFSET_Y, SUN_Z);
    g.quaternion.copy(state.camera.quaternion);

    if (coreMat.current) {
      coreMat.current.uniforms.uTime.value = state.clock.elapsedTime;
      coreMat.current.uniforms.uOpacity.value = op;
      coreMat.current.uniforms.uCrest.value = crest;
    }
    if (streakMat.current) {
      streakMat.current.uniforms.uOpacity.value = op;
      streakMat.current.uniforms.uCrest.value = crest;
    }
    // ghosts share the window opacity (set on their materials)
    const gh = ghostsRef.current;
    if (gh) {
      for (let i = 0; i < gh.children.length; i++) {
        const m = (gh.children[i] as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = op * ghosts[i].o;
      }
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* blazing white core + cool halo — sized so it blooms + looms as a distant
          flare without filling the frame (200→150 so the Strategy text stays clear) */}
      <mesh frustumCulled={false}>
        <planeGeometry args={[150, 150]} />
        <shaderMaterial
          ref={coreMat}
          vertexShader={coreVert}
          fragmentShader={coreFrag}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* anamorphic horizontal streak through the sun — sweeps across frame, but
          trimmed (760×180→560×140) so it reads as a flare, not a screen-wide bar */}
      <mesh frustumCulled={false} position={[0, 0, 0.1]}>
        <planeGeometry args={[560, 140]} />
        <shaderMaterial
          ref={streakMat}
          vertexShader={coreVert}
          fragmentShader={streakFrag}
          uniforms={streakUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* lens-flare ghosts along the local screen axis */}
      <group ref={ghostsRef}>
        {ghosts.map((gst, i) => (
          <mesh key={i} position={[gst.d * 78, gst.d * 26, 0.2]} frustumCulled={false}>
            <circleGeometry args={[gst.s * 7.0, 32]} />
            <meshBasicMaterial
              color="#a9c6ff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
