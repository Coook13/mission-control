"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* Screen-space starfield: points placed uniformly across clip space so fine
   dust fills the WHOLE frame evenly (a perspective field clusters toward the
   vanishing point — this doesn't). Two parallax depths drift toward the
   pointer; a few bright stars exceed 1.0 so only they bloom. */
const vert = `
  attribute float aSize;
  attribute float aBright;
  attribute float aSeed;
  attribute float aDepth;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPix;
  varying float vB;
  varying float vSeed;
  void main() {
    float par = aDepth > 1.5 ? 0.035 : 0.014;
    vec2 p = position.xy + uMouse * par;
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = aSize * uPix;
    vB = aBright;
    vSeed = aSeed;
  }
`;
const frag = `
  precision highp float;
  uniform float uTime;
  varying float vB;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.8);
    float tw = 0.68 + 0.32 * sin(uTime * 1.5 + vSeed);
    float b = vB * tw;
    vec3 col = vec3(0.84, 0.9, 1.0) * b;
    col *= 1.0 + step(0.86, vB) * 1.4;   // brightest few bloom
    gl_FragColor = vec4(col, clamp(a * (b + 0.25), 0.0, 1.0));
  }
`;

export function HeroStarfield({ count = 1600 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPix: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
    }),
    []
  );

  const { positions, sizes, brights, seeds, depths } = useMemo(() => {
    let s = 99173;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brights = new Float32Array(count);
    const seeds = new Float32Array(count);
    const depths = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rnd() * 2 - 1; // clip-space x  [-1,1]
      positions[i * 3 + 1] = rnd() * 2 - 1; // clip-space y  [-1,1]
      positions[i * 3 + 2] = 0;
      const big = rnd();
      sizes[i] = 1.0 + big * big * 3.2; // mostly small, a few large
      brights[i] = 0.22 + rnd() * (big > 0.92 ? 0.95 : 0.5);
      seeds[i] = rnd() * 6.283;
      depths[i] = rnd() < 0.7 ? 1 : 2;
    }
    return { positions, sizes, brights, seeds, depths };
  }, [count]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.04;
    m.y += (m.ty - m.y) * 0.04;
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime;
      (mat.current.uniforms.uMouse.value as THREE.Vector2).set(m.x, m.y);
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBright" args={[brights, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aDepth" args={[depths, 1]} />
      </bufferGeometry>
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
    </points>
  );
}
