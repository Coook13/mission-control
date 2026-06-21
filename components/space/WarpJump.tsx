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
  attribute float aRank;    // 0..1 activation rank — low ranks switch on first
  uniform float uTime;
  uniform float uWarp;      // 0..1 master intensity (warpAt(p))
  uniform float uCamZ;      // camera z this frame (drives the pure wrap)
  uniform float uWrapDepth; // depth of the rolling streak band
  uniform float uWrapMargin;// how far behind the camera the band ends
  varying float vBright;
  varying float vWarp;
  varying float vShim;
  varying vec2  vDir;       // screen-space radial direction (vanishing-point → out)
  void main() {
    // Wrap each streak's base z into a band ahead of the camera — identical
    // pure-in-camZ scheme as the starfield, so it reverses exactly and never
    // depletes. Streaks fill a WIDE cone so, projected, they blanket the whole
    // frame and rake past the lens edges — a tunnel, not a centred tube.
    float top = uCamZ + uWrapMargin;
    float zWrapped = top - mod(top - position.z, uWrapDepth);
    vec3 pos = vec3(position.x, position.y, zWrapped);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    gl_Position = clip;
    float dist = -mv.z;

    // COVERAGE rides warp: at low warp only the lowest-ranked streaks light, and
    // the field thickens toward a full tunnel as warp → 1 (coverage AND length
    // both driven by warpAt, per the contract). gate is a soft per-streak ramp.
    float gate = smoothstep(aRank - 0.18, aRank, uWarp * 1.18);

    // Sprite grows hard toward the camera AND elongates with warp — the long
    // streaks are the warp's signature. Both size and the fragment stretch scale
    // with uWarp so the tunnel both fills and lengthens as we punch into warp.
    float size = (10.0 + aLen * 96.0) * (0.35 + uWarp * 0.85);
    gl_PointSize = clamp(size * (260.0 / dist), 0.0, 220.0);

    // screen-space radial direction from the vanishing point (clip-space centre)
    // so each sprite stretches OUTWARD — the radiating light-speed look.
    vec2 ndc = clip.xy / max(clip.w, 1e-3);
    vDir = normalize(ndc + 1e-4);

    vBright = aBright;
    vShim = 0.7 + 0.3 * sin(uTime * 6.0 + aSeed);
    // fade streaks very near the lens (no blown-out wall) and at the far wrap
    // seam (no pop). Same shaping idea as the starfield vFade.
    float near = smoothstep(1.0, 14.0, dist);
    float far = 1.0 - smoothstep(uWrapDepth * 0.72, uWrapDepth, dist);
    vWarp = uWarp * gate * near * far;
  }
`;

const warpFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vBright;
  varying float vWarp;
  varying float vShim;
  varying vec2  vDir;
  void main() {
    // Stretch the sprite ALONG the screen-space radial direction (vDir) so every
    // streak smears outward from the vanishing point — dense + additive this
    // reads as a full-frame light-speed tunnel, not vertical rain. The smear
    // length grows with warp so the tunnel lengthens as we punch into it.
    vec2 c = gl_PointCoord - 0.5;
    vec2 dir = normalize(vDir);
    vec2 perp = vec2(-dir.y, dir.x);
    float along = dot(c, dir);
    float across = dot(c, perp);
    // longer along the streak as warp climbs (3.2..6.5×), thin across → a ribbon
    float stretch = 3.4 + vWarp * 3.1;
    vec2 e = vec2(along / 1.0, across * stretch);
    float d = length(e);
    if (d > 0.5) discard;
    float core = pow(smoothstep(0.5, 0.0, d), 2.0);
    // a hotter spine right down the streak axis for the bloomed light-speed core
    float spine = exp(-pow(across * stretch / 0.22, 2.0)) * smoothstep(0.5, 0.0, abs(along));
    float a = (core + spine * 0.8) * vBright * vShim * vWarp;
    // push the brightest cores >1 so ONLY the warp blooms (blacks stay black)
    vec3 col = uColor * (0.6 + vBright * 0.9) * (1.0 + vWarp * 0.7);
    gl_FragColor = vec4(col, a);
  }
`;

export function WarpJump({ count = 5200, tube = 64, depth = 280 }: { count?: number; tube?: number; depth?: number }) {
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

  const { positions, lens, brights, seeds, ranks } = useMemo(() => {
    const rand = mulberry32(count * 1013904223 + 7);
    const positions = new Float32Array(count * 3);
    const lens = new Float32Array(count);
    const brights = new Float32Array(count);
    const seeds = new Float32Array(count);
    const ranks = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // fill a WIDE cone around the flight axis — flat radial distribution (not
      // centre-biased) so the projected streaks blanket the whole frame, edges
      // included, and rake past the lens like a tunnel rather than a tube.
      const ang = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * tube; // uniform areal fill out to the rim
      positions[i * 3] = Math.cos(ang) * r;
      positions[i * 3 + 1] = Math.sin(ang) * r * 0.9;
      positions[i * 3 + 2] = rand() * depth; // wrapped per-frame in the shader
      lens[i] = 0.4 + rand() * rand() * 1.1; // longer mean length, fat tail
      brights[i] = 0.35 + rand() * 0.65;
      seeds[i] = rand() * 6.283;
      ranks[i] = rand(); // activation rank — coverage thickens as warp climbs
    }
    return { positions, lens, brights, seeds, ranks };
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
        <bufferAttribute attach="attributes-aRank" args={[ranks, 1]} />
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
