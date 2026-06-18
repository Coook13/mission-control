"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { PrimitiveRocket } from "./PrimitiveRocket";

useGLTF.preload("/models/rocket.glb");

/* If the model loads nose-down, flip it. Tunable after a visual check. */
const NOSE_FLIP = false;

/* The GLB rocket, normalized to the SAME convention as PrimitiveRocket:
   centred at the origin, ~5 units tall, nose toward +Y, flame at -Y. The parent
   (RocketModel) then places/poses/scales it identically to the primitive. */
function GltfRocket() {
  const { scene } = useGLTF("/models/rocket.glb");
  const flame = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);

  const model = useMemo(() => {
    const s = scene.clone(true);
    s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    s.position.set(-center.x, -center.y, -center.z); // recentre at origin
    // clone materials (don't mutate the cached GLB) + keep linear (flat canvas)
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.material) {
        const m = (mesh.material as THREE.Material).clone();
        m.toneMapped = false;
        mesh.material = m;
      }
    });
    // orient the longest axis to +Y (nose up)
    const inner = new THREE.Group();
    inner.add(s);
    if (size.z >= size.y && size.z >= size.x) inner.rotation.x = -Math.PI / 2;
    else if (size.x >= size.y && size.x >= size.z) inner.rotation.z = Math.PI / 2;
    if (NOSE_FLIP) inner.rotateX(Math.PI);
    const k = 5.0 / Math.max(size.x, size.y, size.z);
    const g = new THREE.Group();
    g.add(inner);
    g.scale.setScalar(k);
    return g;
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const warp = flightState.warp;
    const f = 1 + Math.sin(t * 30) * 0.13 + Math.sin(t * 17.3) * 0.09 + warp * 1.6;
    if (flame.current) flame.current.scale.set(1, f, 1);
    if (flame2.current) flame2.current.scale.set(1, 0.8 + (f - 1) * 0.6, 1);
  });

  return (
    <group>
      <primitive object={model} />
      <mesh ref={flame} position={[0, -2.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 1.7, 24]} />
        <meshBasicMaterial color="#ff9a3c" transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flame2} position={[0, -2.35, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.17, 0.95, 20]} />
        <meshBasicMaterial color="#cfe9ff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* Falls back to the hand-built primitive if the GLB 404s / fails to parse. */
class RocketErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RocketVisual() {
  return (
    <RocketErrorBoundary fallback={<PrimitiveRocket />}>
      <Suspense fallback={<PrimitiveRocket />}>
        <GltfRocket />
      </Suspense>
    </RocketErrorBoundary>
  );
}
