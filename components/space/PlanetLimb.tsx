"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { zOfP } from "./phase";

/* PLANET LIMB — the SCALE ANCHOR. A single COLOSSAL dark form: the edge of a vast
   unlit body, with only a thin bright rim-light (the terminator / limb) crossing
   one corner of the frame. It looms in the QUIET dark gap between beats 1 and 2
   (peak p ≈ 0.48), with black space all to itself, so it DWARFS the tiny
   FlowPanels — one massive thing against the void, NOT competing with the debris
   belt or the sun-flare (which now own later, separate p-windows).

   We render ONLY the lit limb, never a full sphere (anti-pattern #2): a big
   billboarded quad whose shader paints a curved bright arc (the rim where grazing
   light catches the body's edge) and lets everything on the body side fall to pure
   black. Additive over the void → only the bright crescent contributes light and
   blooms; the dark body adds nothing and simply OCCLUDES nothing (it's additive, so
   it reads as "the part of space behind the limb is black" — exactly the look of a
   body's night side against deep space). Monochrome: cool-white rim only.

   PURE-IN-P (anti-pattern #10): the limb sits at a FIXED world position off in one
   corner, deep along the flight axis (anchored via zOfP at its peak beat, same
   pattern as SunFlare). The camera z is a pure fn of p, so the limb naturally rises
   into frame, looms largest as the camera draws level, and slides off as the camera
   passes — pure camera geometry, no animation state. A master opacity window gates
   the group so it costs nothing outside the beat. uTime drives only a faint rim
   shimmer; it never touches the scrub. Scroll back up → it returns identically. */

/* QUIET-stretch window — pulled into the dark GAP between beats 1 (0.42) and 2
   (0.54), peaking ~0.48. This deliberately sits OFF the bright set-pieces: it
   ends (~0.53) before the debris belt's 0.555–0.645 window opens and well before
   the sun-flare's 0.60–0.74 window, so the colossal lit edge has black space all
   to itself and visibly DWARFS the small FlowPanels rather than competing with
   raking shards or a blaze. Beats 1 and 2 are in HOLD only at 0.40–0.44 / 0.52–
   0.56, so the loom crests cleanly in the dark between them. */
const LIMB_LO = 0.43;
const LIMB_HI = 0.53;
const LIMB_PEAK = 0.48; // p where the camera is level with the limb (max loom)

/* Fixed world position: deep along the flight axis, biased to the lower-left so the
   lit edge crosses ONE corner of the frame (it must not sit dead-centre). The body
   is enormous and positioned so its CENTRE is far off-screen — only the limb arc
   intrudes into frame, which is what sells the scale (you never see the whole
   thing). zOfP anchors it ahead of the peak camera z like SunFlare. */
const LIMB_LEAD = 86; // world units ahead of the peak camera z — NEARER than
// before (was 120) so the body LOOMS markedly larger and dominates the frame
const LIMB_OFFSET_X = -38; // pulled CLOSER to frame (was -52) so the lit edge
const LIMB_OFFSET_Y = -24; // crowds further into the corner and reads colossal
const LIMB_Z = zOfP(LIMB_PEAK) - LIMB_LEAD;
const LIMB_SIZE = 200; // quad size — vast, so the edge alone fills a frame corner

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* Master opacity: fade up, hold across the loom, fade out. Pure in p → reverses. */
function limbOpacity(p: number): number {
  if (p <= LIMB_LO || p >= LIMB_HI) return 0;
  const u = (p - LIMB_LO) / (LIMB_HI - LIMB_LO);
  const up = smoothstep(u / 0.25);
  const down = 1 - smoothstep((u - 0.75) / 0.25);
  return up * down;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Limb shader: the bright crescent at the edge of a vast sphere. We model an
   implicit circle (the body) centred OFF the quad; the lit rim is a thin band on
   the sun-facing side of that circle's boundary. Everything else (the body interior
   and the empty space beyond the rim) → 0, so the additive blend paints only the
   glowing arc. No square edge: the band is a smooth Gaussian on the radial
   distance, and a directional mask kills the far (dark) side of the limb. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uRim;
  void main() {
    // local quad coords in [-1,1]; the body's centre is pushed off toward the
    // lower-left so only its upper-right limb crosses the visible quad.
    vec2 p = (vUv - 0.5) * 2.0;
    vec2 bodyCenter = vec2(-0.85, -0.85); // off-quad → we only see one edge
    float bodyR = 1.55;                    // body radius (bigger than the quad)
    vec2 d = p - bodyCenter;
    float dist = length(d);

    // thin bright rim exactly at the body's boundary (Gaussian band)
    float rimW = 0.07;
    float rim = exp(-pow((dist - bodyR) / rimW, 2.0));

    // directional terminator: light grazes from the upper-right, so the rim is
    // brightest where the surface normal faces the light and dies on the night
    // side — gives the limb a real crescent falloff, not a full ring.
    vec2 lightDir = normalize(vec2(0.92, 0.7));
    float facing = clamp(dot(normalize(d), lightDir), 0.0, 1.0);
    float crescent = pow(facing, 1.4);

    // faint inner glow JUST inside the limb (atmosphere catch) on the lit side
    float inner = smoothstep(bodyR, bodyR - 0.18, dist) * smoothstep(bodyR - 0.5, bodyR - 0.18, dist);
    inner *= crescent * 0.25;

    // faint shimmer along the rim (cosmetic; uTime only — never touches p)
    float ang = atan(d.y, d.x);
    float shim = 0.9 + 0.1 * sin(ang * 6.0 + uTime * 0.4);

    // rim pushed HARD (was 1.6) so the lit crescent over-blooms and the colossal
    // edge reads as a blazing scale anchor against the black void. The COLOUR is
    // driven past 1.0 (additive → the bloom pass catches it), while the alpha is
    // clamped so the dark body side never paints a square.
    float intensity = (rim * 2.6 + inner) * crescent * shim;
    intensity *= uOpacity;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(uRim * intensity * 1.35, a);
  }
`;

export function PlanetLimb() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uRim: { value: new THREE.Color("#cfe0ff") }, // cool-white limb (monochrome)
    }),
    []
  );

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;
    const p = flightState.progress; // == target (no 2nd lerp)
    const op = limbOpacity(p);
    g.visible = op > 0.001;
    if (!g.visible) return;

    // fixed world position; billboard to the camera so the flat limb faces us as
    // the camera glides past (pure camera geometry drives the loom/sweep).
    g.position.set(LIMB_OFFSET_X, LIMB_OFFSET_Y, LIMB_Z);
    g.quaternion.copy(state.camera.quaternion);

    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uOpacity.value = op;
  });

  return (
    <group ref={group} visible={false}>
      <mesh frustumCulled={false}>
        <planeGeometry args={[LIMB_SIZE, LIMB_SIZE]} />
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
