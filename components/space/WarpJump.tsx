"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./rng";
import { flightState } from "./flightState";
import { warpAt } from "./phase";

/* WARP JUMP — light-speed streak ribbons that bloom up in the two warp windows
   (warpAt(p), pure-in-p, owned by phase.ts). Built fresh (the old WarpStreaks
   was deleted): a single THREE.Points cloud, additively blended, where each
   point is stretched into a forward-pointing STREAK in the vertex+fragment
   shaders the harder the warp intensity climbs. Cold-white only (monochrome).

   Reversibility (anti-pattern #10): every per-frame value is a pure function of
   p. Like the Starfield, each streak's z is wrapped relative to the camera via
   mod() (no mutated buffer, no integrated state), and the master intensity is
   warpAt(p). Scroll back up and the warp re-blooms identically. uTime drives
   only a cosmetic shimmer; it never touches the scrub.

   Cheap + windowed: when warpAt(p) ≈ 0 the whole object is hidden (visible=false)
   so it costs nothing during the long non-warp stretches. Matches the
   Starfield/starMaterial point-sprite style (radial soft sprite, built-in
   <shaderMaterial>, no drei extend). */

const warpVertex = /* glsl */ `
  attribute float aLen;     // per-streak length multiplier (varied)
  attribute float aBright;  // per-streak brightness
  attribute float aSeed;    // shimmer phase
  uniform float uTime;
  uniform float uWarp;      // 0..1 master intensity (warpAt(p))
  uniform float uCamZ;      // camera z this frame (drives the pure wrap)
  uniform float uWrapDepth; // depth of the rolling streak band
  uniform float uWrapMargin;// how far behind the camera the band ends
  varying float vBright;
  varying float vWarp;
  varying float vShim;
  void main() {
    // Wrap each streak's base z into a band ahead of the camera — identical
    // pure-in-camZ scheme as the starfield, so it reverses exactly and never
    // depletes. Streaks live in a tighter tube around the flight axis so they
    // rake past close to the camera and read as speed.
    float top = uCamZ + uWrapMargin;
    float zWrapped = top - mod(top - position.z, uWrapDepth);
    vec3 pos = vec3(position.x, position.y, zWrapped);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;

    // points grow toward the camera; the streak look comes from aLen + the
    // fragment alpha (we keep this a Points cloud for cheapness, the ribbon
    // illusion is the dense additive overlap when uWarp is high).
    float size = (4.0 + aLen * 26.0) * uWarp;
    gl_PointSize = clamp(size * (120.0 / dist), 0.0, 64.0);

    vBright = aBright;
    vWarp = uWarp;
    vShim = 0.7 + 0.3 * sin(uTime * 6.0 + aSeed);
    // fade streaks that are very near (avoid a blown-out wall right on the lens)
    // and far (no wrap pop) — same shaping idea as the starfield vFade.
    float near = smoothstep(1.0, 10.0, dist);
    float far = 1.0 - smoothstep(uWrapDepth * 0.7, uWrapDepth, dist);
    vWarp *= near * far;
  }
`;

const warpFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vBright;
  varying float vWarp;
  varying float vShim;
  void main() {
    // Vertically-squashed sprite → an elongated vertical glint that, dense and
    // additive, reads as a forward warp streak. Soft radial falloff like the
    // star sprite so there is never a hard square edge.
    vec2 c = gl_PointCoord - 0.5;
    // squash X so the sprite is a tall thin streak (anisotropic falloff)
    c.x *= 3.2;
    float d = length(c);
    if (d > 0.5) discard;
    float core = pow(smoothstep(0.5, 0.0, d), 2.2);
    float a = core * vBright * vShim * vWarp;
    // push the brightest cores >1 so ONLY the warp blooms (blacks stay black)
    vec3 col = uColor * (0.6 + vBright * 0.9) * (1.0 + vWarp * 0.6);
    gl_FragColor = vec4(col, a);
  }
`;

export function WarpJump({ count = 1400, tube = 26, depth = 280 }: { count?: number; tube?: number; depth?: number }) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uCamZ: { value: 0 },
      uWrapDepth: { value: depth },
      uWrapMargin: { value: 6 },
      uColor: { value: new THREE.Color("#d6e6ff") }, // cool-white accent
    }),
    [depth]
  );

  const { positions, lens, brights, seeds } = useMemo(() => {
    const rand = mulberry32(count * 1013904223 + 7);
    const positions = new Float32Array(count * 3);
    const lens = new Float32Array(count);
    const brights = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // cluster streaks in a tube around the flight axis: bias toward the centre
      // (r = R * sqrt-ish) so most streaks rake close past the camera.
      const ang = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.7) * tube;
      positions[i * 3] = Math.cos(ang) * r;
      positions[i * 3 + 1] = Math.sin(ang) * r * 0.85;
      positions[i * 3 + 2] = rand() * depth; // wrapped per-frame in the shader
      lens[i] = 0.3 + rand() * rand();
      brights[i] = 0.35 + rand() * 0.65;
      seeds[i] = rand() * 6.283;
    }
    return { positions, lens, brights, seeds };
  }, [count, tube, depth]);

  useFrame((state) => {
    const m = mat.current;
    const pts = points.current;
    if (!m || !pts || !m.uniforms.uWarp) return;
    const w = warpAt(flightState.progress); // pure fn of p (== target)
    // hide entirely outside the warp windows → costs nothing during the cruise
    pts.visible = w > 0.001;
    if (!pts.visible) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uWarp.value = w;
    m.uniforms.uCamZ.value = state.camera.position.z;
  });

  return (
    <points ref={points} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aLen" args={[lens, 1]} />
        <bufferAttribute attach="attributes-aBright" args={[brights, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={warpVertex}
        fragmentShader={warpFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
