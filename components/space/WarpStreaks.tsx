"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./rng";
import { flightState } from "./flightState";

/* Light-speed streaks. A camera-following field of additive ribbons that
   stretch along the flight axis as `uWarp` ramps — points→long streaks rushing
   past during the warp-in / warp-out windows, invisible during cruise.
   Ribbons are built in the vertex shader from a head/tail pair projected to
   screen space (full width control, no unreliable gl_LineWidth). Additive over
   near-black, alpha×uWarp, base brightness kept modest so Bloom (threshold
   0.9) doesn't smear the frame to grey. */
const COUNT = 1200;
const SPREAD = 110; // x/y disc radius around the flight axis
const DEPTH = 220; // local z range the streaks occupy (recycled by uFlow)

const vertex = /* glsl */ `
  uniform float uWarp;
  uniform float uFlow;
  uniform vec2 uViewport;
  attribute float aEnd;    // 0 = head, 1 = tail
  attribute float aSide;   // -1 / +1 (ribbon edges)
  attribute float aBright;
  varying float vAlpha;
  void main() {
    // flow the base z toward the camera so streaks rush past
    float zf = mod(position.z + uFlow, ${DEPTH.toFixed(1)}) - ${DEPTH.toFixed(1)}; // [-DEPTH, 0) ahead
    vec3 head = vec3(position.x, position.y, zf);
    float len = (0.5 + aBright) * (2.0 + uWarp * 60.0);
    vec3 tail = head + vec3(0.0, 0.0, len); // trail toward +z (behind)
    vec4 hC = projectionMatrix * modelViewMatrix * vec4(head, 1.0);
    vec4 tC = projectionMatrix * modelViewMatrix * vec4(tail, 1.0);
    vec2 hN = hC.xy / hC.w;
    vec2 tN = tC.xy / tC.w;
    vec2 dir = (tN - hN) * uViewport;
    float dl = length(dir);
    dir = dl > 0.0001 ? dir / dl : vec2(1.0, 0.0);
    vec2 perp = vec2(-dir.y, dir.x) / uViewport;
    vec4 clip = mix(hC, tC, aEnd);
    clip.xy += perp * 1.3 * aSide * clip.w;
    gl_Position = clip;
    float ahead = smoothstep(6.0, -4.0, head.z); // fade as it passes the camera
    vAlpha = aBright * uWarp * (1.0 - aEnd * 0.82) * ahead;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  uniform vec3 uColor;
  void main() {
    if (vAlpha <= 0.001) discard;
    gl_FragColor = vec4(uColor * vAlpha, vAlpha);
  }
`;

export function WarpStreaks() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { geo, uniforms } = useMemo(() => {
    const rand = mulberry32(20260618);
    const verts = COUNT * 4;
    const positions = new Float32Array(verts * 3);
    const aEnd = new Float32Array(verts);
    const aSide = new Float32Array(verts);
    const aBright = new Float32Array(verts);
    const index = new Uint32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.sqrt(rand()) * SPREAD;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.72;
      const z = -rand() * DEPTH;
      const b = 0.3 + rand() * 0.7;
      for (let v = 0; v < 4; v++) {
        const o = i * 4 + v;
        positions[o * 3] = x;
        positions[o * 3 + 1] = y;
        positions[o * 3 + 2] = z;
        aEnd[o] = v >= 2 ? 1 : 0;
        aSide[o] = v % 2 === 0 ? -1 : 1;
        aBright[o] = b;
      }
      const base = i * 4;
      const io = i * 6;
      index[io] = base;
      index[io + 1] = base + 1;
      index[io + 2] = base + 2;
      index[io + 3] = base + 1;
      index[io + 4] = base + 3;
      index[io + 5] = base + 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(aEnd, 1));
    g.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));
    g.setAttribute("aBright", new THREE.BufferAttribute(aBright, 1));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    const uniforms = {
      uWarp: { value: 0 },
      uFlow: { value: 0 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uColor: { value: new THREE.Color("#bcd2ff") },
    };
    return { geo: g, uniforms };
  }, []);

  useFrame((state, dt) => {
    const m = ref.current;
    const u = mat.current?.uniforms;
    if (!m || !u) return;
    const w = flightState.warp;
    m.visible = w > 0.001;
    if (!m.visible) return;
    m.position.copy(state.camera.position); // field follows the camera
    u.uWarp.value = w;
    u.uFlow.value = (u.uFlow.value + dt * 95) % DEPTH;
    u.uViewport.value.set(state.size.width, state.size.height);
  });

  return (
    <mesh ref={ref} geometry={geo} frustumCulled={false} visible={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
