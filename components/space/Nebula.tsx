"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* Faint cold nebula: a layered bank of large ADDITIVE billboards that always sit
   ahead of the camera (a distant backdrop). Additive over black only ADDS light,
   so the deep blacks can't be lifted to grey. Cold steel tint, drifting slowly.
   A radial alpha falloff fades each plane's edges to nothing so the rectangular
   billboard seam never shows.

   DEEPENED OPENING: the bank is denser and larger than before (more planes, a
   vaster far-back wall) so the HERO void (p00–p12) reads as genuinely COSMIC —
   real cool structure at rest, not a clean black screen — establishing vastness
   BEFORE any motion. Plus ONE distant grand form (the silhouetted arc below) sits
   far down the axis so there is a monumental shape in the void from the first
   frame. All opacities stay tiny → additive contribution never lifts the blacks
   to grey. Monochrome cool only. */
const PLANES = [
  // near, sparse wisps
  { x: -34, y: 14, z: -40, s: 380, rot: 0.0, o: 0.10 },
  { x: 40, y: -12, z: -110, s: 600, rot: 1.1, o: 0.075 },
  { x: -10, y: 6, z: -180, s: 880, rot: 2.3, o: 0.05 },
  // mid bank — adds layered cool structure (deepens the field)
  { x: 56, y: 30, z: -260, s: 980, rot: 0.6, o: 0.045 },
  { x: -64, y: -34, z: -340, s: 1120, rot: 1.9, o: 0.04 },
  // vast far wall — establishes the SCALE of the void from the first frame
  { x: 8, y: 0, z: -460, s: 1700, rot: 0.3, o: 0.03 },
];

/* Soft circular alpha mask (white centre → transparent edge). Generated once;
   used as alphaMap so additive contribution tapers smoothly at the plane edge. */
function makeRadialAlpha() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.6)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

/* DISTANT GRAND FORM — one monumental silhouette far down the flight axis so the
   HERO void has a cosmic shape in it from the first frame (vastness BEFORE
   motion). A faint, vast curved arc (the rim of an unfathomable distant body /
   ring), painted procedurally: only a thin Gaussian arc emits a dim cool glow,
   everything else → 0. Additive over black → it can only add a whisper of light;
   opacity is tiny so the deep black never lifts to grey. Monochrome cool. */
const grandVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const grandFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    // a vast implicit circle whose centre is pushed off the quad → only a faint
    // near-straight arc crosses the frame (a distant titanic rim at rest).
    vec2 c = vec2(-0.55, -1.35);
    float R = 1.85;
    float dist = length(p - c);
    // thin dim arc glow (the lit rim) + a very soft inboard haze
    float arc = exp(-pow((dist - R) / 0.12, 2.0));
    float haze = smoothstep(R, R - 0.6, dist) * smoothstep(R - 1.4, R - 0.6, dist) * 0.25;
    // radial fade so the quad edge never shows
    float vign = 1.0 - smoothstep(0.7, 1.0, length(p));
    float glow = (arc * 0.9 + haze) * vign * uOpacity;
    gl_FragColor = vec4(uColor * glow, glow);
  }
`;

export function Nebula() {
  const group = useRef<THREE.Group>(null);
  const tex = useTexture("/img/space/nebula.jpg");
  const alpha = useMemo(() => makeRadialAlpha(), []);
  const grandUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#9fb8f0") }, // dim cool rim of the distant form
      uOpacity: { value: 0.32 }, // tiny — additive whisper, never lifts blacks to grey
    }),
    []
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // keep the nebula a fixed distance ahead of the camera → always a backdrop
    g.position.z = state.camera.position.z - 220;
    g.position.x = Math.sin(state.clock.elapsedTime * 0.02) * 5;
    g.position.y = Math.cos(state.clock.elapsedTime * 0.015) * 3;
  });

  return (
    <group ref={group}>
      {PLANES.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, 0, p.rot]}>
          <planeGeometry args={[p.s, p.s * 0.6]} />
          <meshBasicMaterial
            map={tex}
            alphaMap={alpha}
            transparent
            opacity={p.o}
            color="#7d92d4"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* DISTANT GRAND FORM — a vast faint cool arc deep down the axis, so the hero
          void has a monumental shape from the first frame (cosmic, not clean) */}
      <mesh position={[-36, -20, -540]}>
        <planeGeometry args={[1500, 1500]} />
        <shaderMaterial
          vertexShader={grandVert}
          fragmentShader={grandFrag}
          uniforms={grandUniforms}
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
