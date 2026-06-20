"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* The glowing black-hole ring that stands in for the O of WORK. A fullscreen
   quad shader (camera-independent) drawing a bright event-horizon rim + photon
   ring + a soft accretion glow with a rotating Doppler-bright side and a dark
   core. Additive over a transparent canvas so it sits in the wordmark and the
   starfield reads around it. */
const vert = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = uTime * 0.25;
    float r0 = 0.62;
    float rim = exp(-pow((r - r0) / 0.045, 2.0));
    float photon = exp(-pow((r - (r0 - 0.07)) / 0.016, 2.0)) * 0.85;
    float glow = exp(-pow((r - r0) / 0.22, 2.0));
    float side = 0.5 + 0.5 * cos(ang - t * 2.0);
    float dopp = 0.62 + 0.5 * side;                 // brighter approaching side
    float shim = 0.9 + 0.1 * sin(ang * 5.0 - t * 3.0);
    vec3 cool = vec3(0.72, 0.84, 1.0);
    vec3 warm = vec3(1.0, 0.83, 0.6);
    vec3 col = mix(cool, warm, side * 0.55);
    float core = smoothstep(0.30, 0.52, r);         // pure black inside
    float intensity = (rim * 1.8 + photon * 1.5 + glow * 0.5) * dopp * shim * core;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col * intensity, a);
  }
`;

function Ring() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
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
  );
}

export function HeroBlackHole({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={{ position: "absolute", inset: 0 }}
        frameloop="always"
      >
        <Ring />
      </Canvas>
    </div>
  );
}
