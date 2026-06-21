"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { zOfP } from "./phase";

/* MEGASTRUCTURE — the MONSTROUS scale anchor. A single COLOSSAL silhouette the
   camera threads PAST/THROUGH in one HELD window: a titanic broken ring-arc /
   Dyson-segment edge so vast that its curvature reads as a near-STRAIGHT band
   crossing the frame edge-to-edge. The camera threads the GAP — the dark body
   fills most of the view and only a thin cool rim-light catches the bloom.

   This is the partner to PlanetLimb (which is a CORNER crescent). MegaStructure
   is FRAME-FILLING: where PlanetLimb's curve reads as a planet's edge in one
   corner, this body is so large that, this close, its boundary is almost a
   straight architectural line cutting across the whole frame — a wall of dark
   matter with a glowing structural seam. It sells "this object is bigger than
   anything we can see in one look."

   Placement: the slow BREATHE stretch between beat 0 (0.30) and beat 1 (0.42),
   peaking ~0.35 — the calm dark gap where no other big set-piece plays (debris
   0.555+, limb 0.43+, sun 0.60+, warp-1 ends 0.285). Pairing the monumental
   DWELL with the monumental OBJECT: the camera is moving slowest here (seg-1 is
   the calm settle), so the colossal body holds in frame and is felt, not flashed.

   We render ONLY the dark form + its lit seam, never a solid lit slab
   (anti-pattern #4/#5): a big billboarded quad whose shader paints
     - a thin Gaussian RIM along the near-straight structural boundary (the only
       thing that emits light → blooms),
     - a faint catch-glow just inside the rim on the lit side,
     - everything else (the deep body interior, the open gap beyond) → 0.
   Additive over the void: the dark body contributes NOTHING (so it reads as
   "space behind the structure is black"), only the seam glows. Monochrome:
   cool-white rim only (#cfe0ff), cores stay white-hot under bloom.

   PURE-IN-P (anti-pattern #10): the structure sits at a FIXED world position deep
   along the flight axis (anchored via zOfP at its peak, same pattern as
   PlanetLimb/SunFlare). The camera z is a pure fn of p, so the body naturally
   rises into frame, looms to fill it as the camera draws level (threading the
   gap), then slides behind — pure camera geometry, no animation state. A master
   opacity window gates the whole group → zero cost outside the window. uTime
   drives only a faint seam shimmer; it never touches the scrub. Scroll back up →
   it returns identically. Billboards to the camera so the flat seam always faces
   us, with a small lead so it's read as "ahead and to one side", then passed. */

/* BREATHE-stretch window — the calm dark gap between beat 0 (0.30) and beat 1
   (0.42), peaking ~0.35. Beats 0 and 1 are in HOLD only at 0.28–0.32 / 0.40–0.44,
   so the colossal seam crests cleanly in the dark mid-stretch (~0.33–0.37) where
   no FlowPanel is being read and no other set-piece competes. */
const MEGA_LO = 0.295;
const MEGA_HI = 0.405;
const MEGA_PEAK = 0.35; // p where the camera is level with the structure (max loom)

/* Fixed world position: deep along the flight axis, biased slightly off-axis so
   the structural seam crosses the frame off-centre (it must not sit dead-centre —
   the camera threads the GAP beside it). NEAR lead so the body looms enormous and
   the curve flattens to a near-straight line. zOfP anchors it ahead of the peak
   camera z like PlanetLimb/SunFlare. */
const MEGA_LEAD = 70; // world units ahead of the peak camera z — near, so it LOOMS
const MEGA_OFFSET_X = 18; // biased to the right so the gap the camera threads is left-of-centre
const MEGA_OFFSET_Y = -6;
const MEGA_Z = zOfP(MEGA_PEAK) - MEGA_LEAD;
const MEGA_SIZE = 460; // FRAME-FILLING — far larger than PlanetLimb's quad so it spans edge-to-edge

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* Master opacity: fade up, hold across the thread-through, fade out. Pure in p. */
function megaOpacity(p: number): number {
  if (p <= MEGA_LO || p >= MEGA_HI) return 0;
  const u = (p - MEGA_LO) / (MEGA_HI - MEGA_LO);
  const up = smoothstep(u / 0.28);
  const down = 1 - smoothstep((u - 0.72) / 0.28);
  return up * down;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Megastructure shader: the lit structural SEAM of a titanic curved body whose
   radius is so vast (relative to the quad) that its boundary reads as a NEAR-
   STRAIGHT line crossing the frame. We model an implicit circle with an enormous
   radius and a centre pushed far off-quad; near the quad the arc is almost flat —
   a wall of dark structure with one glowing edge. A second, inner parallel seam
   (a structural rib) and a couple of bright "node" lights along the seam add the
   built / engineered read (Dyson-segment, not a planet). Everything off the seam
   → 0, so additive paints only the glow; the dark body adds nothing. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uRim;
  void main() {
    // local quad coords in [-1,1]
    vec2 p = (vUv - 0.5) * 2.0;

    // TITANIC implicit circle: centre pushed far below the quad and a HUGE radius,
    // so the boundary that crosses the quad is almost a straight horizontal line
    // (the curve is barely perceptible — that's what sells the monstrous scale).
    vec2 bodyCenter = vec2(0.15, -7.4); // far below → only the near-flat top edge shows
    float bodyR = 8.05;                 // vast radius → boundary ≈ straight band
    vec2 d = p - bodyCenter;
    float dist = length(d);

    // primary structural SEAM — thin bright Gaussian band exactly at the boundary
    float seamW = 0.045;
    float seam = exp(-pow((dist - bodyR) / seamW, 2.0));

    // a faint parallel inner RIB just inside the body (engineered structure, not a
    // smooth planet limb) — dimmer, slightly inboard of the main seam
    float ribW = 0.035;
    float rib = exp(-pow((dist - (bodyR - 0.22)) / ribW, 2.0)) * 0.4;

    // catch-glow JUST inside the seam on the lit side (the structure face catching
    // grazing light) — a soft inboard falloff, never reaching the deep interior
    float inner = smoothstep(bodyR, bodyR - 0.28, dist) * smoothstep(bodyR - 0.9, bodyR - 0.28, dist);
    inner *= 0.22;

    // bright structural NODE lights strung along the seam (beacons on a megastructure)
    // — periodic hot points modulated along the angular coordinate of the arc.
    float ang = atan(d.y, d.x);
    float nodes = pow(0.5 + 0.5 * sin(ang * 80.0), 24.0); // sparse sharp peaks
    nodes *= seam; // only where the seam is, so nodes sit ON the edge
    // gentle drift of the node beacons (cosmetic; uTime only — never touches p)
    float beacon = 0.7 + 0.3 * sin(ang * 80.0 - uTime * 0.5);
    nodes *= beacon;

    // faint shimmer along the seam (cosmetic; uTime only)
    float shim = 0.9 + 0.1 * sin(p.x * 9.0 + uTime * 0.35);

    // seam pushed hard >1 so the structural edge over-blooms; nodes punch hotter
    // still. Colour driven past 1.0 (additive → bloom catches it); alpha clamped
    // so the dark body side never paints a square.
    float glow = (seam * 2.2 + rib + inner) * shim + nodes * 4.0;
    glow *= uOpacity;
    float a = clamp(glow, 0.0, 1.0);
    gl_FragColor = vec4(uRim * glow * 1.3, a);
  }
`;

export function MegaStructure() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uRim: { value: new THREE.Color("#cfe0ff") }, // cool-white seam (monochrome)
    }),
    []
  );

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const p = flightState.progress; // == target (no 2nd lerp)
    const op = megaOpacity(p);
    g.visible = op > 0.001;
    if (!g.visible) return;

    // fixed world position; billboard to the camera so the flat seam faces us as
    // the camera threads past (pure camera geometry drives the loom/sweep).
    g.position.set(MEGA_OFFSET_X, MEGA_OFFSET_Y, MEGA_Z);
    g.quaternion.copy(state.camera.quaternion);

    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uOpacity.value = op;
  });

  return (
    <group ref={group} visible={false}>
      <mesh frustumCulled={false}>
        <planeGeometry args={[MEGA_SIZE, MEGA_SIZE]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
