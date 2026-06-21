"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./rng";
import { makeStarUniforms, starFragment, starVertex } from "./starMaterial";

/* The flythrough star field: soft round twinkling points filling a long box
   ahead of the camera. The rendered z of every star is a PURE FUNCTION of the
   camera z — wrapped into a rolling band in the vertex shader (see
   starMaterial) — so the field is identical scrubbing forward AND backward and
   never depletes on reverse scroll (BUG 2). No mutated position buffer.
   Varied size/brightness/tint give real depth. Uses the built-in
   <shaderMaterial> (no extend needed). */
export function Starfield({ count = 6500, spread = 180, depth = 360 }: { count?: number; spread?: number; depth?: number }) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => makeStarUniforms(), []);

  const { positions, sizes, brights, seeds, tints } = useMemo(() => {
    const rand = mulberry32(count * 2654435761);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brights = new Float32Array(count);
    const seeds = new Float32Array(count);
    const tints = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * spread;
      positions[i * 3 + 1] = (rand() - 0.5) * spread * 0.62;
      // base z spans one band width; the vertex shader wraps it relative to the
      // camera each frame (pure f(camZ)), so this is just a uniform seed in [0,depth)
      positions[i * 3 + 2] = rand() * depth;
      const r = rand();
      sizes[i] = 0.45 + r * r * 1.7;
      brights[i] = 0.28 + rand() * 0.72;
      seeds[i] = rand() * 6.283;
      tints[i] = rand() * rand();
    }
    return { positions, sizes, brights, seeds, tints };
  }, [count, spread, depth]);

  useFrame((state) => {
    const m = mat.current as THREE.ShaderMaterial | null;
    if (!m || !m.uniforms || !m.uniforms.uTime) return;
    // Feed the camera z to the shader; the wrap is a pure function of it, so no
    // position buffer is mutated and the field reverses exactly (BUG 2 fix).
    const t = state.clock.elapsedTime;
    m.uniforms.uTime.value = t;
    m.uniforms.uFar.value = depth;
    m.uniforms.uCamZ.value = state.camera.position.z;
    m.uniforms.uWrapDepth.value = depth;

    // AMBIENT drift — a tiny, time-based lateral sway of the WHOLE field so the
    // deep space breathes even when the user isn't scrolling. This only nudges the
    // group's x/y by a sub-unit amount (z-wrap stays a pure function of camera z,
    // untouched), and it never reads or feeds the scroll progress p — so the
    // scrub-and-reverse contract holds; this is purely additive idle life. Two
    // slow incommensurate sines → a gentle, non-repeating sway.
    const pts = points.current;
    if (pts) {
      pts.position.x = Math.sin(t * 0.061) * 0.9 + Math.sin(t * 0.027 + 2.1) * 0.4;
      pts.position.y = Math.cos(t * 0.048 + 0.7) * 0.7 + Math.sin(t * 0.019) * 0.3;
    }
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBright" args={[brights, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
